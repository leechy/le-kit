/**
 * Post-build script to create core and admin bundles.
 *
 * After Stencil builds the dist-custom-elements output, this script:
 * 1. Creates dist/core/ with transformed components (admin wrappers stripped)
 * 2. Creates dist/admin/ with all components unchanged
 *
 * The core build transforms components to remove le-component and le-slot wrappers,
 * so the admin UI code is completely absent from the production bundle.
 *
 * Run: node scripts/bundle-targets.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Components that are admin-only (excluded from core build entirely)
const ADMIN_ONLY_COMPONENTS = ['le-component', 'le-slot'];

/**
 * Convert component name to PascalCase
 */
function toPascalCase(name) {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Get all component names from dist/components
 * 
 * Stencil creates chunk files like le-button2.js that contain bundled code.
 * We identify actual component files by checking for matching .d.ts files,
 * which only exist for real component exports.
 */
function getBuiltComponents() {
  const componentsDir = path.join(rootDir, 'dist', 'components');
  if (!fs.existsSync(componentsDir)) {
    console.error('❌ dist/components not found. Run stencil build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(componentsDir);
  
  // Get all .d.ts files (these indicate real component exports)
  const dtsFiles = new Set(
    files
      .filter(file => file.startsWith('le-') && file.endsWith('.d.ts'))
      .map(file => file.replace('.d.ts', ''))
  );

  // Return component names that have both .js and .d.ts files
  return files
    .filter(file => file.startsWith('le-') && file.endsWith('.js') && !file.includes('.d.'))
    .map(file => file.replace('.js', ''))
    .filter(name => dtsFiles.has(name));
}

/**
 * Transform component JS to strip admin wrappers (le-component, le-slot)
 *
 * Transformations:
 * 1. h("le-component", { hostClass: X, ... }, children) → h(Host, { class: X }, children)
 * 2. h("le-slot", { ... }, child) → child (unwrap to just the slot element)
 * 3. CSS: :host>le-component.X → :host.X
 * 4. Remove le-component and le-slot from defineCustomElement dependencies
 */
function transformCoreComponent(code, componentName) {
  let transformed = code;

  // 1. Transform h("le-component", ...) → h(Host, { class: hostClass }, ...)
  // Find h("le-component" and extract the hostClass value, then replace the whole call
  transformed = transformLeComponent(transformed);

  // 2. Transform h("le-slot", { ... }, child) → child
  // Unwrap le-slot to just render its child (the actual <slot> element)
  transformed = transformLeSlot(transformed);

  // 3. Transform CSS selectors: :host>le-component.X → :host.X
  transformed = transformed.replace(/:host\s*>\s*le-component\.([a-zA-Z0-9_-]+)/g, ':host.$1');
  transformed = transformed.replace(/:host\s*>\s*le-component\s+\./g, ':host .');
  transformed = transformed.replace(/:host\s*>\s*le-component\s/g, ':host ');

  // 4. Remove le-component and le-slot from defineCustomElement dependencies
  transformed = transformed.replace(/case "le-component":\s*if \(!customElements\.get\(tagName\)\) \{\s*defineCustomElement\$\d+\(\);\s*\}\s*break;\s*/g, '');
  transformed = transformed.replace(/case "le-slot":\s*if \(!customElements\.get\(tagName\)\) \{\s*defineCustomElement\$\d+\(\);\s*\}\s*break;\s*/g, '');

  // Remove from components array
  transformed = transformed.replace(/const components = \[([^\]]+)\]/g, (match, componentsList) => {
    const filtered = componentsList
      .split(',')
      .map(s => s.trim())
      .filter(s => !s.includes('"le-component"') && !s.includes('"le-slot"'))
      .join(', ');
    return `const components = [${filtered}]`;
  });

  return transformed;
}

/**
 * Transform h("le-component", { ... hostClass: X ... }, children) → h(Host, { class: X }, children)
 */
function transformLeComponent(code) {
  let result = '';
  let i = 0;

  while (i < code.length) {
    // Look for h("le-component"
    const marker = 'h("le-component"';
    const idx = code.indexOf(marker, i);

    if (idx === -1) {
      result += code.slice(i);
      break;
    }

    // Add everything before this match
    result += code.slice(i, idx);

    // Find the props object and extract hostClass
    const propsStart = code.indexOf('{', idx);
    const propsEnd = findMatchingBrace(code, propsStart);
    const propsStr = code.slice(propsStart + 1, propsEnd); // Inside the braces

    // Extract hostClass value - it's after "hostClass:" and ends at the next top-level comma or end of props
    const hostClassIdx = propsStr.indexOf('hostClass:');
    let hostClass = '""';

    if (hostClassIdx !== -1) {
      // Start after 'hostClass:'
      let valueStart = hostClassIdx + 'hostClass:'.length;
      while (propsStr[valueStart] === ' ') valueStart++;

      // Find the end of the value - could be a function call with nested parens/braces
      hostClass = extractValue(propsStr, valueStart);
    }

    // Find where the children start (after the props object and comma)
    let childrenStart = propsEnd + 1;
    while (childrenStart < code.length && (code[childrenStart] === ',' || code[childrenStart] === ' ')) {
      childrenStart++;
    }

    // Find the closing paren for the entire h() call
    const hCallEnd = findMatchingParen(code, idx + 1);

    // Extract children
    const children = code.slice(childrenStart, hCallEnd);

    // Build replacement: h(Host, { class: hostClass }, children)
    // Note: we preserve the closing paren by outputting it after children
    result += `h(Host, { class: ${hostClass} }, ${children})`;

    i = hCallEnd + 1;
  }

  return result;
}

/**
 * Extract a value from a props string starting at the given index.
 * Handles nested parentheses, braces, and function calls.
 */
function extractValue(propsStr, startIdx) {
  let depth = 0;
  let braceDepth = 0;
  let i = startIdx;

  while (i < propsStr.length) {
    const char = propsStr[i];

    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;

    // End of value: comma at top level, or end of props
    if (depth === 0 && braceDepth === 0 && char === ',') {
      break;
    }

    // End of props object
    if (depth === 0 && braceDepth < 0) {
      break;
    }

    i++;
  }

  return propsStr.slice(startIdx, i).trim();
}

/**
 * Transform h("le-slot", { ... }, child) → child
 */
function transformLeSlot(code) {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const marker = 'h("le-slot"';
    const idx = code.indexOf(marker, i);

    if (idx === -1) {
      result += code.slice(i);
      break;
    }

    // Add everything before this match
    result += code.slice(i, idx);

    // Find the props object
    const propsStart = code.indexOf('{', idx);
    const propsEnd = findMatchingBrace(code, propsStart);

    // Find where the child starts (after the props and comma)
    let childStart = propsEnd + 1;
    while (code[childStart] === ',' || code[childStart] === ' ') {
      childStart++;
    }

    // Find the end of the h("le-slot", ...) call
    const hCallEnd = findMatchingParen(code, idx + 1);

    // Extract the child (everything between childStart and hCallEnd)
    const child = code.slice(childStart, hCallEnd);

    // Replace with just the child
    result += child;

    i = hCallEnd + 1;
  }

  return result;
}

/**
 * Find the index of the closing brace that matches the opening brace at startIdx
 */
function findMatchingBrace(code, startIdx) {
  if (code[startIdx] !== '{') return -1;

  let depth = 1;
  let i = startIdx + 1;

  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }

  return i - 1;
}

/**
 * Find the index of the closing paren for an h() call starting at the 'h'
 */
function findMatchingParen(code, hIdx) {
  // Find the opening paren after 'h'
  let i = hIdx;
  while (i < code.length && code[i] !== '(') i++;

  if (i >= code.length) return -1;

  let depth = 1;
  i++;

  while (i < code.length && depth > 0) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') depth--;
    i++;
  }

  return i - 1;
}

/**
 * Transform the Stencil-generated index.js to remove admin component exports
 * This removes export lines for le-component and le-slot
 */
function transformIndexFile(content) {
  let result = content;
  
  // Remove export lines for admin-only components
  for (const adminComponent of ADMIN_ONLY_COMPONENTS) {
    const pascalName = toPascalCase(adminComponent);
    
    // Remove: export { LeComponent, defineCustomElement as defineCustomElementLeComponent } from './le-component.js';
    const exportRegex = new RegExp(
      `export\\s*\\{[^}]*${pascalName}[^}]*\\}\\s*from\\s*['"]\\.\\/${adminComponent}\\.js['"];?\\s*\\n?`,
      'g'
    );
    result = result.replace(exportRegex, '');
  }
  
  return result;
}

/**
 * Copy and transform a file for the core build
 */
function copyAndTransformFile(srcPath, destPath, transform = false) {
  let content = fs.readFileSync(srcPath, 'utf-8');

  if (transform && srcPath.endsWith('.js')) {
    const componentName = path.basename(srcPath, '.js');
    content = transformCoreComponent(content, componentName);
  }

  fs.writeFileSync(destPath, content);
}

/**
 * Generate bundle entry file content
 */
function generateBundleContent(components, isAdmin, useLocalComponents = false) {
  const filteredComponents = isAdmin ? components : components.filter(name => !ADMIN_ONLY_COMPONENTS.includes(name));

  const componentPath = useLocalComponents ? './components' : '../components';
  const imports = filteredComponents.map(name => `import { ${toPascalCase(name)} } from '${componentPath}/${name}.js';`).join('\n');

  const exports = filteredComponents.map(name => `  ${toPascalCase(name)},`).join('\n');

  const defineEntries = filteredComponents.map(name => `    ['${name}', ${toPascalCase(name)}],`).join('\n');

  const runtimePath = useLocalComponents ? './stencil-runtime.js' : '../components/index.js';

  return `/**
 * Le-Kit ${isAdmin ? 'Admin' : 'Core'} Bundle
 * ${isAdmin ? 'Includes all components with admin mode support' : 'Production build with admin UI code removed'}
 * 
 * Auto-generated by scripts/bundle-targets.mjs
 */

// Import Stencil runtime
export { setAssetPath } from '${runtimePath}';

// Component imports
${imports}

// Component exports
export {
${exports}
};

/**
 * Define all ${isAdmin ? '' : 'core '}components on the CustomElementRegistry
 * @param {Window} [win=window] - The window object to use
 */
export function defineCustomElements(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return;
  
  const components = [
${defineEntries}
  ];

  for (const [name, constructor] of components) {
    if (!win.customElements.get(name)) {
      win.customElements.define(name, constructor);
    }
  }
}
`;
}

/**
 * Generate TypeScript declaration file
 */
function generateDtsContent(components, isAdmin, useLocalComponents = false) {
  const filteredComponents = isAdmin ? components : components.filter(name => !ADMIN_ONLY_COMPONENTS.includes(name));

  const componentPath = useLocalComponents ? './components' : '../components';
  const exports = filteredComponents.map(name => `export { ${toPascalCase(name)} } from '${componentPath}/${name}';`).join('\n');

  const runtimePath = useLocalComponents ? './stencil-runtime' : '../components/index';

  return `/**
 * Le-Kit ${isAdmin ? 'Admin' : 'Core'} Bundle Type Definitions
 * Auto-generated by scripts/bundle-targets.mjs
 */

export { setAssetPath } from '${runtimePath}';

${exports}

export declare function defineCustomElements(win?: Window): void;
`;
}

/**
 * Main function
 */
function createBundles() {
  console.log('📦 Creating core and admin bundles...');

  const components = getBuiltComponents();
  const coreComponents = components.filter(c => !ADMIN_ONLY_COMPONENTS.includes(c));
  console.log(`   Found ${components.length} built components`);
  console.log(`   Core components: ${coreComponents.length} (excluding ${ADMIN_ONLY_COMPONENTS.join(', ')})`);

  const srcComponentsDir = path.join(rootDir, 'dist', 'components');

  // === Create dist/core with transformed components ===
  const coreDir = path.join(rootDir, 'dist', 'core');
  const coreComponentsDir = path.join(coreDir, 'components');

  // Clean and create directories
  if (fs.existsSync(coreDir)) {
    fs.rmSync(coreDir, { recursive: true });
  }
  fs.mkdirSync(coreComponentsDir, { recursive: true });

  // Copy and transform component files (excluding admin-only components)
  let transformedCount = 0;
  for (const file of fs.readdirSync(srcComponentsDir)) {
    const srcPath = path.join(srcComponentsDir, file);
    const destPath = path.join(coreComponentsDir, file);

    // Skip admin-only component files (but keep chunk files they may depend on)
    const componentName = file.replace(/\.(js|d\.ts)$/, '');
    if (ADMIN_ONLY_COMPONENTS.includes(componentName)) {
      continue;
    }

    // Check if this file needs transformation (contains admin component references)
    const content = fs.readFileSync(srcPath, 'utf-8');
    const needsTransform = content.includes('"le-component"') || content.includes('"le-slot"');

    if (needsTransform && file.endsWith('.js') && !file.endsWith('.d.ts')) {
      copyAndTransformFile(srcPath, destPath, true);
      transformedCount++;
    } else if (file === 'index.js') {
      // Transform index.js to remove admin component exports
      const transformedIndex = transformIndexFile(content);
      fs.writeFileSync(destPath, transformedIndex);
    } else {
      // Copy as-is (including .d.ts files, runtime files, etc.)
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Copy the stencil runtime file (p-*.js) and rename for clarity
  const runtimeFiles = fs.readdirSync(srcComponentsDir).filter(f => f.startsWith('p-') && f.endsWith('.js'));
  for (const runtimeFile of runtimeFiles) {
    fs.copyFileSync(path.join(srcComponentsDir, runtimeFile), path.join(coreComponentsDir, runtimeFile));
  }

  // Create core index
  const coreContent = generateBundleContent(components, false, true);
  fs.writeFileSync(path.join(coreDir, 'index.js'), coreContent);
  fs.writeFileSync(path.join(coreDir, 'index.d.ts'), generateDtsContent(components, false, true));

  // Copy the runtime export from components/index.js
  const runtimeExports = `export { setAssetPath } from './components/index.js';`;
  fs.writeFileSync(path.join(coreDir, 'stencil-runtime.js'), runtimeExports);

  console.log(`   ✅ Created dist/core/ (${coreComponents.length} components, ${transformedCount} transformed)`);

  // Create auto-register entry for core (import 'le-kit/core' auto-registers)
  const coreAutoRegister = `/**
 * Le-Kit Core - Auto-registering entry point
 * Import this file to automatically register all core components
 * 
 * Usage: import 'le-kit/core';
 */
import { defineCustomElements } from './index.js';
defineCustomElements();
export * from './index.js';
`;
  fs.writeFileSync(path.join(coreDir, 'loader.js'), coreAutoRegister);

  // === Create dist/admin (unchanged components) ===
  const adminDir = path.join(rootDir, 'dist', 'admin');
  if (fs.existsSync(adminDir)) {
    fs.rmSync(adminDir, { recursive: true });
  }
  fs.mkdirSync(adminDir, { recursive: true });

  // Generate admin bundle (points to original dist/components)
  const adminContent = generateBundleContent(components, true, false);
  fs.writeFileSync(path.join(adminDir, 'index.js'), adminContent);
  fs.writeFileSync(path.join(adminDir, 'index.d.ts'), generateDtsContent(components, true, false));

  console.log(`   ✅ Created dist/admin/ (${components.length} components)`);

  // Create auto-register entry for admin
  const adminAutoRegister = `/**
 * Le-Kit Admin - Auto-registering entry point
 * Import this file to automatically register all admin components
 * 
 * Usage: import 'le-kit/admin';
 */
import { defineCustomElements } from './index.js';
defineCustomElements();
export * from './index.js';
`;
  fs.writeFileSync(path.join(adminDir, 'loader.js'), adminAutoRegister);

  console.log('');
  console.log('✨ Bundles created successfully!');
  console.log('');
  console.log('Usage:');
  console.log('  Core (production):  import { defineCustomElements } from "le-kit/core"');
  console.log('  Admin (CMS):        import { defineCustomElements } from "le-kit/admin"');
}

// Run
createBundles();

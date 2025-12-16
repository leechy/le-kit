import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const destDir = path.join(rootDir, 'src-core');

console.log('Preparing core build...');

// 1. Copy src to src-core
if (fs.existsSync(destDir)) {
  console.log('Cleaning previous src-core...');
  fs.rmSync(destDir, { recursive: true, force: true });
}
console.log('Copying src to src-core...');
fs.cpSync(srcDir, destDir, { recursive: true });

// 2. Remove admin components
const componentsDir = path.join(destDir, 'components');
const adminComponents = ['le-component', 'le-slot'];

adminComponents.forEach(comp => {
  const compPath = path.join(componentsDir, comp);
  if (fs.existsSync(compPath)) {
    console.log('Removing ' + comp + '...');
    fs.rmSync(compPath, { recursive: true, force: true });
  }
});

// 3. Process files
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  if (filePath.endsWith('.tsx')) {
    // Pass 1: le-slot -> unwrap
    // Remove self-closing le-slot
    content = content.replace(/<le-slot[^>]*\/>/g, '');
    // Remove opening tag
    content = content.replace(/<le-slot[^>]*>/g, '');
    // Remove closing tag
    content = content.replace(/<\/le-slot>/g, '');
    
    // Pass 2: le-component
    let hostCount = 0;
    
    // Handle self-closing le-component (unlikely but possible)
    content = content.replace(/<le-component([\s\S]*?)\/>/g, (match, attrs) => {
      const hasHostClass = attrs.includes('hostClass=');
      const hasHostStyle = attrs.includes('hostStyle=');
      
      if (hasHostClass || hasHostStyle) {
        hostCount++; // Though self-closing Host is rare/useless usually
        let newAttrs = attrs;
        newAttrs = newAttrs.replace(/component="[^"]*"/, '');
        newAttrs = newAttrs.replace(/component='[^']*'/, '');
        newAttrs = newAttrs.replace(/hostClass=/g, 'class=');
        newAttrs = newAttrs.replace(/hostStyle=/g, 'style=');
        return '<Host' + newAttrs + '/>';
      } else {
        return '';
      }
    });

    // Handle opening tag
    content = content.replace(/<le-component([\s\S]*?)>/g, (match, attrs) => {
      // Skip if it ends with / (already handled)
      if (match.trim().endsWith('/>')) return match;

      const hasHostClass = attrs.includes('hostClass=');
      const hasHostStyle = attrs.includes('hostStyle=');
      
      if (hasHostClass || hasHostStyle) {
        hostCount++;
        let newAttrs = attrs;
        newAttrs = newAttrs.replace(/component="[^"]*"/, '');
        newAttrs = newAttrs.replace(/component='[^']*'/, '');
        newAttrs = newAttrs.replace(/hostClass=/g, 'class=');
        newAttrs = newAttrs.replace(/hostStyle=/g, 'style=');
        return '<Host' + newAttrs + '>';
      } else {
        return '';
      }
    });
    
    // Handle closing tag
    if (hostCount > 0) {
      content = content.replace(/<\/le-component>/g, '</Host>');
    } else {
      content = content.replace(/<\/le-component>/g, '');
    }
    
    // Ensure Host is imported if used
    if (content.includes('<Host') && !originalContent.includes('<Host')) {
       if (!content.includes('Host } from') && !content.includes('Host,') && !content.includes(', Host')) {
           content = content.replace(/import {([^}]*)} from '@stencil\/core';/, (match, imports) => {
             return 'import {' + imports + ', Host } from \'@stencil/core\';';
           });
       }
    }
  } else if (filePath.endsWith('.css')) {
    // Pass 3: CSS selectors
    // :host > le-component.CLASS -> :host(.CLASS)
    content = content.replace(/:host\s*>\s*le-component\.([a-zA-Z0-9_.-]+)/g, ':host(.$1)');
    // :host > le-component -> :host
    content = content.replace(/:host\s*>\s*le-component/g, ':host');
    // le-slot > -> (remove le-slot parent)
    content = content.replace(/le-slot\s*>\s*/g, '');
  }
  
  if (content !== originalContent) {
    console.log('Processed ' + path.basename(filePath));
    fs.writeFileSync(filePath, content);
  }
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.css')) {
      processFile(filePath);
    }
  }
}

processDir(componentsDir);
console.log('Core build preparation complete.');

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const CEM_PATH = path.join(ROOT_DIR, 'src/assets/custom-elements.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'LLM_CONTEXT.md');

function run() {
  if (!fs.existsSync(CEM_PATH)) {
    console.error(`Error: Custom Elements Manifest not found at ${CEM_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(CEM_PATH, 'utf-8'));

  if (!manifest.modules) {
    console.error('Error: Invalid manifest format (no modules found)');
    process.exit(1);
  }

  const components = [];

  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;

    for (const decl of mod.declarations) {
      if (decl.tagName || decl.customElement) {
        components.push(decl);
      }
    }
  }

  components.sort((a, b) => (a.tagName || '').localeCompare(b.tagName || ''));

  const markdown = generateMarkdown(components);
  fs.writeFileSync(OUTPUT_PATH, markdown);
  console.log(`Successfully generated ${OUTPUT_PATH}`);
}

function generateMarkdown(components) {
  let md = '# Le-Kit Component Reference\n\n';
  md +=
    'This file is auto-generated and contains documentation for all Le-Kit web components. It is intended to be used as context for AI coding assistants.\n\n';

  md += '## Table of Contents\n\n';
  components.forEach(c => {
    if (c.tagName) {
      md += `- [${c.tagName}](#${c.tagName})\n`;
    }
  });

  md += '\n---\n\n';

  components.forEach(c => {
    if (!c.tagName) return;

    md += `## <${c.tagName}>\n\n`;

    if (c.description) {
      md += `${c.description.trim()}\n\n`;
    }

    // Props
    const props = (c.members || []).filter(
      m => m.kind === 'field' && !m.static && m.privacy !== 'private' && m.privacy !== 'protected',
    );
    if (props.length > 0) {
      md += '### Properties\n\n';
      md += '| Name | Type | Default | Description |\n';
      md += '|------|------|---------|-------------|\n';

      props.forEach(p => {
        // Skip internal state users shouldn't touch
        if (p.name.startsWith('_')) return;

        const name = `\`${p.name}\``;
        const type = p.type ? `\`${p.type.text.replace(/\|/g, '\\|')}\`` : '';
        const def = p.default ? `\`${p.default}\`` : '';
        const desc = (p.description || '').replace(/\n/g, ' ');

        md += `| ${name} | ${type} | ${def} | ${desc} |\n`;
      });
      md += '\n';
    }

    // Events
    if (c.events && c.events.length > 0) {
      md += '### Events\n\n';
      md += '| Event | Type | Description |\n';
      md += '|-------|------|-------------|\n';

      c.events.forEach(e => {
        const name = `\`${e.name}\``;
        const type = e.type ? `\`${e.type.text.replace(/\|/g, '\\|')}\`` : '';
        const desc = (e.description || '').replace(/\n/g, ' ');

        md += `| ${name} | ${type} | ${desc} |\n`;
      });
      md += '\n';
    }

    // Slots
    if (c.slots && c.slots.length > 0) {
      md += '### Slots\n\n';
      md += '| Name | Description |\n';
      md += '|------|-------------|\n';

      c.slots.forEach(s => {
        const name = s.name ? `\`"${s.name}"\`` : 'Default';
        const desc = (s.description || '').replace(/\n/g, ' ');

        md += `| ${name} | ${desc} |\n`;
      });
      md += '\n';
    }

    // CSS Custom Properties
    if (c.cssProperties && c.cssProperties.length > 0) {
      md += '### CSS Variables\n\n';
      md += '| Name | Description |\n';
      md += '|------|-------------|\n';

      c.cssProperties.forEach(css => {
        const name = `\`${css.name}\``;
        const desc = (css.description || '').replace(/\n/g, ' ');

        md += `| ${name} | ${desc} |\n`;
      });
      md += '\n';
    }

    md += '---\n\n';
  });

  return md;
}

run();

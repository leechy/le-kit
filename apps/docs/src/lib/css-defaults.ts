/**
 * Default values of a component's CSS custom properties, read from its own CSS,
 * so the docs never drift from the code.
 *
 * - `declared`: set in a top-level `:host { … }` block;
 * - `fallback`: not set, but used as `var(--name, <fallback>)`;
 * - `inherited`: used without a fallback — comes from the theme or an ancestor;
 * - `unused`: never used by the component (a documented variable that does nothing).
 */
export type CssDefault =
  | { kind: 'declared'; value: string }
  | { kind: 'fallback'; value: string }
  | { kind: 'inherited' }
  | { kind: 'unused' };

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The text inside the parentheses that open at `open` (index of `(`). */
function balanced(css: string, open: number): string | undefined {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '(') depth++;
    else if (css[i] === ')' && --depth === 0) return css.slice(open + 1, i);
  }
  return undefined;
}

/** Declarations of top-level `:host { … }` blocks (not `:host(…)`). */
function hostDeclarations(css: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const block of css.matchAll(/(?:^|})\s*:host\s*\{([^}]*)\}/g)) {
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(name, value.trim().replace(/\s+/g, ' '));
    }
  }
  return declarations;
}

export function cssDefault(source: string, name: string): CssDefault {
  const css = stripComments(source);

  const declared = hostDeclarations(css).get(name);
  if (declared !== undefined) return { kind: 'declared', value: declared };

  const usage = new RegExp(`var\\(\\s*${escape(name)}\\s*[,)]`).exec(css);
  if (!usage) return { kind: 'unused' };

  const inside = balanced(css, css.indexOf('(', usage.index)) ?? '';
  const comma = inside.indexOf(',');
  if (comma === -1) return { kind: 'inherited' };
  return { kind: 'fallback', value: inside.slice(comma + 1).trim().replace(/\s+/g, ' ') };
}

/** Names of the custom properties a value refers to, in order, without duplicates. */
export function tokensIn(value: string): string[] {
  return [...new Set([...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))];
}

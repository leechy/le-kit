/**
 * URL hash handling for component pages.
 *
 * `#api`, `#roadmap`, `#playground` select a tab; `#recipe-<id>` selects a
 * playground recipe; anything else is an anchor id (e.g. `#@variant`), and the
 * page opens whichever tab contains that element.
 */

export type PageTab = 'playground' | 'api' | 'roadmap';

export type HashTarget =
  | { kind: 'tab'; tab: PageTab }
  | { kind: 'recipe'; id: string }
  | { kind: 'anchor'; id: string }
  | { kind: 'none' };

const TABS: readonly PageTab[] = ['playground', 'api', 'roadmap'];
const RECIPE_PREFIX = 'recipe-';

export function parseHash(hash: string): HashTarget {
  let value: string;
  try {
    value = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return { kind: 'none' };
  }

  if (!value) return { kind: 'none' };
  if ((TABS as readonly string[]).includes(value)) return { kind: 'tab', tab: value as PageTab };
  if (value.startsWith(RECIPE_PREFIX)) {
    const id = value.slice(RECIPE_PREFIX.length);
    return id ? { kind: 'recipe', id } : { kind: 'none' };
  }
  return { kind: 'anchor', id: value };
}

export function hashForTab(tab: PageTab): string {
  return tab === 'playground' ? '' : `#${tab}`;
}

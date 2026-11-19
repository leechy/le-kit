/**
 * URL hash handling for component pages.
 *
 * `#playground`, `#properties`, `#events`, `#slots`, `#styles`, `#roadmap` select a
 * tab (`#api`, the old single API tab, opens `#properties`); `#recipe-<id>` selects a
 * playground recipe; anything else is an anchor id (e.g. `#@variant`), and the
 * page opens whichever tab contains that element.
 */

export type PageTab = 'playground' | 'properties' | 'events' | 'slots' | 'styles' | 'roadmap';

export type HashTarget =
  | { kind: 'tab'; tab: PageTab }
  | { kind: 'recipe'; id: string }
  | { kind: 'anchor'; id: string }
  | { kind: 'none' };

const TABS: readonly PageTab[] = ['playground', 'properties', 'events', 'slots', 'styles', 'roadmap'];
/** Old tab names, kept so existing links still work. */
const TAB_ALIASES: Record<string, PageTab> = { api: 'properties' };
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
  if (Object.hasOwn(TAB_ALIASES, value)) return { kind: 'tab', tab: TAB_ALIASES[value] };
  if (value.startsWith(RECIPE_PREFIX)) {
    const id = value.slice(RECIPE_PREFIX.length);
    return id ? { kind: 'recipe', id } : { kind: 'none' };
  }
  return { kind: 'anchor', id: value };
}

export function hashForTab(tab: PageTab): string {
  return tab === 'playground' ? '' : `#${tab}`;
}

/** The first recipe is the default view of the page, so it keeps a clean URL. */
export function hashForRecipe(id: string, isFirst: boolean): string {
  return isFirst ? '' : `#${RECIPE_PREFIX}${id}`;
}

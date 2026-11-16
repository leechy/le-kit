import { parseHash, hashForTab, hashForRecipe, type PageTab } from '../../lib/page-hash';

const CODE_LINES_SHOWN = 3;

/**
 * Recipe switching in the playground. Recipes are items of a le-navigation in
 * the recipes side panel; the stage, the note and the code are swapped from
 * server-rendered <template>s.
 * Returns `select(id)`, which falls back to the first recipe for unknown ids.
 */
export function initRecipes(playground: HTMLElement) {
  const nav = playground.querySelector<HTMLElement & { activeUrl?: string }>('[data-recipe-nav]');
  const panel = playground.querySelector<HTMLElement & { open?: boolean }>('[data-recipe-panel]');
  const items = [...playground.querySelectorAll<HTMLElement>('le-item[data-recipe]')];
  const stage = playground.querySelector<HTMLElement>('[data-stage-content]');
  const note = playground.querySelector<HTMLElement>('[data-recipe-note]');
  const code = playground.querySelector<HTMLElement>('[data-code]');
  const codeTarget = playground.querySelector<HTMLElement>('[data-code-target]');
  const codeToggle = playground.querySelector<HTMLElement>('[data-code-toggle]');
  const recipeSelect = playground.querySelector<HTMLElement & { value?: unknown }>('[data-recipe-select]');
  const firstId = items[0]?.dataset.recipe ?? '';

  const find = (attr: string, id: string) =>
    playground.querySelector<HTMLTemplateElement>(`template[${attr}="${CSS.escape(id)}"]`);

  const setCodeExpanded = (expanded: boolean) => {
    if (!code || !codeToggle) return;
    code.toggleAttribute('data-clipped', !expanded && code.hasAttribute('data-has-more'));
    codeToggle.textContent = expanded ? 'Show less' : 'Show all code';
  };

  const select = (id: string, updateUrl = false) => {
    const template = find('data-recipe-template', id) ?? find('data-recipe-template', firstId);
    if (!template || !stage) return;
    const selectedId = template.dataset.recipeTemplate!;

    stage.replaceChildren(template.content.cloneNode(true));
    if (note) {
      const title = document.createElement('strong');
      title.textContent = `${template.dataset.title}.`;
      note.replaceChildren(title, ` ${template.dataset.note ?? ''}`);
    }

    const codeTemplate = find('data-recipe-code', selectedId);
    if (codeTemplate && codeTarget && code) {
      codeTarget.replaceChildren(codeTemplate.content.cloneNode(true));
      code.toggleAttribute('data-has-more', Number(codeTemplate.dataset.lines) > CODE_LINES_SHOWN);
      setCodeExpanded(false);
    }

    // le-navigation marks the item whose href equals activeUrl.
    if (nav) nav.activeUrl = `#recipe-${selectedId}`;
    // The select that replaces the panel when it is hidden shows the same recipe.
    if (recipeSelect && recipeSelect.value !== selectedId) recipeSelect.value = selectedId;

    if (updateUrl) {
      const hash = hashForRecipe(selectedId, selectedId === firstId);
      history.replaceState(null, '', hash || location.pathname + location.search);
    }
  };

  // Recipes are links (#recipe-…), but switching must not add history entries.
  nav?.addEventListener('leNavItemSelect', (event) => {
    const href = (event as CustomEvent<{ href?: string }>).detail?.href ?? '';
    const target = parseHash(href);
    if (target.kind !== 'recipe') return;
    event.preventDefault();
    select(target.id, true);
    // On narrow screens the panel is an overlay — close it after picking.
    if (panel?.open) panel.open = false;
  });

  recipeSelect?.addEventListener('leChange', (event) => {
    const value = (event as CustomEvent<{ value?: unknown }>).detail?.value;
    if (typeof value === 'string') select(value, true);
  });

  codeToggle?.addEventListener('click', () => setCodeExpanded(code?.hasAttribute('data-clipped') ?? false));

  select(firstId);
  return { select, firstId };
}

/**
 * Keeps the component page tabs and the URL hash in sync:
 * - on load and on `hashchange`, the hash selects a tab (or the tab that
 *   contains the anchored element) and scrolls to the anchor;
 * - switching tabs rewrites the hash without adding history entries.
 */
type StencilElement = HTMLElement & { componentOnReady?: () => Promise<unknown> };

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export function initComponentPageTabs(
  tabs: StencilElement,
  recipes?: { select: (id: string) => void; firstId: string },
) {
  const select = (tab: PageTab) => {
    if (tabs.getAttribute('selected') !== tab) tabs.setAttribute('selected', tab);
  };

  /** Scroll once the tabs have rendered the newly selected panel. */
  const scrollToWhenShown = async (element: HTMLElement) => {
    await customElements.whenDefined('le-tabs');
    await tabs.componentOnReady?.();
    await nextFrame();
    await nextFrame();
    element.scrollIntoView({ block: 'start' });
  };

  const applyHash = () => {
    const target = parseHash(location.hash);

    switch (target.kind) {
      case 'tab':
        select(target.tab);
        return;
      case 'recipe':
        select('playground');
        recipes?.select(target.id);
        return;
      case 'anchor': {
        const element = document.getElementById(target.id);
        const panel = element?.closest('le-tab-panel');
        const tab = panel?.getAttribute('value') as PageTab | null;
        select(tab ?? 'playground');
        if (element) void scrollToWhenShown(element);
        return;
      }
      default:
        select('playground');
    }
  };

  tabs.addEventListener('leTabChange', (event) => {
    const tab = (event as CustomEvent<{ value?: string }>).detail?.value as PageTab | undefined;
    if (!tab) return;
    const hash = hashForTab(tab);
    if (hash === location.hash || (!hash && !location.hash)) return;
    history.replaceState(null, '', hash || location.pathname + location.search);
  });

  window.addEventListener('hashchange', applyHash);
  applyHash();
}

import { parseHash, hashForTab, hashForRecipe, type PageTab } from '../../lib/page-hash';

/**
 * Recipe switching in the playground: the list of recipe buttons, the stage
 * and the note are swapped from server-rendered <template>s.
 * Returns `select(id)`, which falls back to the first recipe for unknown ids.
 */
export function initRecipes(playground: HTMLElement) {
  const buttons = [...playground.querySelectorAll<HTMLElement>('[data-recipe]')];
  const stage = playground.querySelector<HTMLElement>('[data-stage-content]');
  const note = playground.querySelector<HTMLElement>('[data-recipe-note]');
  const firstId = buttons[0]?.dataset.recipe ?? '';

  const select = (id: string, updateUrl = false) => {
    const template =
      playground.querySelector<HTMLTemplateElement>(`template[data-recipe-template="${CSS.escape(id)}"]`) ??
      playground.querySelector<HTMLTemplateElement>(`template[data-recipe-template="${CSS.escape(firstId)}"]`);
    if (!template || !stage) return;
    const selectedId = template.dataset.recipeTemplate!;

    stage.replaceChildren(template.content.cloneNode(true));
    if (note) {
      const title = document.createElement('strong');
      title.textContent = `${template.dataset.title}.`;
      note.replaceChildren(title, ` ${template.dataset.note ?? ''}`);
    }
    for (const button of buttons) button.toggleAttribute('selected', button.dataset.recipe === selectedId);

    if (updateUrl) {
      const hash = hashForRecipe(selectedId, selectedId === firstId);
      history.replaceState(null, '', hash || location.pathname + location.search);
    }
  };

  for (const button of buttons) {
    button.addEventListener('click', () => select(button.dataset.recipe!, true));
  }

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

import { parseHash, hashForTab, type PageTab } from '../../lib/page-hash';

/**
 * Keeps the component page tabs and the URL hash in sync:
 * - on load and on `hashchange`, the hash selects a tab (or the tab that
 *   contains the anchored element) and scrolls to the anchor;
 * - switching tabs rewrites the hash without adding history entries.
 */
type StencilElement = HTMLElement & { componentOnReady?: () => Promise<unknown> };

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export function initComponentPageTabs(tabs: StencilElement) {
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
        // Recipe selection comes with the recipes column (layer 2).
        select('playground');
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

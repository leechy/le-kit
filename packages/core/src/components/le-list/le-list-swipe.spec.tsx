import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver, mockResizeObserver } from '../../utils/test-helpers';
import { LeList } from './le-list';
import type { LeListAction } from '../../types/list';

beforeAll(() => {
  mockMutationObserver();
  mockResizeObserver();
});

const data = [
  { id: 'opp-1', label: 'Nordic Scan', data: { read: false } },
  { id: 'opp-2', label: 'Precision Metrology', data: { read: true } },
];

function swipeActions(handlers: Record<string, any> = {}): LeListAction[] {
  return [
    { id: 'mark-read', label: 'Read', swipe: 'start', fullSwipe: true, hidden: (item: any) => item.data?.read, handler: handlers.read },
    { id: 'mark-unread', label: 'Unread', swipe: 'start', fullSwipe: true, hidden: (item: any) => !item.data?.read },
    { id: 'reject', label: 'Reject', swipe: 'end', selectionMode: 'single' },
    { id: 'delete', label: 'Delete', swipe: 'end', fullSwipe: true, selectionMode: 'both', handler: handlers.delete },
    { id: 'export', label: 'Export' },
  ];
}

async function renderList(attrs = 'layout="cards" selection="multiple" item-context-menu', actions = swipeActions()) {
  const page = await newSpecPage({
    components: [LeList],
    html: `<le-list id="list" ${attrs}></le-list>`,
  });
  const list = page.rootInstance as LeList;
  list.actions = actions;
  list.data = data;
  await page.waitForChanges();
  return { page, list, root: page.root!.shadowRoot! };
}

const swipeOf = (root: ShadowRoot, id: string) =>
  root.querySelector(`.le-list-row-main[data-row-id="${id}"] le-swipe`) as any;

describe('le-list swipe actions', () => {
  it('wraps cards with le-swipe holding the swipe actions of each item', async () => {
    const { root } = await renderList();

    const first = swipeOf(root, 'opp-1');
    expect(first).not.toBeNull();
    expect(first.startActions.map((a: any) => [a.id, a.full])).toEqual([['mark-read', true]]);
    expect(first.endActions.map((a: any) => a.id)).toEqual(['reject', 'delete']);

    // The read/unread toggle follows each item's own state
    expect(swipeOf(root, 'opp-2').startActions.map((a: any) => a.id)).toEqual(['mark-unread']);
  });

  it('evaluates swipe actions for the swiped card alone, not the current selection', async () => {
    const { page, list, root } = await renderList();
    list.selectedRowIds = ['opp-1', 'opp-2'];
    await page.waitForChanges();

    // 'reject' needs exactly one item: disabled for the selection, enabled for a single card
    const reject = swipeOf(root, 'opp-1').endActions.find((a: any) => a.id === 'reject');
    expect(reject.disabled).toBe(false);
  });

  it('runs the swiped action on that card only', async () => {
    const remove = jest.fn();
    const { page, list, root } = await renderList(undefined, swipeActions({ delete: remove }));
    list.selectedRowIds = ['opp-1', 'opp-2'];
    await page.waitForChanges();

    swipeOf(root, 'opp-2').dispatchEvent(
      new CustomEvent('leSwipeAction', { detail: { id: 'delete', side: 'end', full: true }, bubbles: true }),
    );
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(remove).toHaveBeenCalledTimes(1);
    expect((remove.mock.calls[0][1] as any).selectedIds).toEqual(['opp-2']);
  });

  it('does not wrap cards without swipe actions, nor table rows', async () => {
    const plain = await renderList(undefined, [{ id: 'export', label: 'Export' }]);
    expect(plain.root.querySelector('le-swipe')).toBeNull();

    const table = await renderList('layout="table" item-context-menu');
    expect(table.root.querySelector('le-swipe')).toBeNull();
  });

  it('keeps the pointer context menu off on swipeable cards unless card.contextMenu is set', async () => {
    const { page, list } = await renderList();
    const contextMenu = (id: string) => {
      const event = { preventDefault() {}, stopPropagation() {}, clientX: 10, clientY: 10 };
      (list as any).handleRowContextMenu(event, data.find(d => d.id === id), id);
    };

    contextMenu('opp-1');
    expect(list.contextMenuItemActions.length).toBe(0);

    list.card = { contextMenu: true };
    await page.waitForChanges();
    contextMenu('opp-1');
    expect(list.contextMenuItemActions.length).toBeGreaterThan(0);
  });

  it('selects a card on tap (click), not when a touch starts — it may become a swipe', async () => {
    const { page, list, root } = await renderList();
    (window as any).getSelection = () => null;
    const row = root.querySelector('.le-list-row-main[data-row-id="opp-1"]');
    const base = { button: 0, target: row, currentTarget: row, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} };

    (list as any).handleRowPointerDown({ ...base, pointerType: 'touch' }, data[0], 'opp-1');
    await page.waitForChanges();
    expect(list.selectedRowIds).toEqual([]);

    (list as any).handleRowClick({ ...base }, data[0], 'opp-1');
    await page.waitForChanges();
    expect(list.selectedRowIds).toEqual(['opp-1']);
  });

  it('opens the context menu from the keyboard on swipeable cards', async () => {
    const { page, list } = await renderList();
    list.focusedRowId = 'opp-1';
    await page.waitForChanges();

    const event = { key: 'ContextMenu', shiftKey: false, ctrlKey: false, metaKey: false, target: page.root, preventDefault: jest.fn() };
    list.handleKeyDown(event as any);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(list.contextMenuItemActions.map(a => a.id)).toContain('delete');
  });
});

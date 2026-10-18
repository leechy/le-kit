import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver, mockResizeObserver } from '../../utils/test-helpers';
import { LeList } from './le-list';
import { LeButton } from '../le-button/le-button';
import { LeToolbar } from '../le-toolbar/le-toolbar';
import { dispatchTriggerAction } from '../../utils/action-bus';
import type { LeListAction } from '../../types/list';

beforeAll(() => {
  mockMutationObserver();
  mockResizeObserver();
});

describe('le-list actions system', () => {
  it('resolves item-level actions first, followed by list-level actions with a separator', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    const globalActions: LeListAction[] = [
      { id: 'global-edit', label: 'Global Edit' },
      { id: 'global-delete', label: 'Global Delete' },
    ];
    list.actions = globalActions;

    const itemData = [
      {
        id: 'row-1',
        label: 'Row 1',
        actions: [
          { id: 'item-custom', label: 'Custom Item Action' },
        ],
      },
      {
        id: 'row-2',
        label: 'Row 2',
      },
    ];
    list.data = itemData;
    await page.waitForChanges();

    // Query available actions for row-1
    const row1Actions = await list.getAvailableActions('row-1');
    expect(row1Actions.length).toBe(3);
    expect(row1Actions[0].id).toBe('item-custom');
    expect(row1Actions[1].id).toBe('global-edit');
    expect(row1Actions[1].separator).toBe('before');
    expect(row1Actions[2].id).toBe('global-delete');

    // Query available actions for row-2 (no item actions)
    const row2Actions = await list.getAvailableActions('row-2');
    expect(row2Actions.length).toBe(2);
    expect(row2Actions[0].id).toBe('global-edit');
    expect(row2Actions[1].id).toBe('global-delete');
  });

  it('evaluates dynamic labelMultiple template strings and functions', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list" selection="multiple"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.actions = [
      {
        id: 'delete',
        label: 'Delete',
        labelMultiple: 'Delete {count} items',
      },
      {
        id: 'archive',
        label: 'Archive',
        labelMultiple: (count: number) => `Archive (${count})`,
      },
    ];

    list.data = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
      { id: '3', label: 'Item 3' },
    ];
    await page.waitForChanges();

    // Select 2 items
    await list.setSelectedRows(['1', '2']);
    await page.waitForChanges();

    const available = await list.getAvailableActions();
    const deleteAction = available.find(a => a.id === 'delete');
    const archiveAction = available.find(a => a.id === 'archive');

    expect(deleteAction?.label).toBe('Delete 2 items');
    expect(archiveAction?.label).toBe('Archive (2)');
  });

  it('respects selectionMode and disabled/hidden conditions', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list" selection="multiple"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.actions = [
      { id: 'single-only', label: 'Single', selectionMode: 'single' },
      { id: 'multi-only', label: 'Multi', selectionMode: 'multiple' },
      { id: 'custom-disabled', label: 'Custom Dis', disabled: (_item: any, ctx: any) => ctx.count > 1 },
      { id: 'custom-hidden', label: 'Custom Hid', hidden: (_item: any, ctx: any) => ctx.count === 0 },
    ];

    list.data = [{ id: '1', label: 'A' }, { id: '2', label: 'B' }];
    await page.waitForChanges();

    // Count = 0
    let actions = await list.getAvailableActions();
    expect(actions.find(a => a.id === 'single-only')?.disabled).toBe(true);
    expect(actions.find(a => a.id === 'multi-only')?.disabled).toBe(true);
    expect(actions.find(a => a.id === 'custom-hidden')).toBeUndefined(); // Hidden when count = 0

    // Count = 1
    await list.setSelectedRows(['1']);
    await page.waitForChanges();
    actions = await list.getAvailableActions();
    expect(actions.find(a => a.id === 'single-only')?.disabled).toBe(false);
    expect(actions.find(a => a.id === 'multi-only')?.disabled).toBe(true); // Requires > 1
    expect(actions.find(a => a.id === 'custom-disabled')?.disabled).toBe(false);
    expect(actions.find(a => a.id === 'custom-hidden')).toBeDefined();

    // Count = 2
    await list.setSelectedRows(['1', '2']);
    await page.waitForChanges();
    actions = await list.getAvailableActions();
    expect(actions.find(a => a.id === 'single-only')?.disabled).toBe(true);
    expect(actions.find(a => a.id === 'multi-only')?.disabled).toBe(false);
    expect(actions.find(a => a.id === 'custom-disabled')?.disabled).toBe(true);
  });

  it('executes actions and emits leAction event', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    const handlerMock = jest.fn();
    list.actions = [
      { id: 'edit', label: 'Edit', handler: handlerMock as any },
    ];
    list.data = [{ id: 'item-1', label: 'Item 1' }];
    await page.waitForChanges();

    const actionSpy = jest.fn();
    page.root?.addEventListener('leAction', actionSpy);

    const executed = await list.executeAction('edit', 'item-1');
    expect(executed).toBe(true);
    expect(handlerMock).toHaveBeenCalledTimes(1);
    expect(actionSpy).toHaveBeenCalledTimes(1);
    expect((actionSpy.mock.calls[0][0] as CustomEvent).detail.action).toBe('edit');
    expect((actionSpy.mock.calls[0][0] as CustomEvent).detail.item.id).toBe('item-1');
  });

  it('renders actions column with col.render and maxVisibleActions', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.columns = [
      { id: 'label', name: 'Name' },
      {
        id: 'actions',
        name: 'Actions',
        type: 'actions',
        maxVisibleActions: 1,
      },
    ];
    list.actions = [
      { id: 'act-1', label: 'Action 1' },
      { id: 'act-2', label: 'Action 2' },
      { id: 'act-3', label: 'Action 3' },
    ];
    list.data = [{ id: 'row-1', label: 'Row 1' }];
    await page.waitForChanges();

    const cell = page.root?.shadowRoot?.querySelector('.le-list-actions-cell');
    expect(cell).not.toBeNull();

    // 1 direct button rendered (excluding overflow trigger button)
    const directButtons = cell?.querySelectorAll('le-button:not([slot="trigger"])');
    expect(directButtons?.length).toBe(1);

    // Overflow menu rendered for the remaining 2 actions
    const overflow = cell?.querySelector('le-overflow-menu.le-list-actions-overflow');
    expect(overflow).not.toBeNull();
    expect((overflow as any).items.length).toBe(2);
  });

  it('executes action when selected from actions column overflow menu', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    const act2Handler = jest.fn();
    list.columns = [
      { id: 'label', name: 'Name' },
      {
        id: 'actions',
        name: 'Actions',
        type: 'actions',
        maxVisibleActions: 1,
      },
    ];
    list.actions = [
      { id: 'act-1', label: 'Action 1' },
      { id: 'act-2', label: 'Action 2', handler: act2Handler as any },
    ];
    list.data = [{ id: 'row-1', label: 'Row 1' }];
    await page.waitForChanges();

    const cell = page.root?.shadowRoot?.querySelector('.le-list-actions-cell');
    const overflow = cell?.querySelector('le-overflow-menu.le-list-actions-overflow');
    expect(overflow).not.toBeNull();

    // Dispatch leOverflowMenuItemSelect
    overflow?.dispatchEvent(
      new CustomEvent('leOverflowMenuItemSelect', {
        detail: {
          id: 'act-2',
          item: { id: 'act-2', label: 'Action 2' },
          originalEvent: new MouseEvent('click'),
        },
        bubbles: true,
      }),
    );
    await page.waitForChanges();

    expect(act2Handler).toHaveBeenCalledTimes(1);
  });

  it('enables actions by selection count according to selectionMode', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list" selection="multiple"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    const modes = ['single', 'multiple', 'both', 'none', 'any'] as const;
    list.actions = modes.map(mode => ({ id: mode, label: mode, selectionMode: mode }));
    list.data = [
      { id: 'row-1', label: 'Row 1' },
      { id: 'row-2', label: 'Row 2' },
    ];
    await page.waitForChanges();

    const enabledFor = async (ids: string[]) => {
      list.selectedRowIds = ids;
      await page.waitForChanges();
      return modes.filter(mode => !(list as any).isActionDisabled(list.parsedActions.find(a => a.id === mode)));
    };

    expect(await enabledFor([])).toEqual(['none', 'any']);
    expect(await enabledFor(['row-1'])).toEqual(['single', 'both', 'any']);
    expect(await enabledFor(['row-1', 'row-2'])).toEqual(['multiple', 'both', 'any']);
  });

  it('applies actions to the whole selection unless invoked on an unselected row', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list" selection="multiple"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    const handler = jest.fn();
    list.actions = [{ id: 'delete', label: 'Delete', selectionMode: 'both', handler: handler as any }];
    const data = [
      { id: 'row-1', label: 'Row 1' },
      { id: 'row-2', label: 'Row 2' },
      { id: 'row-3', label: 'Row 3' },
    ];
    list.data = data;
    await page.waitForChanges();
    list.selectedRowIds = ['row-1', 'row-2'];
    await page.waitForChanges();

    const lastIds = () => (handler.mock.calls[handler.mock.calls.length - 1][1] as any).selectedIds;

    // Toolbar / programmatic call without a target: whole selection
    await list.executeAction('delete');
    expect(lastIds()).toEqual(['row-1', 'row-2']);

    // Invoked on a row that is part of the selection: whole selection
    await list.executeAction('delete', data[1]);
    expect(lastIds()).toEqual(['row-1', 'row-2']);

    // Invoked on a row outside the selection: only that row
    await list.executeAction('delete', data[2]);
    expect(lastIds()).toEqual(['row-3']);
  });

  it('does not change row selection on pointerdown inside the actions column', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list" selection="multiple"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.columns = [
      { id: 'label', name: 'Name' },
      { id: 'actions', name: 'Actions', type: 'actions', maxVisibleActions: 1 },
    ];
    list.actions = [
      { id: 'act-1', label: 'Action 1' },
      { id: 'act-2', label: 'Action 2' },
    ];
    const data = [
      { id: 'row-1', label: 'Row 1' },
      { id: 'row-2', label: 'Row 2' },
    ];
    list.data = data;
    await page.waitForChanges();

    (window as any).getSelection = () => null;
    const rows = page.root?.shadowRoot?.querySelectorAll('.le-list-row-main');
    // The mock DOM does not route pointer events to JSX handlers, so call the row handler directly
    const pointerDown = (rowIndex: number, target: Element | null | undefined) => {
      const event = { button: 0, target, currentTarget: rows?.[rowIndex], clientX: 0, clientY: 0, preventDefault: () => {} };
      (list as any).handleRowPointerDown(event, data[rowIndex], data[rowIndex].id);
    };

    pointerDown(0, rows?.[0]?.querySelector('[role=cell]'));
    await page.waitForChanges();
    expect(list.selectedRowIds).toEqual(['row-1']);

    pointerDown(1, rows?.[1]?.querySelector('le-button'));
    pointerDown(1, rows?.[1]?.querySelector('le-overflow-menu'));
    await page.waitForChanges();
    expect(list.selectedRowIds).toEqual(['row-1']);
  });

  it('supports custom col.render function', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.columns = [
      {
        id: 'badge',
        name: 'Status',
        render: (_val, item: any) => `<span class="custom-badge">${item.status}</span>`,
      },
    ];
    list.data = [{ id: '1', label: '1', status: 'ACTIVE' } as any];
    await page.waitForChanges();

    const cell = page.root?.shadowRoot?.querySelector('.le-list-td');
    expect(cell?.innerHTML).toContain('custom-badge');
    expect(cell?.innerHTML).toContain('ACTIVE');
  });

  it('binds le-button to le-list via action bus and updates state', async () => {
    const page = await newSpecPage({
      components: [LeList, LeButton],
      html: `
        <div>
          <le-button id="del-btn" action="delete" bind-list="bound-list">Delete</le-button>
          <le-list id="bound-list" selection="multiple"></le-list>
        </div>
      `,
    });

    const list = page.body.querySelector('le-list') as any;
    const button = page.body.querySelector('le-button') as any;

    const deleteHandler = jest.fn();
    list.actions = [
      {
        id: 'delete',
        label: 'Delete',
        labelMultiple: 'Delete {count} items',
        selectionMode: 'multiple',
        handler: deleteHandler,
      },
    ];
    list.data = [
      { id: '1', label: 'Item 1' },
      { id: '2', label: 'Item 2' },
    ];
    await page.waitForChanges();

    // Initially with 0 items selected, selectionMode 'multiple' disables button
    expect(button.disabled).toBe(true);

    // Select 2 items
    await list.setSelectedRows(['1', '2']);
    await page.waitForChanges();

    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('Delete');

    // Clicking button triggers action on bound list
    dispatchTriggerAction(button, { action: 'delete', listIds: ['bound-list'] });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(deleteHandler).toHaveBeenCalledTimes(1);
  });

  it('triggers the action only on the bound list the button currently reflects', async () => {
    const page = await newSpecPage({
      components: [LeList, LeButton],
      html: `
        <div>
          <le-button action="delete" bind-list="list-a, list-b">Delete</le-button>
          <le-list id="list-a" selection="multiple"></le-list>
          <le-list id="list-b" selection="multiple"></le-list>
        </div>
      `,
    });

    const [listA, listB] = Array.from(page.body.querySelectorAll('le-list')) as any[];
    const button = page.body.querySelector('le-button') as any;
    const handlerA = jest.fn();
    const handlerB = jest.fn();
    listA.actions = [{ id: 'delete', label: 'Delete', selectionMode: 'both', handler: handlerA }];
    listB.actions = [{ id: 'delete', label: 'Delete', selectionMode: 'both', handler: handlerB }];
    listA.data = [{ id: 'a1', label: 'A1' }];
    listB.data = [{ id: 'b1', label: 'B1' }];
    await page.waitForChanges();

    // Both lists keep a selection; B was used last, so the button reflects B
    await listA.setSelectedRows(['a1']);
    await listB.setSelectedRows(['b1']);
    await page.waitForChanges();

    // mock-doc defines a default onclick() method, which le-button would treat as a user handler
    button.onclick = null;
    button.shadowRoot.querySelector('button').click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(handlerA).not.toHaveBeenCalled();
  });

  it('supports toolbar attachList and detachList methods', async () => {
    const page = await newSpecPage({
      components: [LeToolbar, LeButton],
      html: `
        <le-toolbar id="my-toolbar" bind-list="list-a">
          <le-button id="btn" action="edit">Edit</le-button>
        </le-toolbar>
      `,
    });

    const toolbar = page.body.querySelector('le-toolbar') as any;
    expect(toolbar.bindList).toBe('list-a');

    await toolbar.attachList('list-b');
    await page.waitForChanges();
    expect(toolbar.bindList).toBe('list-a, list-b');

    await toolbar.detachList('list-a');
    await page.waitForChanges();
    expect(toolbar.bindList).toBe('list-b');
  });

  it('clears leading separator on first overflow action and trailing separator on last action', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list id="test-list"></le-list>`,
    });

    const list = page.rootInstance as LeList;
    list.columns = [
      { id: 'label', name: 'Name' },
      {
        id: 'actions',
        name: 'Actions',
        type: 'actions',
        maxVisibleActions: 1,
      },
    ];
    list.actions = [
      { id: 'act-1', label: 'Action 1' },
      { id: 'act-2', label: 'Action 2', separator: 'before' },
      { id: 'act-3', label: 'Action 3', separator: 'after' },
    ];
    list.data = [{ id: 'row-1', label: 'Row 1' }];
    await page.waitForChanges();

    const cell = page.root?.shadowRoot?.querySelector('.le-list-actions-cell');
    const overflow = cell?.querySelector('le-overflow-menu.le-list-actions-overflow') as any;
    expect(overflow).not.toBeNull();
    expect(overflow.items.length).toBe(2);
    expect(overflow.items[0].separator).toBeUndefined();
    expect(overflow.items[1].separator).toBeUndefined();
  });
});


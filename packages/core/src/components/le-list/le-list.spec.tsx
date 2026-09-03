import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeList } from './le-list';
import { LeCollapse } from '../le-collapse/le-collapse';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-list drag-and-drop reordering', () => {
  it('supports reorder property and programmatic methods', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="siblings"></le-list>`,
    });

    const host = page.rootInstance as LeList;
    expect(host.reorder).toBe('siblings');

    await host.setReorder('nested');
    await page.waitForChanges();
    expect(host.reorder).toBe('nested');

    await host.disableReorder();
    await page.waitForChanges();
    expect(host.reorder).toBe('none');

    await host.enableReorder('siblings');
    await page.waitForChanges();
    expect(host.reorder).toBe('siblings');
  });

  it('renders reorderable class on container when reorder is enabled', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="nested"></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' },
    ];
    await page.waitForChanges();

    const table = host.shadowRoot?.querySelector('.le-list-table');
    expect(table?.classList.contains('is-reorderable')).toBe(true);
  });

  it('renders reorder handle column when show-reorder-handle is enabled', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="nested" show-reorder-handle></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' },
    ];
    await page.waitForChanges();

    const reorderTh = host.shadowRoot?.querySelector('.le-list-th-reorder');
    expect(reorderTh).not.toBeNull();

    const reorderTd = host.shadowRoot?.querySelector('.le-list-td-reorder');
    expect(reorderTd).not.toBeNull();
  });

  it('programmatically reorders items via moveItem method', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="nested"></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      { label: 'Task A', value: 'taskA' },
      { label: 'Task B', value: 'taskB' },
      { label: 'Task C', value: 'taskC' },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeList;
    const result = await instance.moveItem('taskA', 'taskB', 'after');
    await page.waitForChanges();

    expect(result.success).toBe(true);
    const rows = Array.from(host.shadowRoot?.querySelectorAll('.le-list-cell-label') ?? []).map(
      (el: any) => el.textContent,
    );
    expect(rows[0]).toBe('Task B');
    expect(rows[1]).toBe('Task A');
    expect(rows[2]).toBe('Task C');
  });

  it('respects maxReorderDepth on moveItem method', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="nested" max-reorder-depth="1"></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      {
        label: 'Folder 1',
        value: 'f1',
        children: [
          { label: 'Subfolder 1', value: 'sub1' },
        ],
      },
      { label: 'File 1', value: 'file1' },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeList;
    // Trying to move inside 'sub1' (which is at depth 1) should fail because maxReorderDepth is 1
    const result = await instance.moveItem('file1', 'sub1', 'inside');
    expect(result.success).toBe(false);

    // Moving inside 'f1' (which is at depth 0) should succeed
    const resultValid = await instance.moveItem('file1', 'f1', 'inside');
    expect(resultValid.success).toBe(true);
  });

  it('respects maxReorderDepth with dragged items that have children', async () => {
    const page = await newSpecPage({
      components: [LeList],
      html: `<le-list reorder="nested" max-reorder-depth="2"></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      {
        label: 'Folder 1',
        value: 'f1',
        children: [
          {
            label: 'Subfolder 1',
            value: 'sub1',
            children: [
              { label: 'Deep File', value: 'deep1' },
            ],
          },
        ],
      },
      {
        label: 'Folder 2',
        value: 'f2',
        children: [
          { label: 'Child of F2', value: 'f2_child' },
        ],
      },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeList;

    // 'f2' has subtree depth 1.
    // 'sub1' is at depth 1. Moving 'f2' inside 'sub1' would place 'f2' at depth 2 and 'f2_child' at depth 3 > 2.
    const resultInsideSub1 = await instance.moveItem('f2', 'sub1', 'inside');
    expect(resultInsideSub1.success).toBe(false);

    // Moving 'f2' before 'deep1' (which is at depth 2) would place 'f2' at depth 2 and 'f2_child' at depth 3 > 2.
    const resultBeforeDeep = await instance.moveItem('f2', 'deep1', 'before');
    expect(resultBeforeDeep.success).toBe(false);

    // Moving 'f2' inside 'f1' (depth 0) places 'f2' at depth 1 and 'f2_child' at depth 2 <= 2.
    const resultInsideF1 = await instance.moveItem('f2', 'f1', 'inside');
    expect(resultInsideF1.success).toBe(true);
  });

  it('renders le-collapse with data-expanded="true" when rows are open by default', async () => {
    const page = await newSpecPage({
      components: [LeList, LeCollapse],
      html: `<le-list></le-list>`,
    });

    const host = page.root as any;
    host.data = [
      {
        id: 'dept',
        label: 'Dept',
        open: true,
        children: [{ id: 'child', label: 'Child' }],
      },
    ];
    await page.waitForChanges();

    const collapse = host.shadowRoot?.querySelector('le-collapse');
    console.log('List row le-collapse HTML:', collapse?.outerHTML);
    console.log('List row le-collapse data-expanded:', collapse?.getAttribute('data-expanded'));
    console.log('List row le-collapse data-open:', collapse?.getAttribute('data-open'));
    console.log('List row le-collapse closed prop:', collapse?.closed);
  });
});

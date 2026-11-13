import { beforeAll, describe, expect, it } from '@jest/globals';
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver, mockResizeObserver, type ResizeObserverHandle } from '../../utils/test-helpers';
import { LeList } from './le-list';

let ro: ResizeObserverHandle;

beforeAll(() => {
  mockMutationObserver();
  ro = mockResizeObserver();
});

const opportunity = {
  id: 'opp-1',
  label: 'Client Company',
  description: 'Big deal',
  data: { distributor: 'Distributor Ltd', status: 'New', country: 'Germany', type: 'Reseller' },
};

async function renderList(attrs = 'layout="cards"') {
  const page = await newSpecPage({
    components: [LeList],
    html: `<le-list id="list" ${attrs}></le-list>`,
  });
  const list = page.rootInstance as LeList;
  list.data = [opportunity];
  await page.waitForChanges();
  return { page, list, root: page.root!.shadowRoot! };
}

const field = (scope: ParentNode, key: string) => scope.querySelector(`[data-le-field="${key}"]`);

describe('le-list card layout', () => {
  it('renders the label as the title and the description below by default', async () => {
    const { root } = await renderList();

    expect(root.querySelector('.le-list-table.is-cards')).not.toBeNull();
    expect(root.querySelector('.le-list-thead')).toBeNull();

    const lines = root.querySelectorAll('.le-list-card-line');
    expect(lines.length).toBe(2);
    expect(lines[0].classList.contains('is-title')).toBe(true);
    expect(field(lines[0], 'label')?.textContent).toBe('Client Company');
    expect(field(lines[1], 'description')?.textContent).toBe('Big deal');
  });

  it('places configured values into start/end slots and joins arrays', async () => {
    const { page, list, root } = await renderList();
    list.card = {
      rows: [
        { start: 'data.distributor', end: 'data.created' },
        { start: 'label', end: 'data.status' },
        { start: ['data.country', 'data.type'] },
      ],
    };
    await page.waitForChanges();

    const lines = root.querySelectorAll('.le-list-card-line');
    expect(lines.length).toBe(3);
    expect(field(lines[0].querySelector('.le-list-card-start')!, 'data.distributor')?.textContent).toBe('Distributor Ltd');
    // Missing values leave the slot empty
    expect(field(lines[0], 'data.created')).toBeNull();
    expect(field(lines[1].querySelector('.le-list-card-end')!, 'data.status')?.textContent).toBe('New');
    expect(lines[2].querySelector('.le-list-card-start')?.textContent).toBe('Germany · Reseller');

    // 3 lines without primary column or explicit size: the middle one is the title
    expect(Array.from(lines).map(l => l.classList.contains('is-title'))).toEqual([false, true, false]);
  });

  it('makes the line with the primary column the title, unless a size is set explicitly', async () => {
    const { page, list, root } = await renderList();
    list.columns = [
      { key: 'data.distributor', label: 'Distributor', primary: true },
      { key: 'label', label: 'Name' },
    ];
    list.card = { rows: [{ start: 'data.distributor' }, { start: 'label' }, { start: 'data.country' }] };
    await page.waitForChanges();

    let titles = Array.from(root.querySelectorAll('.le-list-card-line')).map(l => l.classList.contains('is-title'));
    expect(titles).toEqual([true, false, false]);

    list.card = { rows: [{ start: 'data.distributor' }, { start: 'label' }, { start: 'data.country', size: 'title' }] };
    await page.waitForChanges();
    titles = Array.from(root.querySelectorAll('.le-list-card-line')).map(l => l.classList.contains('is-title'));
    expect(titles).toEqual([false, false, true]);
  });

  it('uses a custom render function with field-marked values', async () => {
    const { page, list, root } = await renderList();
    list.card = {
      render: (item, ctx) => (
        <div class="my-card">
          {ctx.value('data.status')}
          <b>{item.label}</b>
        </div>
      ),
    };
    await page.waitForChanges();

    const custom = root.querySelector('.my-card');
    expect(custom).not.toBeNull();
    expect(field(custom!, 'data.status')?.textContent).toBe('New');
    expect(root.querySelector('.le-list-card-line')).toBeNull();
  });

  it('shows the actions column as an overflow menu in cards unless card.actions is false', async () => {
    const { page, list, root } = await renderList();
    list.columns = [
      { key: 'label', label: 'Name' },
      { key: 'actions', label: 'Actions', type: 'actions' },
    ];
    list.actions = [{ id: 'open', label: 'Open' }];
    await page.waitForChanges();
    expect(root.querySelector('.le-list-card-actions le-overflow-menu')).not.toBeNull();

    list.card = { actions: false };
    await page.waitForChanges();
    expect(root.querySelector('.le-list-card-actions')).toBeNull();
  });

  it('marks table cell values with data-le-field and renders the primary column as the row header', async () => {
    const { page, list, root } = await renderList('layout="table"');
    list.columns = [
      { key: 'label', label: 'Name', primary: true },
      { key: 'data.status', label: 'Status' },
    ];
    await page.waitForChanges();

    expect(root.querySelector('.le-list-table.is-cards')).toBeNull();
    expect(field(root, 'label')?.textContent).toBe('Client Company');
    expect(field(root, 'description')?.textContent).toBe('Big deal');
    expect(field(root, 'data.status')?.textContent).toBe('New');

    const cells = root.querySelectorAll('.le-list-row-main > .le-list-td');
    expect(cells[0].getAttribute('role')).toBe('rowheader');
    expect(cells[1].getAttribute('role')).toBe('cell');
  });

  it('animates values present in both layouts from their old position (FLIP)', async () => {
    const { page, list, root } = await renderList('layout="table" layout-transition');
    list.columns = [
      { key: 'label', label: 'Name' },
      { key: 'data.status', label: 'Status', render: (val: string) => <le-tag label={val} /> },
    ];
    list.card = { rows: [{ start: 'label', end: 'data.status' }] };
    await page.waitForChanges();

    // Table values sit lower and to the right of their card positions
    const proto = Object.getPrototypeOf(root.querySelector('[data-le-field="label"]')!);
    const originalRect = proto.getBoundingClientRect;
    const originalAnimate = proto.animate;
    proto.getBoundingClientRect = function () {
      const inCard = !!this.closest?.('.le-list-card');
      return { left: inCard ? 10 : 200, top: inCard ? 50 : 100, width: inCard ? 200 : 100, height: 20, right: 0, bottom: 0 };
    };
    // The card title uses a larger font than the table cell
    const originalComputedStyle = globalThis.getComputedStyle;
    (globalThis as any).getComputedStyle = (el: any) => ({
      fontSize: el.closest?.('.le-list-card-line.is-title') ? '18px' : '14px',
      getPropertyValue: () => '',
    });
    const calls: Array<{ field: string; keyframes: Keyframe[]; options: any }> = [];
    proto.animate = function (keyframes: Keyframe[], options: any) {
      calls.push({ field: this.dataset?.leField, keyframes, options });
      return { finished: Promise.resolve(), cancel() {} };
    };

    try {
      list.layout = 'cards';
      await page.waitForChanges();
      await new Promise(resolve => setTimeout(resolve, 0));
    } finally {
      proto.getBoundingClientRect = originalRect;
      proto.animate = originalAnimate;
      (globalThis as any).getComputedStyle = originalComputedStyle;
    }

    const label = calls.find(c => c.field === 'label');
    const status = calls.find(c => c.field === 'data.status');
    // Centers: table (250, 110) → card (110, 60); text scales uniformly by font size, 14px → 18px
    expect(label?.keyframes[0].transform).toBe('translate(140px, 50px) scale(0.778)');
    expect(label?.keyframes[1].transform).toBe('none');
    // A value holding a component only moves (no scale, no opacity) and adds to its own transforms
    expect(status?.keyframes[0].transform).toBe('translate(140px, 50px)');
    expect(status?.keyframes[0].opacity).toBeUndefined();
    expect(status?.options.composite).toBe('add');
  });

  it('switches between table and cards by width in auto layout', async () => {
    const { page, root } = await renderList('layout="auto" card-breakpoint="500"');

    ro.trigger(page.root!, { width: 400, height: 300 });
    await page.waitForChanges();
    expect(root.querySelector('.le-list-table.is-cards')).not.toBeNull();

    ro.trigger(page.root!, { width: 800, height: 300 });
    await page.waitForChanges();
    expect(root.querySelector('.le-list-table.is-cards')).toBeNull();
  });
});

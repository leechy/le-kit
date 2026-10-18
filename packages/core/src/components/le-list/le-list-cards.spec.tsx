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

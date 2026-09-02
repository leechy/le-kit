import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeNavigation } from './le-navigation';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-navigation focus behavior', () => {
  it('does not display focus ring initially', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' }
    ];
    await page.waitForChanges();

    const items = Array.from(host.shadowRoot?.querySelectorAll('.nav-item') ?? []) as HTMLElement[];
    expect(items.length).toBe(2);

    // No item should have the 'focused' class initially
    const hasFocusedItem = items.some(item => item.classList.contains('focused'));
    expect(hasFocusedItem).toBe(false);
  });

  it('displays focus ring on keydown', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' }
    ];
    await page.waitForChanges();

    const items = Array.from(host.shadowRoot?.querySelectorAll('.nav-item') ?? []) as HTMLElement[];
    expect(items.length).toBe(2);

    // Trigger keydown on the component
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });
    host.dispatchEvent(keydownEvent);
    await page.waitForChanges();

    // The first item should now have the 'focused' class
    expect(items[0].classList.contains('focused')).toBe(true);
    expect(items[1].classList.contains('focused')).toBe(false);
  });

  it('selects last item on ArrowUp when initially not active', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' }
    ];
    await page.waitForChanges();

    const items = Array.from(host.shadowRoot?.querySelectorAll('.nav-item') ?? []) as HTMLElement[];
    expect(items.length).toBe(2);

    // Trigger keydown ArrowUp
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    });
    host.dispatchEvent(keydownEvent);
    await page.waitForChanges();

    // The last item (Item 2) should now have the 'focused' class
    expect(items[0].classList.contains('focused')).toBe(false);
    expect(items[1].classList.contains('focused')).toBe(true);
  });

  it('hides focus ring and updates focus position on mouseenter', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' }
    ];
    await page.waitForChanges();

    const items = Array.from(host.shadowRoot?.querySelectorAll('.nav-item') ?? []) as HTMLElement[];
    expect(items.length).toBe(2);

    // 1. Press key to show focus ring on Item 1
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });
    host.dispatchEvent(keydownEvent);
    await page.waitForChanges();
    expect(items[0].classList.contains('focused')).toBe(true);

    // 2. Mouse enter Item 2
    const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
    items[1].dispatchEvent(mouseEnterEvent);
    await page.waitForChanges();

    // Focus ring should be hidden on both, but visual focus is now active
    expect(items[0].classList.contains('focused')).toBe(false);
    expect(items[1].classList.contains('focused')).toBe(false);

    // 3. Press ArrowDown again. Since visual focus was active on Item 2, it should navigate to Item 1 (wrapping around).
    const keydownEvent2 = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });
    host.dispatchEvent(keydownEvent2);
    await page.waitForChanges();

    expect(items[0].classList.contains('focused')).toBe(true);
  });
});

describe('le-navigation drag-and-drop reordering', () => {
  it('supports reorder property and programmatic methods', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical" reorder="siblings"></le-navigation>`,
    });

    const host = page.rootInstance as LeNavigation;
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
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical" reorder="nested"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Item 1', id: 'item1' },
      { label: 'Item 2', id: 'item2' },
    ];
    await page.waitForChanges();

    const container = host.shadowRoot?.querySelector('.nav-vertical');
    expect(container?.classList.contains('is-reorderable')).toBe(true);
  });

  it('programmatically reorders items via moveItem method', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical" reorder="nested"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      { label: 'Work', value: 'work' },
      { label: 'Sent', value: 'sent' },
      { label: 'Drafts', value: 'drafts' },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeNavigation;
    const result = await instance.moveItem('work', 'sent', 'after');
    await page.waitForChanges();

    expect(result.success).toBe(true);
    const items = Array.from(host.shadowRoot?.querySelectorAll('.nav-label') ?? []).map(
      (el: any) => el.textContent,
    );
    expect(items[0]).toBe('Sent');
    expect(items[1]).toBe('Work');
    expect(items[2]).toBe('Drafts');
  });

  it('respects maxReorderDepth on moveItem method', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation orientation="vertical" reorder="nested" max-reorder-depth="1"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      {
        label: 'Level 0',
        value: 'lvl0',
        children: [
          { label: 'Level 1', value: 'lvl1' },
        ],
      },
      { label: 'Other', value: 'other' },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeNavigation;
    // Trying to move inside 'lvl1' (which is at depth 1) should fail because maxReorderDepth is 1
    const result = await instance.moveItem('other', 'lvl1', 'inside');
    expect(result.success).toBe(false);

    // Moving inside 'lvl0' (which is at depth 0) should succeed
    const resultValid = await instance.moveItem('other', 'lvl0', 'inside');
    expect(resultValid.success).toBe(true);
  });

  it('respects maxReorderDepth with dragged items that have children', async () => {
    const page = await newSpecPage({
      components: [LeNavigation],
      html: `<le-navigation reorder="nested" max-reorder-depth="2"></le-navigation>`,
    });

    const host = page.root as any;
    host.items = [
      {
        label: 'Level 0',
        value: 'lvl0',
        children: [
          {
            label: 'Level 1',
            value: 'lvl1',
            children: [
              { label: 'Level 2', value: 'lvl2' },
            ],
          },
        ],
      },
      {
        label: 'Branch',
        value: 'branch',
        children: [
          { label: 'Branch Child', value: 'branch_child' },
        ],
      },
    ];
    await page.waitForChanges();

    const instance = page.rootInstance as LeNavigation;

    // 'branch' has subtree depth 1.
    // 'lvl1' is at depth 1. Moving 'branch' inside 'lvl1' places 'branch' at depth 2 and 'branch_child' at depth 3 > 2.
    const resultInsideLvl1 = await instance.moveItem('branch', 'lvl1', 'inside');
    expect(resultInsideLvl1.success).toBe(false);

    // Moving 'branch' before 'lvl2' (depth 2) places 'branch' at depth 2 and 'branch_child' at depth 3 > 2.
    const resultBeforeLvl2 = await instance.moveItem('branch', 'lvl2', 'before');
    expect(resultBeforeLvl2.success).toBe(false);

    // Moving 'branch' inside 'lvl0' (depth 0) places 'branch' at depth 1 and 'branch_child' at depth 2 <= 2.
    const resultInsideLvl0 = await instance.moveItem('branch', 'lvl0', 'inside');
    expect(resultInsideLvl0.success).toBe(true);
  });
});


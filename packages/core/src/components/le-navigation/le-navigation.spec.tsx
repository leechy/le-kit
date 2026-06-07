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

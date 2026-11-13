import { describe, expect, it, jest } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { LeSwipe } from './le-swipe';
import type { LeSwipeAction } from './le-swipe';

const startActions: LeSwipeAction[] = [{ id: 'read', label: 'Read', icon: 'check', color: 'primary', full: true }];
const endActions: LeSwipeAction[] = [
  { id: 'reject', label: 'Reject', color: 'warning' },
  { id: 'delete', label: 'Delete', icon: 'delete', color: 'danger', full: true },
];

async function renderSwipe(start: LeSwipeAction[] = startActions, end: LeSwipeAction[] = endActions) {
  const page = await newSpecPage({
    components: [LeSwipe],
    html: `<le-swipe><div class="content">Card</div></le-swipe>`,
  });
  const swipe = page.root as any;
  swipe.startActions = start;
  swipe.endActions = end;
  await page.waitForChanges();
  return { page, swipe, root: page.root!.shadowRoot! };
}

/** Horizontal trackpad scroll: positive deltaX scrolls right, which moves the card left */
function wheel(el: Element, deltaX: number, deltaY = 0) {
  const event = new MouseEvent('wheel', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'deltaX', { value: deltaX });
  Object.defineProperty(event, 'deltaY', { value: deltaY });
  el.dispatchEvent(event);
  return event;
}

const settle = () => new Promise(resolve => setTimeout(resolve, 450));

describe('le-swipe', () => {
  it('renders the full-swipe action at the outer edge of each side', async () => {
    const { root } = await renderSwipe();
    const endIds = Array.from(root.querySelectorAll('.le-swipe-panel-end .le-swipe-action')).map(b => b.getAttribute('data-action-id'));
    // The end panel sits at the right edge (LTR), so its outermost button is the last one
    expect(endIds).toEqual(['reject', 'delete']);
    const startIds = Array.from(root.querySelectorAll('.le-swipe-panel-start .le-swipe-action')).map(b => b.getAttribute('data-action-id'));
    expect(startIds).toEqual(['read']);
  });

  it('shows at most 3 actions per side and warns about the rest', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const many = ['a', 'b', 'c', 'd'].map(id => ({ id, label: id }));
    const { root } = await renderSwipe([], many);
    expect(root.querySelectorAll('.le-swipe-panel-end .le-swipe-action').length).toBe(3);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('opens on its buttons after a horizontal wheel swipe', async () => {
    const { page, swipe } = await renderSwipe();
    const first = wheel(swipe, 50);
    wheel(swipe, 50);
    expect(first.defaultPrevented).toBe(true);
    await settle();
    await page.waitForChanges();
    expect(swipe.getAttribute('data-open')).toBe('end');
  });

  it('runs the full-swipe action when pulled past the buttons', async () => {
    const { page, swipe } = await renderSwipe();
    const handler = jest.fn();
    swipe.addEventListener('leSwipeAction', (e: CustomEvent) => handler(e.detail));
    for (let i = 0; i < 6; i++) wheel(swipe, 50);
    await settle();
    await page.waitForChanges();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'delete', side: 'end', full: true }));
    expect(swipe.getAttribute('data-open')).toBeNull();
  });

  it('ignores vertical scrolling and swipes towards a side without actions', async () => {
    const { page, swipe } = await renderSwipe([], endActions);
    expect(wheel(swipe, 5, 40).defaultPrevented).toBe(false);
    // Negative deltaX moves the card right, revealing the (empty) start side
    expect(wheel(swipe, -80).defaultPrevented).toBe(false);
    await settle();
    await page.waitForChanges();
    expect(swipe.getAttribute('data-open')).toBeNull();
  });

  it('closes the open swipe when another one starts moving', async () => {
    const page = await newSpecPage({
      components: [LeSwipe],
      html: `<le-swipe id="a"><div>A</div></le-swipe><le-swipe id="b"><div>B</div></le-swipe>`,
    });
    const [a, b] = Array.from(page.body.querySelectorAll('le-swipe')) as any[];
    for (const swipe of [a, b]) {
      swipe.startActions = startActions;
      swipe.endActions = endActions;
    }
    await page.waitForChanges();

    await a.open('end');
    await page.waitForChanges();
    expect(a.getAttribute('data-open')).toBe('end');

    wheel(b, -20);
    await page.waitForChanges();
    expect(a.getAttribute('data-open')).toBeNull();
  });

  it('emits the action and closes when a revealed button is clicked', async () => {
    const { page, swipe, root } = await renderSwipe();
    const handler = jest.fn();
    swipe.addEventListener('leSwipeAction', (e: CustomEvent) => handler(e.detail));
    await swipe.open('end');
    await page.waitForChanges();
    (root.querySelector('[data-action-id="reject"]') as HTMLElement).click();
    await page.waitForChanges();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'reject', side: 'end', full: false }));
    expect(swipe.getAttribute('data-open')).toBeNull();
  });
});

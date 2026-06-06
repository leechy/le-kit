import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeContextMenu } from './le-context-menu';
import { LePopover } from '../le-popover/le-popover';
import { LeNavigation } from '../le-navigation/le-navigation';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-context-menu', () => {
  it('renders default host structure and properties', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    expect(host).not.toBeNull();
    expect(host.backdrop).toBe(false);
    expect(host.pageScrollBehavior).toBe('fixed-menu');
    expect(host.position).toBe('mouse');
    expect(host.align).toBe('start');

    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone');
    expect(triggerZone).not.toBeNull();
  });

  it('toggles open state and sets coordinates on right click', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    expect(host.open).toBe(false);

    // Dispatch contextmenu event
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    });
    triggerZone.dispatchEvent(contextMenuEvent);
    await page.waitForChanges();

    expect(host.open).toBe(true);
    const popover = host.shadowRoot?.querySelector('le-popover') as HTMLElement;
    expect(popover.style.left).toBe('100px');
    expect(popover.style.top).toBe('200px');
  });

  it('renders backdrop when backdrop prop is set and elevates trigger item', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu backdrop items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    expect(host.backdrop).toBe(true);
    expect(host.hasAttribute('has-backdrop')).toBe(true);

    const triggerEl = host.querySelector('.trigger') as HTMLElement;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    const component = page.rootInstance as any;
    component.activeTriggerEl = triggerEl;

    // Open the menu by clicking the trigger
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    });
    triggerZone.dispatchEvent(contextMenuEvent);
    await page.waitForChanges();

    expect(host.open).toBe(true);

    // Verify backdrop element is rendered in shadow DOM
    const backdrop = host.shadowRoot?.querySelector('.le-context-menu-backdrop') as HTMLElement;
    expect(backdrop).not.toBeNull();

    // Verify trigger item has the active-item class added to it
    expect(triggerEl.classList.contains('le-context-menu-active-item')).toBe(true);

    // Click backdrop to close
    backdrop.click();
    await page.waitForChanges();

    expect(host.open).toBe(false);
  });

  it('does not add class when backdrop prop is false', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    const triggerEl = host.querySelector('.trigger') as HTMLElement;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    const component = page.rootInstance as any;
    component.activeTriggerEl = triggerEl;

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    });
    triggerZone.dispatchEvent(contextMenuEvent);
    await page.waitForChanges();

    expect(host.open).toBe(true);
    // Since backdrop is false, we should verify the active item class is NOT added,
    // and the host does not have has-backdrop attribute.
    expect(triggerEl.classList.contains('le-context-menu-active-item')).toBe(false);
    expect(host.hasAttribute('has-backdrop')).toBe(false);
  });

  it('closes menu on scroll when pageScrollBehavior is menu-close', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu page-scroll-behavior="menu-close" items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    const triggerEl = host.querySelector('.trigger') as HTMLElement;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    const component = page.rootInstance as any;
    component.activeTriggerEl = triggerEl;

    // Open menu
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    });
    triggerZone.dispatchEvent(contextMenuEvent);
    await page.waitForChanges();
    expect(host.open).toBe(true);

    // Manually trigger popover open callback to set up scroll listener in JSDOM
    component.handlePopoverOpen();
    await page.waitForChanges();

    // Simulate page scroll
    const scrollEvent = new Event('scroll', { bubbles: true });
    window.dispatchEvent(scrollEvent);
    await page.waitForChanges();

    expect(host.open).toBe(false);
  });

  it('updates coordinates on scroll when pageScrollBehavior is fixed-menu', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu page-scroll-behavior="fixed-menu" items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger" style="display: block; height: 50px; width: 100px;">Right click me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    const triggerEl = host.querySelector('.trigger') as HTMLElement;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    // Mock initial client rects
    triggerEl.getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      width: 100,
      height: 50,
      bottom: 150,
      right: 200,
      x: 100,
      y: 100,
      toJSON: () => {}
    } as DOMRect);

    const component = page.rootInstance as any;
    component.activeTriggerEl = triggerEl;

    // Open menu
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 250,
    });
    triggerZone.dispatchEvent(contextMenuEvent);
    await page.waitForChanges();
    expect(host.open).toBe(true);

    // Manually trigger popover open callback to set up scroll listener in JSDOM
    component.handlePopoverOpen();
    await page.waitForChanges();

    // Now mock triggerEl moving due to scroll: moves up by 50px (top becomes 50)
    triggerEl.getBoundingClientRect = () => ({
      top: 50,
      left: 100,
      width: 100,
      height: 50,
      bottom: 100,
      right: 200,
      x: 100,
      y: 50,
      toJSON: () => {}
    } as DOMRect);

    // Simulate page scroll
    const scrollEvent = new Event('scroll', { bubbles: true });
    window.dispatchEvent(scrollEvent);
    await page.waitForChanges();

    // Delta dy = 50 - 100 = -50px.
    // New coords-y should be clientY (250) + dy (-50) = 200px.
    const popover = host.shadowRoot?.querySelector('le-popover') as HTMLElement;
    expect(popover.style.top).toBe('200px');
    expect(popover.style.left).toBe('150px');
  });

  it('updates coordinates on scroll for touch trigger', async () => {
    const page = await newSpecPage({
      components: [LeContextMenu, LePopover, LeNavigation],
      html: `
        <le-context-menu page-scroll-behavior="fixed-menu" items='[{"label": "Item 1", "value": "1"}]'>
          <div class="trigger" style="display: block; height: 50px; width: 100px;">Long press me</div>
        </le-context-menu>
      `,
    });

    const host = page.root as any;
    const triggerEl = host.querySelector('.trigger') as HTMLElement;
    const triggerZone = host.shadowRoot?.querySelector('.context-menu-trigger-zone') as HTMLElement;

    // Mock initial client rects
    triggerEl.getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      width: 100,
      height: 50,
      bottom: 150,
      right: 200,
      x: 100,
      y: 100,
      toJSON: () => {}
    } as DOMRect);

    triggerZone.getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      width: 100,
      height: 50,
      bottom: 150,
      right: 200,
      x: 100,
      y: 100,
      toJSON: () => {}
    } as DOMRect);

    const component = page.rootInstance as any;
    component.activeTriggerEl = triggerEl;

    // Open menu using touch/show
    await component.show();
    await page.waitForChanges();
    expect(host.open).toBe(true);

    // Manually trigger popover open callback to set up scroll listener in JSDOM
    component.handlePopoverOpen();
    await page.waitForChanges();

    // Now mock triggerEl moving due to scroll: moves up by 50px (top becomes 50)
    triggerEl.getBoundingClientRect = () => ({
      top: 50,
      left: 100,
      width: 100,
      height: 50,
      bottom: 100,
      right: 200,
      x: 100,
      y: 50,
      toJSON: () => {}
    } as DOMRect);

    // Simulate page scroll
    const scrollEvent = new Event('scroll', { bubbles: true });
    window.dispatchEvent(scrollEvent);
    await page.waitForChanges();

    // In touch mode, coordinates should exactly match the moving element box!
    const popover = host.shadowRoot?.querySelector('le-popover') as HTMLElement;
    expect(popover.style.top).toBe('50px');
    expect(popover.style.left).toBe('100px');
    expect(popover.style.width).toBe('100px');
    expect(popover.style.height).toBe('50px');
  });
});

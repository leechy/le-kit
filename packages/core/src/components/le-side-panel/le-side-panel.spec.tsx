import { describe, it, expect, beforeAll } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { LeSidePanel } from './le-side-panel';
import {
  mockResizeObserver,
  shadowQuery,
  captureEvent,
  eventDetail,
} from '../../utils/test-helpers';

describe('le-side-panel spec', () => {
  beforeAll(() => {
    // Component uses ResizeObserver in connectedCallback. Mock it for spec safety
    // (Build.isBrowser=false in spec mode means it's never actually called, but
    // mocking avoids "not defined" errors if the guard ever changes).
    mockResizeObserver();
  });

  it('exposes default prop values', async () => {
    const page = await newSpecPage({
      components: [LeSidePanel],
      html: `<le-side-panel></le-side-panel>`,
    });
    const host = page.root as HTMLLeSidePanelElement;
    expect(host.side).toBe('start');
    expect(host.narrowBehavior).toBe('overlay');
    expect(host.panelWidth).toBe(280);
    expect(host.collapsed).toBe(false);
    expect(host.open).toBe(false);
    expect(host.showCloseButton).toBe(true);
  });

  it('shows inline panel when not collapsed (wide mode)', async () => {
    const page = await newSpecPage({
      components: [LeSidePanel],
      html: `<le-side-panel></le-side-panel>`,
    });
    // Without collapseAt, the component stays in wide mode (isNarrow=false,
    // responsiveReady=true). Not collapsed → layoutHasInlinePanel=true.
    const layout = shadowQuery(page.root!, '.layout');
    expect(layout.classList.contains('has-panel')).toBe(true);
    const inlinePanel = shadowQuery(page.root!, '.inline-panel');
    expect(inlinePanel.classList.contains('hidden')).toBe(false);
  });

  it('hides inline panel when collapsed (wide mode)', async () => {
    const page = await newSpecPage({
      components: [LeSidePanel],
      html: `<le-side-panel collapsed></le-side-panel>`,
    });
    const layout = shadowQuery(page.root!, '.layout');
    expect(layout.classList.contains('has-panel')).toBe(false);
    const inlinePanel = shadowQuery(page.root!, '.inline-panel');
    expect(inlinePanel.classList.contains('hidden')).toBe(true);
  });

  it('emits leSidePanelCollapsedChange when collapsed prop changes', async () => {
    const page = await newSpecPage({
      components: [LeSidePanel],
      html: `<le-side-panel></le-side-panel>`,
    });
    const spy = captureEvent(page.root!, 'leSidePanelCollapsedChange');
    page.root!.collapsed = true;
    await page.waitForChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    const detail = eventDetail<{ collapsed: boolean; panelId?: string }>(spy);
    expect(detail.collapsed).toBe(true);
  });

  it('toggles collapsed via leSidePanelRequestToggle document event', async () => {
    const page = await newSpecPage({
      components: [LeSidePanel],
      html: `<le-side-panel></le-side-panel>`,
    });
    // @Listen('leSidePanelRequestToggle', { target: 'document' }) registers on
    // jsdom's document. In wide mode (no collapseAt), the toggle action sets collapsed.
    expect(page.root!.collapsed).toBe(false);
    document.dispatchEvent(
      new CustomEvent('leSidePanelRequestToggle', {
        bubbles: true,
        detail: { action: 'toggle' },
      }),
    );
    await page.waitForChanges();
    expect(page.root!.collapsed).toBe(true);
  });
});

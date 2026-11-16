import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

/** Flush pending requestAnimationFrame callbacks in the page context. */
async function flushRaf(page: Awaited<ReturnType<typeof newE2EPage>>) {
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => r())));
  await page.waitForChanges();
}

const BASE_STYLES = `<style>
  body { margin: 0; }
  .page { display: flex; width: 100%; height: 100%; }
</style>`;

describe('le-side-panel e2e', () => {
  it('shows inline panel in wide mode (no collapseAt)', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(`
      ${BASE_STYLES}
      <le-side-panel>
        <div slot="panel">Navigation</div>
        <div>Main content</div>
      </le-side-panel>
    `);
    await page.waitForChanges();

    // Without collapseAt the component is always in wide mode. collapsed=false by
    // default → the inline panel is visible (part="inline-panel" lacks "hidden" class).
    const inlinePanel = await page.find('le-side-panel >>> [part="inline-panel"]');
    const cls = await inlinePanel.getAttribute('class');
    expect(cls).not.toContain('hidden');
  });

  it('collapses panel and emits event via leSidePanelRequestToggle', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(`
      ${BASE_STYLES}
      <le-side-panel>
        <div slot="panel">Navigation</div>
        <div>Main content</div>
      </le-side-panel>
    `);
    await page.waitForChanges();

    const collapsedChange = await page.spyOnEvent('leSidePanelCollapsedChange');

    await page.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent('leSidePanelRequestToggle', {
          bubbles: true,
          detail: { action: 'toggle' },
        }),
      );
    });
    await page.waitForChanges();

    const panel = await page.find('le-side-panel');
    expect(await panel.getProperty('collapsed')).toBe(true);
    // panelId is undefined and undefined is dropped by JSON serialization, so omit it.
    expect(collapsedChange).toHaveReceivedEventDetail({ collapsed: true });
  });

  it('persists collapsed state to localStorage via persistKey', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(`
      ${BASE_STYLES}
      <le-side-panel persist-key="sp-e2e">
        <div slot="panel">Navigation</div>
        <div>Main content</div>
      </le-side-panel>
    `);
    await page.waitForChanges();

    // Collapse via toggle event (triggers persistState → localStorage.setItem).
    await page.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent('leSidePanelRequestToggle', {
          bubbles: true,
          detail: { action: 'close' },
        }),
      );
    });
    await page.waitForChanges();

    // Verify the state was written to localStorage.
    const stored = await page.evaluate(() => localStorage.getItem('sp-e2e'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.collapsed).toBe(true);
  });

  it('opens overlay in narrow mode and closes with Escape', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 400 });
    await page.setContent(`
      ${BASE_STYLES}
      <le-side-panel collapse-at="9999">
        <div slot="panel"><button>Link 1</button><button>Link 2</button></div>
        <div>Main content</div>
      </le-side-panel>
    `);
    // Flush the connectedCallback RAF that measures el.clientWidth and sets isNarrow=true.
    await flushRaf(page);

    const openChange = await page.spyOnEvent('leSidePanelOpenChange');

    // Open the panel via a toggle event.
    await page.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent('leSidePanelRequestToggle', {
          bubbles: true,
          detail: { action: 'open' },
        }),
      );
    });
    // Flush the overlay-visibility RAF inside onOpenChanged.
    await flushRaf(page);

    const overlay = await page.find('le-side-panel >>> [part="overlay"]');
    expect(overlay).not.toBeNull();

    // Escape should close the overlay.
    await page.keyboard.press('Escape');
    await page.waitForChanges();

    const panel = await page.find('le-side-panel');
    expect(await panel.getProperty('open')).toBe(false);
    // panelId is undefined; undefined is dropped by JSON serialization so omit it.
    expect(openChange).toHaveReceivedEventDetail({ open: false });
  });

  it('closes overlay when clicking outside (backdrop)', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 400 });
    await page.setContent(`
      ${BASE_STYLES}
      <le-side-panel style="display:block;height:400px;" collapse-at="9999">
        <div slot="panel"><button>Link</button></div>
        <div>Main content</div>
      </le-side-panel>
    `);
    await flushRaf(page);

    // Open the panel.
    await page.evaluate(() => {
      document.dispatchEvent(
        new CustomEvent('leSidePanelRequestToggle', {
          bubbles: true,
          detail: { action: 'open' },
        }),
      );
    });
    await flushRaf(page);

    // Verify overlay is present.
    const overlay = await page.find('le-side-panel >>> [part="overlay"]');
    expect(overlay).not.toBeNull();

    // Click outside the panel using absolute viewport coordinates.
    // Panel is on the start side (left, 280px wide); clicking at x=350 hits the backdrop.
    // Use page.mouse.click so that pointerdown events are dispatched (onOverlayPointerDown).
    await page.mouse.click(350, 200);
    await page.waitForChanges();

    const panel = await page.find('le-side-panel');
    expect(await panel.getProperty('open')).toBe(false);
  });

  describe('published state', () => {
    /** Records every le-side-panel:state event from the very start of the page. */
    async function recordStates(page: Awaited<ReturnType<typeof newE2EPage>>) {
      await page.evaluateOnNewDocument(() => {
        (window as any).__states = [];
        document.addEventListener('le-side-panel:state', (e: Event) => {
          (window as any).__states.push((e as CustomEvent).detail);
        });
      });
    }

    const lastState = (page: Awaited<ReturnType<typeof newE2EPage>>) =>
      page.evaluate(() => {
        const states = (window as any).__states as { key: string; state: unknown }[];
        return states[states.length - 1];
      });

    it('publishes its initial state once measured, keyed by id', async () => {
      const page = await newE2EPage();
      await recordStates(page);
      await page.setViewport({ width: 900, height: 400 });
      await page.setContent(`
        ${BASE_STYLES}
        <le-side-panel id="recipes" panel-id="recipes-panel" collapse-at="720" style="height: 300px">
          <div slot="panel">Recipes</div>
          <div>Main content</div>
        </le-side-panel>
      `);
      await page.waitForChanges();
      await flushRaf(page);

      expect(await lastState(page)).toEqual({
        key: 'recipes',
        state: { visible: true, narrow: false, open: false, collapsed: false },
      });
    });

    it('reflects narrow mode as an attribute and publishes it', async () => {
      const page = await newE2EPage();
      await recordStates(page);
      await page.setViewport({ width: 400, height: 400 });
      await page.setContent(`
        ${BASE_STYLES}
        <le-side-panel panel-id="recipes" collapse-at="720" style="height: 300px">
          <div slot="panel">Recipes</div>
          <div>Main content</div>
        </le-side-panel>
      `);
      await page.waitForChanges();
      await flushRaf(page);

      const host = await page.find('le-side-panel');
      expect(host).toHaveAttribute('narrow');
      expect(await lastState(page)).toEqual({
        key: 'recipes',
        state: { visible: false, narrow: true, open: false, collapsed: false },
      });
    });

    it('publishes visible: false when collapsed', async () => {
      const page = await newE2EPage();
      await recordStates(page);
      await page.setViewport({ width: 900, height: 400 });
      await page.setContent(`
        ${BASE_STYLES}
        <le-side-panel id="recipes" style="height: 300px">
          <div slot="panel">Recipes</div>
          <div>Main content</div>
        </le-side-panel>
      `);
      await page.waitForChanges();
      const host = await page.find('le-side-panel');
      host.setProperty('collapsed', true);
      await page.waitForChanges();
      await flushRaf(page);

      expect(host).not.toHaveAttribute('narrow');
      expect(await lastState(page)).toEqual({
        key: 'recipes',
        state: { visible: false, narrow: false, open: false, collapsed: true },
      });
    });
  });

  describe('margin shorthand', () => {
    /** Panel rect relative to the host, in px. */
    async function panelBox(page: Awaited<ReturnType<typeof newE2EPage>>, part: 'inline-panel' | 'overlay') {
      return page.evaluate(p => {
        const host = document.querySelector('le-side-panel')!;
        const panel = host.shadowRoot!.querySelector(`[part="${p}"] [part="panel"]`)!;
        const h = host.getBoundingClientRect();
        const r = panel.getBoundingClientRect();
        return {
          top: Math.round(r.top - h.top),
          right: Math.round(h.right - r.right),
          height: Math.round(r.height),
          width: Math.round(r.width),
        };
      }, part);
    }

    it('applies a one-side margin to the inline panel and keeps full height', async () => {
      const page = await newE2EPage();
      await page.setViewport({ width: 900, height: 400 });
      await page.setContent(`
        ${BASE_STYLES}
        <le-side-panel side="end" panel-width="220" style="height: 300px; --le-side-panel-margin: 0 12px 0 0">
          <div slot="panel">Recipes</div>
          <div>Main content</div>
        </le-side-panel>
      `);
      await page.waitForChanges();
      await flushRaf(page);

      const box = await panelBox(page, 'inline-panel');
      expect(box.top).toBe(0);
      expect(box.right).toBe(12);
      expect(box.height).toBe(300);
      expect(box.width).toBe(208);
    });

    it('applies a one-side margin to the overlay panel and keeps full height', async () => {
      const page = await newE2EPage();
      await page.setViewport({ width: 400, height: 400 });
      await page.setContent(`
        ${BASE_STYLES}
        <le-side-panel side="end" panel-width="220" collapse-at="720" narrow-behavior="overlay"
          style="height: 400px; --le-side-panel-margin: 0 12px 0 0">
          <div slot="panel">Recipes</div>
          <div>Main content</div>
        </le-side-panel>
      `);
      await page.waitForChanges();
      const panel = await page.find('le-side-panel');
      panel.setProperty('open', true);
      await page.waitForChanges();
      await flushRaf(page);
      await page.evaluate(() => new Promise(r => setTimeout(r, 400)));

      const box = await panelBox(page, 'overlay');
      expect(box.right).toBe(12);
      expect(box.height).toBe(400);
    });
  });
});

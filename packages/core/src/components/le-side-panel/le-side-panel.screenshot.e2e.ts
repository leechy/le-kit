import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

/** Flush pending requestAnimationFrame callbacks in the page context. */
async function flushRaf(page: Awaited<ReturnType<typeof newE2EPage>>) {
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => r())));
  await page.waitForChanges();
}

// Disable CSS transitions so screenshots are deterministic.
const WRAPPER = `<style>
  html, body { margin: 0; height: 100%; background: var(--le-color-bg, #fff); }
  le-side-panel { --le-side-panel-transition: 0ms; }
  .nav { padding: 12px 16px; font-size: 13px; color: var(--le-color-text, #333); }
  .main { padding: 16px; font-size: 13px; color: var(--le-color-text, #333); flex: 1; }
</style>`;

const VIEWPORTS = {
  md: { width: 600, height: 300 },
  lg: { width: 800, height: 300 },
};

describe('le-side-panel screenshots', () => {
  it('wide mode — start side panel open', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(`
      ${WRAPPER}
      <le-side-panel style="display:block;height:300px;">
        <div slot="panel" class="nav">Navigation content</div>
        <div class="main">Main content area</div>
      </le-side-panel>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('wide mode — panel collapsed', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(`
      ${WRAPPER}
      <le-side-panel collapsed style="display:block;height:300px;">
        <div slot="panel" class="nav">Navigation content</div>
        <div class="main">Main content area (full width)</div>
      </le-side-panel>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('wide mode — end side panel', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(`
      ${WRAPPER}
      <le-side-panel side="end" style="display:block;height:300px;">
        <div slot="panel" class="nav">End panel content</div>
        <div class="main">Main content area</div>
      </le-side-panel>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('narrow overlay mode — panel open', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 300 });
    await page.setContent(`
      ${WRAPPER}
      <le-side-panel collapse-at="9999" style="display:block;height:300px;">
        <div slot="panel" class="nav">Navigation content</div>
        <div class="main">Main content area</div>
      </le-side-panel>
    `);
    // Flush the connectedCallback RAF that measures clientWidth and sets isNarrow=true.
    await flushRaf(page);

    // Open the overlay via event.
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

    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('state matrix (wide-open / wide-collapsed / end-side)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.lg);
    await page.setContent(`
      ${WRAPPER}
      <div style="display:grid;grid-template-rows:1fr 1fr 1fr;gap:8px;height:300px;background:var(--le-color-bg,#fff);padding:8px;box-sizing:border-box;">
        <le-side-panel style="display:block;height:88px;">
          <div slot="panel" class="nav">Nav (wide)</div>
          <div class="main">Content</div>
        </le-side-panel>
        <le-side-panel collapsed style="display:block;height:88px;">
          <div slot="panel" class="nav">Nav (collapsed)</div>
          <div class="main">Content (full)</div>
        </le-side-panel>
        <le-side-panel side="end" style="display:block;height:88px;">
          <div slot="panel" class="nav">Nav (end)</div>
          <div class="main">Content</div>
        </le-side-panel>
      </div>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

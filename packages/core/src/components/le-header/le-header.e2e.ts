import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

type Page = Awaited<ReturnType<typeof newE2EPage>>;

/** Records every le-header:state event from the very start of the page. */
async function recordStates(page: Page) {
  await page.evaluateOnNewDocument(() => {
    (window as any).__states = [];
    document.addEventListener('le-header:state', (e: Event) => {
      (window as any).__states.push((e as CustomEvent).detail);
    });
  });
}

const lastState = (page: Page) =>
  page.evaluate(() => {
    const states = (window as any).__states as { key: string; state: unknown }[];
    return states[states.length - 1];
  });

const settle = (page: Page) => page.evaluate(() => new Promise(r => setTimeout(r, 100)));

const CONTENT = `
  <style>body { margin: 0; } .tall { height: 3000px; }</style>
  <le-header id="top" sticky shrink-offset="100"><span>Title</span></le-header>
  <div class="tall"></div>
`;

describe('le-header published state', () => {
  it('publishes its initial state, keyed by id', async () => {
    const page = await newE2EPage();
    await recordStates(page);
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(CONTENT);
    await page.waitForChanges();
    await settle(page);

    expect(await lastState(page)).toEqual({ key: 'top', state: { shrunk: false, visible: true } });
  });

  it('publishes shrunk: true after scrolling past the shrink offset', async () => {
    const page = await newE2EPage();
    await recordStates(page);
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(CONTENT);
    await page.waitForChanges();

    await page.evaluate(() => window.scrollTo(0, 400));
    await settle(page);
    await page.waitForChanges();

    expect(await lastState(page)).toEqual({ key: 'top', state: { shrunk: true, visible: true } });
  });
});

import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

const WRAPPER = `<style>body { margin: 0; padding: 24px; display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; background: var(--le-color-bg, #fff); }</style>`;
const VIEWPORTS = {
  sm: { width: 320, height: 100 },
  md: { width: 400, height: 120 },
  lg: { width: 800, height: 240 },
};

describe('le-button screenshots', () => {
  it('default (solid / primary / medium)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button>Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('variant: outlined', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button variant="outlined">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('variant: clear', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button variant="clear">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('color: secondary', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button color="secondary">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('color: danger', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button color="danger">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('size: small', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button size="small">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('size: large', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button size="large">Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('disabled', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button disabled>Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('selected', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button selected>Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('full-width', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(`${WRAPPER}<le-button full-width>Click me</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('icon-only (via prop)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button icon-only="★"></le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-start', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button icon-start="→">Save</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-end', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button icon-end="→">Next</le-button>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('keyboard focus state', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-button>Focus me</le-button>`);

    const innerButton = await page.find('le-button >>> button.le-button-container');
    await innerButton.focus();

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('variant matrix (solid / outlined / clear × primary / secondary / danger)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.lg);
    await page.setContent(`
      ${WRAPPER}
      <le-button variant="solid"    color="primary">  Solid Primary</le-button>
      <le-button variant="solid"    color="secondary">Solid Secondary</le-button>
      <le-button variant="solid"    color="danger">   Solid Danger</le-button>
      <br>
      <le-button variant="outlined" color="primary">  Outlined Primary</le-button>
      <le-button variant="outlined" color="secondary">Outlined Secondary</le-button>
      <le-button variant="outlined" color="danger">   Outlined Danger</le-button>
      <br>
      <le-button variant="clear"    color="primary">  Clear Primary</le-button>
      <le-button variant="clear"    color="secondary">Clear Secondary</le-button>
      <le-button variant="clear"    color="danger">   Clear Danger</le-button>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

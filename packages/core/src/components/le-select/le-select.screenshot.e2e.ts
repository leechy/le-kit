import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

const WRAPPER = `<style>body { margin: 0; padding: 24px; background: var(--le-color-bg, #fff); }</style>`;
const OPTIONS = `[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"},{"label":"Gamma","value":"g"},{"label":"Delta","value":"d"}]`;
const VIEWPORTS = {
  sm: { width: 320, height: 100 },
  md: { width: 400, height: 120 },
  lg: { width: 800, height: 240 },
};

describe('le-select screenshots', () => {
  it('default (placeholder)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(
      `${WRAPPER}<le-select placeholder="Choose an option" options='${OPTIONS}'></le-select>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with selected value', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-select value="g" options='${OPTIONS}'></le-select>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('disabled state', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(
      `${WRAPPER}<le-select disabled value="b" options='${OPTIONS}'></le-select>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('open dropdown', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 320 });
    await page.setContent(`${WRAPPER}<le-select value="b" options='${OPTIONS}'></le-select>`);
    await page.waitForChanges();

    const trigger = await page.find('le-select >>> le-button >>> button.le-button-container');
    await trigger.click();
    await page.waitForChanges();

    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('state matrix (placeholder/value/disabled/size variants)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.lg);
    await page.setContent(`
      ${WRAPPER}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
        <le-select placeholder="Placeholder" options='${OPTIONS}'></le-select>
        <le-select value="a" options='${OPTIONS}'></le-select>
        <le-select value="b" disabled options='${OPTIONS}'></le-select>
        <le-select value="g" size="small" options='${OPTIONS}'></le-select>
      </div>
    `);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

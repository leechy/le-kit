import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

const WRAPPER = `<style>body { margin: 0; padding: 24px; background: var(--le-color-bg, #fff); }</style>`;

describe('le-string-input screenshots', () => {
  it('default (no label, no value)', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" placeholder="Placeholder..."></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with label', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 120 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Email address"></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with label and description', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 140 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Email address" description="We'll never share your email."></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with value', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe"></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('clearable with value', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Search" value="hello" clearable></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('disabled', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe" disabled></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('readonly', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe" readonly></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-start', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="Search" icon-start="🔍"></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-end', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 100 });
    await page.setContent(`${WRAPPER}<le-string-input name="field" label="URL" icon-end="↗"></le-string-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

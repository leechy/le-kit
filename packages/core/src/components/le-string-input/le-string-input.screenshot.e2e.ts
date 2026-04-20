import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

const WRAPPER = `<style>body { margin: 0; padding: 24px; background: var(--le-color-bg, #fff); }</style>`;
const VIEWPORTS = {
  sm: { width: 320, height: 100 },
  md: { width: 400, height: 120 },
  lg: { width: 800, height: 240 },
};

describe('le-string-input screenshots', () => {
  it('default (no label, no value)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" placeholder="Placeholder..."></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with label', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Email address"></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with label and description', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 400, height: 140 });
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Email address" description="We'll never share your email."></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with value', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe"></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('clearable with value', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Search" value="hello" clearable></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('disabled', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe" disabled></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('readonly', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Name" value="Jane Doe" readonly></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-start', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Search" icon-start="🔍"></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with icon-end', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="URL" icon-end="↗"></le-string-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('keyboard focus state', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-string-input name="field" label="Name"></le-string-input>`,
    );

    const input = await page.find('le-string-input >>> input');
    await input.focus();

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('state matrix (default/value/clearable/disabled/readonly)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.lg);
    await page.setContent(`
      ${WRAPPER}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
        <le-string-input name="s1" label="Default"></le-string-input>
        <le-string-input name="s2" label="With value" value="Hello"></le-string-input>
        <le-string-input name="s3" label="Clearable" value="Search text" clearable></le-string-input>
        <le-string-input name="s4" label="Disabled" value="Unavailable" disabled></le-string-input>
        <le-string-input name="s5" label="Readonly" value="Read only" readonly></le-string-input>
      </div>
    `);

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

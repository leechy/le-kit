import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

const WRAPPER = `<style>body { margin: 0; padding: 24px; background: var(--le-color-bg, #fff); }</style>`;
const VIEWPORTS = {
  sm: { width: 320, height: 120 },
  md: { width: 400, height: 140 },
  lg: { width: 800, height: 260 },
};

describe('le-code-input screenshots', () => {
  it('default', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(`${WRAPPER}<le-code-input name="otp" length="6"></le-code-input>`);
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('with label and value', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-code-input name="otp" label="Verification code" value="12AB" length="6"></le-code-input>`,
    );
    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('focus state', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.sm);
    await page.setContent(
      `${WRAPPER}<le-code-input name="otp" value="123" length="6"></le-code-input>`,
    );

    const input = await page.find('le-code-input >>> input.ghost-input');
    await input.focus();

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('error state hides description and styles boxes', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.md);
    await page.setContent(
      `${WRAPPER}<le-code-input name="otp" label="Verification code" value="123" error description="Must be 6 characters"></le-code-input>`,
    );

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });

  it('state matrix (default/value/focus/error/disabled)', async () => {
    const page = await newE2EPage();
    await page.setViewport(VIEWPORTS.lg);
    await page.setContent(`
      ${WRAPPER}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
        <le-code-input name="c1" label="Default"></le-code-input>
        <le-code-input name="c2" label="With value" value="A1B2"></le-code-input>
        <le-code-input name="c3" label="Error" value="12" error></le-code-input>
        <le-code-input name="c4" label="Disabled" value="1234" disabled></le-code-input>
      </div>
    `);

    const focusInput = await page.find('le-code-input[name="c2"] >>> input.ghost-input');
    await focusInput.focus();

    await page.waitForChanges();
    expect(await page.compareScreenshot()).toMatchScreenshot();
  });
});

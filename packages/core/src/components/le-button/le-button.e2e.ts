import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-button e2e', () => {
  it('activates with keyboard Enter key', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button>Submit</le-button>');

    const clickEvent = await page.spyOnEvent('click');

    // The native <button> is inside the shadow DOM — focus and press there.
    const innerButton = await page.find('le-button >>> button.le-button-container');
    await innerButton.focus();
    await innerButton.press('Enter');

    expect(clickEvent).toHaveReceivedEventTimes(1);
  });

  it('activates with keyboard Space key', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button>Submit</le-button>');

    const clickEvent = await page.spyOnEvent('click');

    const innerButton = await page.find('le-button >>> button.le-button-container');
    await innerButton.focus();
    await innerButton.press('Space');

    expect(clickEvent).toHaveReceivedEventTimes(1);
  });

  it('does not emit click when disabled', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button disabled>Disabled</le-button>');

    const clickEvent = await page.spyOnEvent('click');

    const host = await page.find('le-button');
    await host.click();

    expect(clickEvent).toHaveReceivedEventTimes(0);
  });

  it('renders as a native anchor when href is provided', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button href="/docs" target="_blank">Docs</le-button>');

    const anchor = await page.find('le-button >>> a.le-button-container');

    expect(anchor).not.toBeNull();
    expect(await anchor.getAttribute('href')).toBe('/docs');
    expect(await anchor.getAttribute('target')).toBe('_blank');
  });

  it('is focusable and reachable via Tab', async () => {
    const page = await newE2EPage();
    await page.setContent('<button id="before">Before</button><le-button>Target</le-button>');

    await page.focus('#before');
    await page.keyboard.press('Tab');

    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(activeTag).toBe('le-button');
  });

  it('disabled button is not focusable via Tab', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<button id="before">Before</button><le-button disabled>Target</le-button><button id="after">After</button>',
    );

    await page.focus('#before');
    await page.keyboard.press('Tab');

    const activeId = await page.evaluate(() => document.activeElement?.id);
    expect(activeId).toBe('after');
  });
});

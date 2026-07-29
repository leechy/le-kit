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

  it('does not activate with keyboard when disabled', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button disabled>Disabled</le-button>');

    const clickEvent = await page.spyOnEvent('click');

    const innerButton = await page.find('le-button >>> button.le-button-container');
    await innerButton.press('Enter');
    await innerButton.press('Space');

    expect(clickEvent).toHaveReceivedEventTimes(0);
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

  it('anchor mode activates with Enter key', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-button href="#docs">Docs</le-button>');

    const clickEvent = await page.spyOnEvent('click');

    const anchor = await page.find('le-button >>> a.le-button-container');
    await anchor.focus();
    await anchor.press('Enter');

    expect(clickEvent).toHaveReceivedEventTimes(1);
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

  it('forwards icon-count to start icon in le-button', async () => {
    const page = await newE2EPage();
    await page.evaluateOnNewDocument(() => {
      (window as any).LE_KIT_CONFIG = {
        icons: {
          file: { viewBox: '0 0 16 16', children: [] },
        },
      };
    });
    await page.setContent('<le-button icon-start="file" icon-count="4">Notifications</le-button>');

    const icon = await page.find('le-button >>> le-icon');
    expect(icon).not.toBeNull();
    expect(await icon.getAttribute('count')).toBe('4');
  });

  it('forwards icon-only-count to icon-only in le-button', async () => {
    const page = await newE2EPage();
    await page.evaluateOnNewDocument(() => {
      (window as any).LE_KIT_CONFIG = {
        icons: {
          folder: { viewBox: '0 0 16 16', children: [] },
        },
      };
    });
    await page.setContent('<le-button icon-only="folder" icon-only-count="12" label="Inbox"></le-button>');

    const icon = await page.find('le-button >>> le-icon');
    expect(icon).not.toBeNull();
    expect(await icon.getAttribute('count')).toBe('12');
  });

  it('supports slot-specific icon-start-count and icon-end-count in le-button', async () => {
    const page = await newE2EPage();
    await page.evaluateOnNewDocument(() => {
      (window as any).LE_KIT_CONFIG = {
        icons: {
          file: { viewBox: '0 0 16 16', children: [] },
          'arrow-right': { viewBox: '0 0 16 16', children: [] },
        },
      };
    });
    await page.setContent(
      '<le-button icon-start="file" icon-start-count="3" icon-end="arrow-right">Next</le-button>',
    );

    const startIcon = await page.find('le-button >>> .icon-start le-icon');
    expect(startIcon).not.toBeNull();
    expect(await startIcon.getAttribute('count')).toBe('3');

    const endIcon = await page.find('le-button >>> .icon-end le-icon');
    expect(endIcon).not.toBeNull();
    expect(await endIcon.getAttribute('count')).toBeNull();
  });
});

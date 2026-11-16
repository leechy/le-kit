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

describe('le-button icon-only layout', () => {
  /** Horizontal offset of the le-icon's center from the button's center, in px. */
  async function iconOffset(html: string) {
    const page = await newE2EPage();
    await page.setContent(html);
    await page.waitForChanges();
    return page.evaluate(() => {
      const host = document.querySelector('le-button')!;
      const button = host.shadowRoot!.querySelector('button')!.getBoundingClientRect();
      const icon = (host.querySelector('le-icon[slot="icon-only"]') ??
        host.shadowRoot!.querySelector('span.icon-only le-icon'))!.getBoundingClientRect();
      return icon.left + icon.width / 2 - (button.left + button.width / 2);
    });
  }

  it('centers a slotted icon', async () => {
    const offset = await iconOffset(
      `<le-button variant="outlined"><le-icon slot="icon-only" name="hamburger"></le-icon>Label</le-button>`,
    );
    expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  });

  it('centers an icon given as a property', async () => {
    const offset = await iconOffset(`<le-button variant="outlined" icon-only="hamburger">Label</le-button>`);
    expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  });
});

describe('le-button selected colors', () => {
  for (const variant of ['outlined', 'clear']) {
    it(`gives icons the label color when a ${variant} button is selected`, async () => {
      const page = await newE2EPage();
      await page.setContent(
        `<le-button variant="${variant}" selected><le-icon slot="icon-start" name="hamburger"></le-icon>Label</le-button>`,
      );
      await page.waitForChanges();

      const colors = await page.evaluate(() => {
        const host = document.querySelector('le-button')!;
        const container = host.shadowRoot!.querySelector('button')!;
        const icon = host.querySelector('le-icon')!;
        return { label: getComputedStyle(container).color, icon: getComputedStyle(icon).color };
      });

      expect(colors.icon).toBe(colors.label);
    });
  }
});

describe('le-button selected hover', () => {
  for (const variant of ['outlined', 'clear']) {
    it(`keeps a contrasting background when a selected ${variant} button is hovered`, async () => {
      const page = await newE2EPage();
      await page.setContent(`<le-button variant="${variant}" selected>Label</le-button>`);
      await page.waitForChanges();

      const read = () =>
        page.evaluate(() => getComputedStyle(document.querySelector('le-button')!.shadowRoot!.querySelector('button')!).backgroundColor);
      const before = await read();
      const container = await page.find('le-button >>> button');
      await container.hover();
      await page.evaluate(() => new Promise(r => setTimeout(r, 400))); // background transition
      const hovered = await read();

      // Hover may darken the selected background, but must not drop to the
      // light hover color of an unselected button (white label on light gray).
      const lightness = (rgb: string) => {
        const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
        return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
      };
      expect(lightness(hovered)).toBeLessThanOrEqual(lightness(before) + 0.05);
    });
  }
});

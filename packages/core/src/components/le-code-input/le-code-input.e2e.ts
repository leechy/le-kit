import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-code-input e2e', () => {
  it('emits leInput on typing sequence and mirrors characters to visual boxes', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-code-input name="otp" length="6"></le-code-input>');

    const leInput = await page.spyOnEvent('leInput');

    const input = await page.find('le-code-input >>> input.ghost-input');
    await input.focus();
    await input.type('A1B2C3');

    expect(leInput).toHaveReceivedEventTimes(6);

    const values = await page.evaluate(() => {
      const host = document.querySelector('le-code-input');
      const boxes = Array.from(host?.shadowRoot?.querySelectorAll('.code-box') || []);
      return boxes.map(box => (box.textContent || '').trim());
    });

    expect(values).toEqual(['A', '1', 'B', '2', 'C', '3']);
  });

  it('handles paste-like input and truncates value to configured length', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-code-input name="otp" length="6"></le-code-input>');

    const leInput = await page.spyOnEvent('leInput');

    await page.evaluate(() => {
      const host = document.querySelector('le-code-input') as HTMLElement | null;
      const input = host?.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement | null;
      if (!input) return;

      input.value = '123456789';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const input = await page.find('le-code-input >>> input.ghost-input');
    expect(await input.getProperty('value')).toBe('123456');

    expect(leInput).toHaveReceivedEventTimes(1);
    expect(leInput).toHaveReceivedEventDetail({ value: '123456', name: 'otp' });
  });

  it('emits leChange on blur after realistic typing', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<le-code-input name="otp"></le-code-input><button id="next">Next</button>',
    );

    const leChange = await page.spyOnEvent('leChange');

    const input = await page.find('le-code-input >>> input.ghost-input');
    await input.type('9876');
    await input.press('Tab');

    expect(leChange).toHaveReceivedEventTimes(1);
    expect(leChange).toHaveReceivedEventDetail({ value: '9876', name: 'otp' });
  });

  it('reflects cursor movement in active box highlighting', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-code-input value="123456" length="6"></le-code-input>');

    await page.evaluate(() => {
      const host = document.querySelector('le-code-input') as HTMLElement | null;
      const input = host?.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement | null;
      if (!input) return;

      input.focus();
    });
    await page.waitForChanges();

    let activeIndex = await page.evaluate(() => {
      const host = document.querySelector('le-code-input');
      const boxes = Array.from(host?.shadowRoot?.querySelectorAll('.code-box') || []);
      return boxes.findIndex(box => box.classList.contains('active'));
    });

    // On focus, the component moves caret to the end of current value.
    expect(activeIndex).toBe(5);

    await page.evaluate(() => {
      const host = document.querySelector('le-code-input') as HTMLElement | null;
      const input = host?.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement | null;
      if (!input) return;

      input.setSelectionRange(3, 3);
      input.dispatchEvent(new Event('select', { bubbles: true }));
    });
    await page.waitForChanges();

    activeIndex = await page.evaluate(() => {
      const host = document.querySelector('le-code-input');
      const boxes = Array.from(host?.shadowRoot?.querySelectorAll('.code-box') || []);
      return boxes.findIndex(box => box.classList.contains('active'));
    });

    expect(activeIndex).toBe(3);

    await page.evaluate(() => {
      const host = document.querySelector('le-code-input') as HTMLElement | null;
      const input = host?.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement | null;
      if (!input) return;

      input.setSelectionRange(2, 2);
      input.dispatchEvent(new Event('select', { bubbles: true }));
    });
    await page.waitForChanges();

    activeIndex = await page.evaluate(() => {
      const host = document.querySelector('le-code-input');
      const boxes = Array.from(host?.shadowRoot?.querySelectorAll('.code-box') || []);
      return boxes.findIndex(box => box.classList.contains('active'));
    });

    expect(activeIndex).toBe(2);
  });

  it('forwards numeric mode attributes for mobile keyboard hints', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-code-input type="number"></le-code-input>');

    const input = await page.find('le-code-input >>> input.ghost-input');

    expect(await input.getAttribute('inputmode')).toBe('numeric');
    expect(await input.getAttribute('pattern')).toBe('[0-9]*');
  });
});

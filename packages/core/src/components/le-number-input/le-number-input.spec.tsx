import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeNumberInput } from './le-number-input';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-number-input', () => {
  it('renders correctly with initial props', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="5" step="1"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('5');
  });

  it('handles default ArrowUp and ArrowDown key navigation', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="1"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(11);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(10);
  });

  it('applies default Shift (10x) and Alt (0.1x) steps', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="1"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    // Shift + ArrowUp -> +10
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(20);

    // Alt + ArrowUp -> +0.1 (should correctly evaluate to 20.1, fixing the rounding bug!)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(20.1);

    // Alt + ArrowDown -> -0.1
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(20);
  });

  it('respects custom shift-step and alt-step properties', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="1" shift-step="5" alt-step="0.25"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    // Shift + ArrowUp -> +5
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(15);

    // Alt + ArrowUp -> +0.25
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(15.25);
  });

  it('respects custom shift-multiplier and alt-multiplier properties', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="2" shift-multiplier="3" alt-multiplier="0.5"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    // Shift + ArrowUp -> + (2 * 3) = +6
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(16);

    // Alt + ArrowUp -> + (2 * 0.5) = +1
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(17);
  });

  it('respects Shift and Alt modifier keys when clicking spinner buttons', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="1" show-spinners="true"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const buttons = host.shadowRoot?.querySelectorAll('.le-input-controls le-button');
    const upBtn = buttons?.[0] as HTMLElement;
    const downBtn = buttons?.[1] as HTMLElement;

    // Shift + click increment -> +10
    upBtn.dispatchEvent(new CustomEvent('click', { detail: { shiftKey: true }, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(20);

    // Alt + click decrement -> -0.1
    downBtn.dispatchEvent(new CustomEvent('click', { detail: { altKey: true }, bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(19.9);
  });
});

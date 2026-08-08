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

    // Alt + ArrowUp -> +0.1
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
      html: '<le-number-input value="10" step="1" controls="spinner"></le-number-input>',
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

  it('renders stepper controls when controls="stepper"', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" step="1" controls="stepper"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const container = host.shadowRoot?.querySelector('.le-input-container');
    expect(container?.classList.contains('has-stepper')).toBe(true);

    const decBtn = host.shadowRoot?.querySelector('.stepper-decrement') as HTMLElement;
    const incBtn = host.shadowRoot?.querySelector('.stepper-increment') as HTMLElement;
    expect(decBtn).not.toBeNull();
    expect(incBtn).not.toBeNull();

    // Click increment -> 11
    incBtn.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(11);

    // Click decrement -> 10
    decBtn.dispatchEvent(new CustomEvent('click', { bubbles: true }));
    await page.waitForChanges();
    expect(host.value).toBe(10);
  });

  it('renders no control buttons when controls="none"', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" controls="none"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const spinners = host.shadowRoot?.querySelector('.le-input-controls');
    const decBtn = host.shadowRoot?.querySelector('.stepper-decrement');
    const incBtn = host.shadowRoot?.querySelector('.stepper-increment');

    expect(spinners).toBeNull();
    expect(decBtn).toBeNull();
    expect(incBtn).toBeNull();
  });

  it('renders icon-start and icon-end correctly', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="10" icon-start="#" icon-end="$" controls="spinner"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const iconStart = host.shadowRoot?.querySelector('.icon-start');
    const iconEnd = host.shadowRoot?.querySelector('.icon-end');

    expect(iconStart?.textContent).toBe('#');
    expect(iconEnd?.textContent).toBe('$');
  });

  it('supports slotted icon-start and icon-end content', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: `
        <le-number-input value="10">
          <span slot="icon-start">Start</span>
          <span slot="icon-end">End</span>
        </le-number-input>
      `,
    });

    const host = page.root as HTMLLeNumberInputElement;
    const iconStart = host.shadowRoot?.querySelector('.icon-start');
    const iconEnd = host.shadowRoot?.querySelector('.icon-end');

    expect(iconStart).not.toBeNull();
    expect(iconEnd).not.toBeNull();
  });

  it('clamps and stops keyboard navigation at min and max limits', async () => {
    const page = await newSpecPage({
      components: [LeNumberInput],
      html: '<le-number-input value="95" min="0" max="100" step="1" shift-step="10"></le-number-input>',
    });

    const host = page.root as HTMLLeNumberInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    // Shift + ArrowUp from 95 with step 10 -> clamped to max 100
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }));
    await page.waitForChanges();
    expect(host.value).toBe(100);

    // ArrowUp at max 100 -> stays at 100
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await page.waitForChanges();
    expect(host.value).toBe(100);

    // Shift + ArrowDown from 100 to 0 limit
    host.value = 5;
    await page.waitForChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }));
    await page.waitForChanges();
    expect(host.value).toBe(0);

    // ArrowDown at min 0 -> stays at 0
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await page.waitForChanges();
    expect(host.value).toBe(0);
  });
});

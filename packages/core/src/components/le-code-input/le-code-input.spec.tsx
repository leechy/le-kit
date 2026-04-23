import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { captureEvent, eventDetail, mockMutationObserver } from '../../utils/test-helpers';
import { LeCodeInput } from './le-code-input';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-code-input', () => {
  function mockSelection(input: HTMLInputElement, start: number, end: number) {
    Object.defineProperty(input, 'selectionStart', {
      configurable: true,
      get: () => start,
    });
    Object.defineProperty(input, 'selectionEnd', {
      configurable: true,
      get: () => end,
    });
  }

  it('renders one visual box per length', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input length="4"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const boxes = host.shadowRoot?.querySelectorAll('.code-box');

    expect(boxes?.length).toBe(4);
  });

  it('truncates initial value to configured length', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input length="4" value="123456"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const input = host.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement;

    expect(host.value).toBe('1234');
    expect(input.value).toBe('1234');
  });

  it('distributes pasted characters across visual boxes', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input length="6"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const input = host.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement;

    input.value = 'A1B2C3';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();

    const values = Array.from(host.shadowRoot?.querySelectorAll('.code-box') || []).map(
      el => el.textContent?.trim() || '',
    );

    expect(values).toEqual(['A', '1', 'B', '2', 'C', '3']);
  });

  it('truncates pasted value to length and emits trimmed leInput payload', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input name="otp" length="6"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const input = host.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement;
    const onLeInput = captureEvent(host, 'leInput');

    input.value = '123456789';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();

    expect(host.value).toBe('123456');
    expect(input.value).toBe('123456');
    expect(onLeInput).toHaveBeenCalledTimes(1);
    expect(eventDetail(onLeInput)).toEqual({ value: '123456', name: 'otp' });
  });

  it('marks selected range in visual boxes', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input value="ABCDEF" length="6"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const input = host.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement;

    input.dispatchEvent(new Event('focus'));
    mockSelection(input, 1, 3);
    input.dispatchEvent(new Event('select'));
    await page.waitForChanges();

    const boxes = Array.from(host.shadowRoot?.querySelectorAll('.code-box') || []);
    const selectedIndices = boxes
      .map((box, index) => ({ selected: box.classList.contains('selected'), index }))
      .filter(item => item.selected)
      .map(item => item.index);

    expect(selectedIndices).toEqual([1, 2]);
  });

  it('updates active index as cursor moves (including backspace-like move)', async () => {
    const page = await newSpecPage({
      components: [LeCodeInput],
      html: '<le-code-input value="123456" length="6"></le-code-input>',
    });

    const host = page.root as HTMLLeCodeInputElement;
    const input = host.shadowRoot?.querySelector('input.ghost-input') as HTMLInputElement;

    input.dispatchEvent(new Event('focus'));

    mockSelection(input, 3, 3);
    input.dispatchEvent(new Event('select'));
    await page.waitForChanges();

    let boxes = Array.from(host.shadowRoot?.querySelectorAll('.code-box') || []);
    let activeIndex = boxes.findIndex(box => box.classList.contains('active'));
    expect(activeIndex).toBe(3);

    // Simulate a backspace navigation step by moving cursor one char left.
    mockSelection(input, 2, 2);
    input.dispatchEvent(new Event('select'));
    await page.waitForChanges();

    boxes = Array.from(host.shadowRoot?.querySelectorAll('.code-box') || []);
    activeIndex = boxes.findIndex(box => box.classList.contains('active'));
    expect(activeIndex).toBe(2);
  });
});

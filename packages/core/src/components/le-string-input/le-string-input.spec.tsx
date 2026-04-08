import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { captureEvent, eventDetail, mockMutationObserver } from '../../utils/test-helpers';
import { LeStringInput } from './le-string-input';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-string-input', () => {
  it('renders default input attributes', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input name="username"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('name')).toBe('username');
  });

  it('reflects mode attribute on host', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input mode="admin"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;

    expect(host.getAttribute('mode')).toBe('admin');
  });

  it('emits leInput payload on keystroke', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input name="title" external-id="cms-1"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;
    const onLeInput = captureEvent(host, 'leInput');
    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();

    expect(onLeInput).toHaveBeenCalledTimes(1);
    expect(eventDetail(onLeInput)).toEqual({
      value: 'Hello',
      name: 'title',
      externalId: 'cms-1',
    });
  });

  it('emits leChange payload on change', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input name="title" external-id="cms-2"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;
    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;
    const onLeChange = captureEvent(host, 'leChange');
    input.value = 'World';
    input.dispatchEvent(new Event('change'));
    await page.waitForChanges();

    expect(onLeChange).toHaveBeenCalledTimes(1);
    expect(eventDetail(onLeChange)).toEqual({
      value: 'World',
      name: 'title',
      externalId: 'cms-2',
    });
  });

  it('shows clear button and clears value when clicked', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input clearable value="abc" name="field"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;
    const onLeInput = captureEvent(host, 'leInput');
    const onLeChange = captureEvent(host, 'leChange');

    const clearButton = host.shadowRoot?.querySelector('le-button') as HTMLElement;
    expect(clearButton).not.toBeNull();

    clearButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(onLeInput).toHaveBeenCalled();
    expect(onLeChange).toHaveBeenCalled();
  });

  it('keeps value when clear is clicked in readonly mode', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input clearable readonly value="abc"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;
    const clearButton = host.shadowRoot?.querySelector('le-button') as HTMLElement;

    clearButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    const input = host.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('abc');
  });

  it('shows label, description, and icon visibility classes from props', async () => {
    const page = await newSpecPage({
      components: [LeStringInput],
      html: '<le-string-input label="Label" description="Help text" icon-start="A" icon-end="B"></le-string-input>',
    });

    const host = page.root as HTMLLeStringInputElement;

    const label = host.shadowRoot?.querySelector('.le-input-label') as HTMLLabelElement;
    const description = host.shadowRoot?.querySelector('.le-input-description') as HTMLDivElement;
    const iconStart = host.shadowRoot?.querySelector('.icon-start') as HTMLSpanElement;
    const iconEnd = host.shadowRoot?.querySelector('.icon-end') as HTMLSpanElement;

    expect(label.classList.contains('is-visible')).toBe(true);
    expect(description.classList.contains('is-visible')).toBe(true);
    expect(iconStart.classList.contains('is-visible')).toBe(true);
    expect(iconEnd.classList.contains('is-visible')).toBe(true);
  });
});

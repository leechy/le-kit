import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeButton } from './le-button';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-button', () => {
  it('renders default host classes and native button attributes', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button>Click me</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;
    const button = host.shadowRoot?.querySelector(
      'button.le-button-container',
    ) as HTMLButtonElement;

    expect(host.classList.contains('variant-solid')).toBe(true);
    expect(host.classList.contains('color-primary')).toBe(true);
    expect(host.classList.contains('size-medium')).toBe(true);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('applies state classes from props', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button variant="outlined" color="danger" size="large" selected full-width>Danger</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;

    expect(host.classList.contains('variant-outlined')).toBe(true);
    expect(host.classList.contains('color-danger')).toBe(true);
    expect(host.classList.contains('size-large')).toBe(true);
    expect(host.classList.contains('selected')).toBe(true);
    expect(host.classList.contains('full-width')).toBe(true);
  });

  it('emits click from host when enabled', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button>Action</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;
    const button = host.shadowRoot?.querySelector(
      'button.le-button-container',
    ) as HTMLButtonElement;
    const onClick = jest.fn();

    host.addEventListener('click', onClick);
    button.click();
    await page.waitForChanges();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not emit click when disabled', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button disabled>Disabled</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;
    const button = host.shadowRoot?.querySelector(
      'button.le-button-container',
    ) as HTMLButtonElement;
    const onClick = jest.fn();

    host.addEventListener('click', onClick);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as anchor when href is set', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button href="/docs" target="_blank">Read docs</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;
    const anchor = host.shadowRoot?.querySelector('a.le-button-container') as HTMLAnchorElement;

    expect(anchor.getAttribute('href')).toBe('/docs');
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('role')).toBe('button');
  });

  it('switches to icon-only mode from prop', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button icon-only="★">Action</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;

    expect(host.classList.contains('icon-only')).toBe(true);
    expect(host.shadowRoot?.querySelector('.le-button-label')).toBeNull();
    expect(host.shadowRoot?.querySelector('.icon-only.is-visible')).not.toBeNull();
  });

  it('shows icon-start and icon-end from props', async () => {
    const page = await newSpecPage({
      components: [LeButton],
      html: '<le-button icon-start="←" icon-end="→">Label</le-button>',
    });

    const host = page.root as HTMLLeButtonElement;

    const iconStart = host.shadowRoot?.querySelector('.icon-start') as HTMLSpanElement;
    const iconEnd = host.shadowRoot?.querySelector('.icon-end') as HTMLSpanElement;

    expect(iconStart.classList.contains('is-visible')).toBe(true);
    expect(iconEnd.classList.contains('is-visible')).toBe(true);
  });
});

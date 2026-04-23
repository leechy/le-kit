import { beforeAll, describe, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeSelect } from './le-select';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-select', () => {
  it('renders selected label from options prop and value', async () => {
    const page = await newSpecPage({
      components: [LeSelect],
      html: `<le-select
        value="b"
        options='[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"}]'
      ></le-select>`,
    });

    const label = page.root?.shadowRoot?.querySelector('.trigger-label')?.textContent?.trim();
    expect(label).toBe('Beta');
  });

  it('updates selected label when value changes', async () => {
    const page = await newSpecPage({
      components: [LeSelect],
      html: `<le-select
        value="a"
        options='[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"}]'
      ></le-select>`,
    });

    const host = page.root as HTMLLeSelectElement;
    host.value = 'b';
    await page.waitForChanges();

    const label = host.shadowRoot?.querySelector('.trigger-label')?.textContent?.trim();
    expect(label).toBe('Beta');
  });

  it('supports expression-style options string parsing fallback', async () => {
    const page = await newSpecPage({
      components: [LeSelect],
      html: '<le-select value="2"></le-select>',
    });

    const host = page.root as HTMLLeSelectElement;
    host.options = "[{label:'One',value:'1'},{label:'Two',value:'2'}]";
    await page.waitForChanges();

    const label = host.shadowRoot?.querySelector('.trigger-label')?.textContent?.trim();
    expect(label).toBe('Two');
  });

  it('falls back to placeholder when value does not match options', async () => {
    const page = await newSpecPage({
      components: [LeSelect],
      html: `<le-select
        value="missing"
        placeholder="Pick one"
        options='[{"label":"Alpha","value":"a"}]'
      ></le-select>`,
    });

    const label = page.root?.shadowRoot?.querySelector('.trigger-label')?.textContent?.trim();
    expect(label).toBe('Pick one');
  });

  it('forwards disabled state to trigger and dropdown', async () => {
    const page = await newSpecPage({
      components: [LeSelect],
      html: `<le-select disabled options='[{"label":"Alpha","value":"a"}]'></le-select>`,
    });

    const dropdown = page.root?.shadowRoot?.querySelector('le-dropdown-base');
    const trigger = page.root?.shadowRoot?.querySelector('le-button.select-trigger');

    expect(dropdown?.hasAttribute('disabled')).toBe(true);
    expect(trigger?.hasAttribute('disabled')).toBe(true);
  });
});

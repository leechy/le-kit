import { beforeAll, describe, it, expect } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockMutationObserver } from '../../utils/test-helpers';
import { LeSegmentedControl } from './le-segmented-control';
import { LeItem } from '../le-item/le-item';
import { LeTab } from '../le-tab/le-tab';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-segmented-control', () => {
  it('renders segments from JSON string options attribute', async () => {
    const page = await newSpecPage({
      components: [LeSegmentedControl, LeTab],
      html: `<le-segmented-control
        value="b"
        options='[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"}]'
      ></le-segmented-control>`,
    });

    const segments = page.root?.shadowRoot?.querySelectorAll('le-tab.segment');
    expect(segments?.length).toBe(2);
    expect((segments?.[1] as any)?.selected).toBe(true);
  });

  it('renders segments from declarative le-item children', async () => {
    const page = await newSpecPage({
      components: [LeSegmentedControl, LeItem, LeTab],
      html: `<le-segmented-control value="two">
        <le-item value="one">One</le-item>
        <le-item value="two">Two</le-item>
      </le-segmented-control>`,
    });

    const segments = page.root?.shadowRoot?.querySelectorAll('le-tab.segment');
    expect(segments?.length).toBe(2);
    const selectedTab = Array.from(segments || []).find((s: any) => s.selected);
    expect(selectedTab?.textContent?.trim()).toBe('Two');
  });

  it('updates selected segment when value prop changes', async () => {
    const page = await newSpecPage({
      components: [LeSegmentedControl, LeTab],
      html: `<le-segmented-control
        value="a"
        options='[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"}]'
      ></le-segmented-control>`,
    });

    const host = page.root as HTMLLeSegmentedControlElement;
    host.value = 'b';
    await page.waitForChanges();

    const segments = page.root?.shadowRoot?.querySelectorAll('le-tab.segment');
    expect((segments?.[1] as any)?.selected).toBe(true);
  });

  it('supports expression-style options string parsing fallback', async () => {
    const page = await newSpecPage({
      components: [LeSegmentedControl, LeTab],
      html: '<le-segmented-control value="2"></le-segmented-control>',
    });

    const host = page.root as HTMLLeSegmentedControlElement;
    host.options = "[{label:'One',value:'1'},{label:'Two',value:'2'}]";
    await page.waitForChanges();

    const segments = host.shadowRoot?.querySelectorAll('le-tab.segment');
    expect(segments?.length).toBe(2);
  });
});

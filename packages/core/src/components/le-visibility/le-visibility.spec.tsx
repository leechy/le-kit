import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { mockResizeObserver, type ResizeObserverHandle } from '../../utils/test-helpers';
import { LeVisibility } from './le-visibility';

let ro: ResizeObserverHandle;

beforeAll(() => {
  ro = mockResizeObserver();
});

describe('le-visibility', () => {
  it('caches the layout size reported by ResizeObserver, unaffected by ancestor transforms', async () => {
    const page = await newSpecPage({
      components: [LeVisibility],
      html: `<le-visibility><span>Label</span></le-visibility>`,
    });
    const el = page.root as HTMLElement;

    // A scaled ancestor would make getBoundingClientRect() report a different size
    el.getBoundingClientRect = () => ({ width: 60, height: 10 }) as DOMRect;

    ro.trigger(el, { width: 120, height: 20 });

    expect(el.style.getPropertyValue('--le-visibility-measured-width')).toBe('120px');
  });
});

import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-visibility e2e', () => {
  it('expands a target that started collapsed to its natural width', async () => {
    const page = await newE2EPage();
    // Two labels in a button: one shrinks while the other grows.
    await page.setContent(`
      <le-button style="--le-motion-visibility-duration: 400ms">
        <le-visibility state="visible">Show all 12 lines</le-visibility>
        <le-visibility state="collapsed">Show less</le-visibility>
      </le-button>`);

    await page.$$eval('le-button le-visibility', (els: any[]) => {
      els[0].state = 'collapsed';
      els[1].state = 'visible';
    });
    await new Promise(resolve => setTimeout(resolve, 200));
    const width = () => page.$eval('le-button le-visibility:last-child', el => el.getBoundingClientRect().width);
    const midway = await width();
    await new Promise(resolve => setTimeout(resolve, 400));
    const natural = await width();

    // It was never measured while visible; without measuring first it would
    // stay near zero and jump to its width at the end.
    expect(midway).toBeGreaterThan(natural * 0.2);
    expect(midway).toBeLessThan(natural);
  });
});

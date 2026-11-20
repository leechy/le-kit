import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-collapse e2e', () => {
  it('keeps wide content within its own width', async () => {
    const page = await newE2EPage();
    await page.setContent(`
      <div style="width: 200px">
        <le-collapse><pre style="margin: 0; overflow-x: auto">${'x'.repeat(200)}</pre></le-collapse>
      </div>`);
    const widths = await page.$eval('le-collapse', el => [
      Math.round(el.getBoundingClientRect().width),
      Math.round(el.querySelector('pre')!.getBoundingClientRect().width),
    ]);
    // The pre scrolls inside instead of stretching the collapse.
    expect(widths).toEqual([200, 200]);
  });
});

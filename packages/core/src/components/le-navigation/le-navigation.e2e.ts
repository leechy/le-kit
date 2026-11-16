import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-navigation selected item', () => {
  it('keeps the selected colors while hovered (vertical)', async () => {
    const page = await newE2EPage();
    await page.setContent(`
      <le-navigation orientation="vertical" active-url="#b">
        <le-item label="A" href="#a"></le-item>
        <le-item label="B" href="#b"></le-item>
      </le-navigation>
    `);
    await page.waitForChanges();

    const item = await page.find('le-navigation >>> .nav-node.selected > .nav-item');
    const read = () =>
      page.evaluate(() => {
        const el = document
          .querySelector('le-navigation')!
          .shadowRoot!.querySelector('.nav-node.selected > .nav-item')!;
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });

    const before = await read();
    await item.hover();
    await page.waitForChanges();
    const hovered = await read();

    expect(hovered).toEqual(before);
  });
});

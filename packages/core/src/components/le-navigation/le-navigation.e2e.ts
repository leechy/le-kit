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

describe('le-navigation icon sizing', () => {
  it('keeps the item height with icons and emoji, and draws icons 1.5× their base size', async () => {
    const page = await newE2EPage();
    await page.setContent(`
      <le-navigation orientation="vertical">
        <le-item label="Plain" href="#a"></le-item>
        <le-item label="Icon" href="#b" icon-start="hamburger"></le-item>
        <le-item label="Emoji" href="#c" icon-start="&#x1F3E0;"></le-item>
      </le-navigation>
    `);
    await page.waitForChanges();

    const result = await page.evaluate(() => {
      const root = document.querySelector('le-navigation')!.shadowRoot!;
      const items = Array.from(root.querySelectorAll('.nav-item')) as HTMLElement[];
      const icon = root.querySelector('.nav-icon le-icon') as HTMLElement | null;
      return {
        heights: items.map(i => Math.round(i.getBoundingClientRect().height)),
        iconWidth: icon ? Math.round(icon.getBoundingClientRect().width) : -1,
      };
    });

    expect(result.heights[1]).toBe(result.heights[0]);
    expect(result.heights[2]).toBe(result.heights[0]);
    expect(result.iconWidth).toBe(24);
  });
});

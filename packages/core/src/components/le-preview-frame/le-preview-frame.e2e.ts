import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

type Page = Awaited<ReturnType<typeof newE2EPage>>;

/** Drags the frame's right resize handle horizontally by `dx` px; returns the frame width before and after. */
async function dragRightHandle(page: Page, dx: number) {
  const box = await page.evaluate(() => {
    const host = document.querySelector('le-preview-frame')!;
    const frame = host.shadowRoot!.querySelector('.frame') as HTMLElement;
    const handles = Array.from(host.shadowRoot!.querySelectorAll('le-drag-handle')) as HTMLElement[];
    const right = handles
      .map(h => h.getBoundingClientRect())
      .sort((a, b) => b.left - a.left)[0];
    return {
      width: frame.getBoundingClientRect().width,
      x: right.left + right.width / 2,
      y: right.top + right.height / 2,
    };
  });

  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x + dx / 2, box.y, { steps: 4 });
  await page.mouse.move(box.x + dx, box.y, { steps: 4 });
  await page.mouse.up();
  await page.waitForChanges();

  const after = await page.evaluate(
    () => document.querySelector('le-preview-frame')!.shadowRoot!.querySelector('.frame')!.getBoundingClientRect().width,
  );
  return { before: Math.round(box.width), after: Math.round(after) };
}

const FRAME = `<le-preview-frame handles="left,right" show-controls="none"><div style="height: 80px">Content</div></le-preview-frame>`;

describe('le-preview-frame resize origin', () => {
  it('follows the cursor 1:1 on the first drag when it fills a block parent (left-aligned)', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 900, height: 400 });
    await page.setContent(`<style>body { margin: 0 }</style><div style="width: 800px">${FRAME}</div>`);
    await page.waitForChanges();

    const { before, after } = await dragRightHandle(page, -100);

    expect(before - after).toBeGreaterThanOrEqual(85);
    expect(before - after).toBeLessThanOrEqual(115);
  });

  it('treats a parent padding as content edges, not as centering gaps', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 900, height: 400 });
    await page.setContent(
      `<style>body { margin: 0 }</style><div style="width: 800px; padding: 0 16px; box-sizing: border-box">${FRAME}</div>`,
    );
    await page.waitForChanges();

    const { before, after } = await dragRightHandle(page, -100);

    expect(before - after).toBeGreaterThanOrEqual(85);
    expect(before - after).toBeLessThanOrEqual(115);
  });

  it('resizes from the center when a flex parent centers it', async () => {
    const page = await newE2EPage();
    await page.setViewport({ width: 900, height: 400 });
    await page.setContent(
      `<style>body { margin: 0 }</style><div style="width: 800px; display: flex; justify-content: center">${FRAME}</div>`,
    );
    await page.waitForChanges();

    const { before, after } = await dragRightHandle(page, -50);

    expect(before - after).toBeGreaterThanOrEqual(85);
    expect(before - after).toBeLessThanOrEqual(115);
  });
});

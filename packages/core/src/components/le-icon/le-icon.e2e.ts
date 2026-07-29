import { describe, it, expect } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-icon e2e', () => {
  it('renders base notifications icon from built assets', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications"></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    expect(paths.length).toBeGreaterThan(0);

    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('stroke-width')).toBe('1.25');
  });

  it('renders rounded variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" rounded></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    const d = await bodyPath.getAttribute('d');
    expect(d).toContain('M5.067,5.019');
  });

  it('renders filled variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" filled></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('fill')).toBe('currentColor');
  });

  it('renders thin variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" thin></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('stroke-width')).toBe('0.75');
  });

  it('renders rounded filled variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" rounded filled></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('fill')).toBe('currentColor');
    const d = await bodyPath.getAttribute('d');
    expect(d).toContain('M5.0668879,5.01907084');
  });

  it('renders thin filled variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" thin filled></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('fill')).toBe('currentColor');
  });

  it('renders thin rounded filled variant for notifications icon', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" thin rounded filled></le-icon>' });
    await page.waitForChanges();

    const paths = await page.findAll('le-icon >>> path');
    const bodyPath = paths[paths.length - 1];
    expect(await bodyPath.getAttribute('fill')).toBe('currentColor');
    const d = await bodyPath.getAttribute('d');
    expect(d).toContain('M5.0668879,5.01907084');
  });

  it('renders folder icon with variant flags', async () => {
    const page = await newE2EPage({ html: '<le-icon name="folder" rounded filled></le-icon>' });
    await page.waitForChanges();

    const svg = await page.find('le-icon >>> svg');
    expect(svg).not.toBeNull();
  });

  it('renders numeric count notification badge', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" count="17"></le-icon>' });
    await page.waitForChanges();

    const textEl = await page.find('le-icon >>> text');
    expect(textEl).not.toBeNull();
    expect(textEl.textContent).toBe('17');
  });

  it('formats max-count threshold for count notification badge (e.g. 99+)', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" count="128" max-count="99"></le-icon>' });
    await page.waitForChanges();

    const textEl = await page.find('le-icon >>> text');
    expect(textEl).not.toBeNull();
    expect(textEl.textContent).toBe('99+');
  });

  it('renders badge-text notification badge', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" badge-text="HOT"></le-icon>' });
    await page.waitForChanges();

    const textEl = await page.find('le-icon >>> text');
    expect(textEl).not.toBeNull();
    expect(textEl.textContent).toBe('HOT');
  });

  it('renders empty circle dot badge when dot attribute is set', async () => {
    const page = await newE2EPage({ html: '<le-icon name="notifications" dot></le-icon>' });
    await page.waitForChanges();

    const rects = await page.findAll('le-icon >>> rect');
    expect(rects.length).toBeGreaterThan(0);

    const textEl = await page.find('le-icon >>> text');
    expect(textEl).toBeNull();
  });

  it('applies custom badge-color and badge-text-color', async () => {
    const page = await newE2EPage({
      html: '<le-icon name="notifications" count="3" badge-color="#ef4444" badge-text-color="#ffffff"></le-icon>',
    });
    await page.waitForChanges();

    const bgRect = await page.find('le-icon >>> rect[fill="#ef4444"]');
    expect(bgRect).not.toBeNull();

    const textEl = await page.find('le-icon >>> text');
    expect(await textEl.getAttribute('fill')).toBe('#ffffff');
  });

  it('renders action badge overlay layer when badge prop is set', async () => {
    const page = await newE2EPage({ html: '<le-icon name="folder" badge="file"></le-icon>' });
    await page.waitForChanges();

    const svg = await page.find('le-icon >>> svg');
    expect(svg).not.toBeNull();
  });
});

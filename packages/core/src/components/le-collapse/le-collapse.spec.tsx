import { newSpecPage } from '@stencil/core/testing';
import { LeCollapse } from './le-collapse';

describe('le-collapse', () => {
  it('should be open and expanded by default', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse><div>Content</div></le-collapse>`,
    });

    expect(page.root!.getAttribute('data-open')).toBe('true');
    expect(page.root!.getAttribute('data-expanded')).toBe('true');
  });

  it('should be closed and not expanded when closed prop is true', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed><div>Content</div></le-collapse>`,
    });

    expect(page.root!.getAttribute('data-open')).toBe('false');
    expect(page.root!.getAttribute('data-expanded')).toBe('false');
  });

  it('should update data-expanded on transitionend after opening', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed><div>Content</div></le-collapse>`,
    });

    page.root!.setAttribute('closed', 'false');
    (page.root as any).closed = false;
    await page.waitForChanges();

    // Trigger transitionend for grid-template-rows
    const event = new Event('transitionend');
    Object.defineProperty(event, 'propertyName', { value: 'grid-template-rows' });
    Object.defineProperty(event, 'target', { value: page.root });
    page.root!.dispatchEvent(event);
    await page.waitForChanges();

    expect(page.root!.getAttribute('data-open')).toBe('true');
    expect(page.root!.getAttribute('data-expanded')).toBe('true');
  });
});

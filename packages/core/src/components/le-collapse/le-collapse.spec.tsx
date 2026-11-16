import { newSpecPage } from '@stencil/core/testing';
import { LeCollapse } from './le-collapse';
import { forgetState, publishState } from '../../utils/state-bus';

describe('le-collapse', () => {
  it('should be open and expanded by default', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse><div>Content</div></le-collapse>`,
    });

    expect(page.root!.getAttribute('data-open')).toBe('true');
    expect(page.root!.getAttribute('data-expanded')).toBe('true');
  });

  it('should test le-collapse with closed=false prop', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<div></div>`,
    });

    const collapse = page.doc.createElement('le-collapse') as any;
    collapse.closed = false;
    page.body.appendChild(collapse);
    await page.waitForChanges();

    expect(collapse.getAttribute('data-open')).toBe('true');
    expect(collapse.getAttribute('data-expanded')).toBe('true');
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

describe('le-collapse closed-when', () => {
  const PANEL = 'le-side-panel:state';

  /** Publishes a state on the bus from a fresh source element in the page. */
  function publish(page: { body: HTMLElement; doc: Document }, event: string, key: string, state: unknown) {
    const source = page.doc.createElement('div');
    page.body.appendChild(source);
    publishState(source, event, key, state as any);
  }

  afterEach(() => {
    forgetState(PANEL, 'recipes');
    forgetState(PANEL, 'other');
    forgetState('le-header:state', 'top');
  });

  it('reads the current state when it loads after the state was published', async () => {
    const page = await newSpecPage({ components: [LeCollapse], html: `<div></div>` });
    publish(page, PANEL, 'recipes', { visible: true });

    const collapse = page.doc.createElement('le-collapse');
    collapse.setAttribute('closed-when', `${PANEL}.visible`);
    collapse.setAttribute('closed-when-target', 'recipes');
    page.body.appendChild(collapse);
    await page.waitForChanges();

    expect(collapse.getAttribute('data-open')).toBe('false');
  });

  it('opens and closes as the state changes', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed-when="${PANEL}.visible" closed-when-target="recipes"></le-collapse>`,
    });
    expect(page.root!.getAttribute('data-open')).toBe('true');

    publish(page, PANEL, 'recipes', { visible: true });
    await page.waitForChanges();
    expect(page.root!.getAttribute('data-open')).toBe('false');

    publish(page, PANEL, 'recipes', { visible: false });
    await page.waitForChanges();
    expect(page.root!.getAttribute('data-open')).toBe('true');
  });

  it('ignores states of other sources when a target is set', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed-when="${PANEL}.visible" closed-when-target="recipes"></le-collapse>`,
    });

    publish(page, PANEL, 'other', { visible: true });
    await page.waitForChanges();

    expect(page.root!.getAttribute('data-open')).toBe('true');
  });

  it('follows any source when no target is set (e.g. the only header)', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed-when="le-header:state.shrunk"></le-collapse>`,
    });

    publish(page, 'le-header:state', 'top', { shrunk: true, visible: true });
    await page.waitForChanges();

    expect(page.root!.getAttribute('data-open')).toBe('false');
  });

  it('stays closed while the closed prop is set, whatever the bound state says', async () => {
    const page = await newSpecPage({
      components: [LeCollapse],
      html: `<le-collapse closed closed-when="${PANEL}.visible" closed-when-target="recipes"></le-collapse>`,
    });

    publish(page, PANEL, 'recipes', { visible: false });
    await page.waitForChanges();

    expect(page.root!.getAttribute('data-open')).toBe('false');
  });
});

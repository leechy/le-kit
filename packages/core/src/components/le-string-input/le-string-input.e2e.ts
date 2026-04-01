import { newE2EPage } from '@stencil/core/testing';

describe('le-string-input e2e', () => {
  it('emits leInput on every keystroke', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-string-input name="title"></le-string-input>');

    const leInput = await page.spyOnEvent('leInput');

    const input = await page.find('le-string-input >>> input');
    await input.type('Hi');

    expect(leInput).toHaveReceivedEventTimes(2);
  });

  it('emits leChange on blur after typing', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<le-string-input name="title"></le-string-input><button id="other">Other</button>',
    );

    const leChange = await page.spyOnEvent('leChange');

    const input = await page.find('le-string-input >>> input');
    await input.type('Hello');
    // Tab away to trigger a real browser blur → native change event
    await input.press('Tab');

    expect(leChange).toHaveReceivedEventTimes(1);
    expect(leChange).toHaveReceivedEventDetail({ value: 'Hello', name: 'title' });
  });

  it('emits leChange when Enter is pressed in headless Chromium', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-string-input name="email"></le-string-input>');

    const leChange = await page.spyOnEvent('leChange');

    const input = await page.find('le-string-input >>> input');
    await input.type('user@example.com');
    // In headless Chromium, Enter on a text input fires native `change`
    await input.press('Enter');

    expect(leChange).toHaveReceivedEventTimes(1);
    expect(leChange).toHaveReceivedEventDetail({ value: 'user@example.com', name: 'email' });
  });

  it('is focusable via Tab', async () => {
    const page = await newE2EPage();
    await page.setContent(
      '<button id="before">Before</button><le-string-input name="title"></le-string-input>',
    );

    await page.focus('#before');
    await page.keyboard.press('Tab');

    const activeTag = await page.evaluate(
      () => (document.activeElement?.shadowRoot?.activeElement ?? document.activeElement)?.tagName.toLowerCase(),
    );
    expect(activeTag).toBe('input');
  });

  it('input is disabled when disabled prop is set', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-string-input disabled name="title"></le-string-input>');

    const input = await page.find('le-string-input >>> input');
    expect(await input.getProperty('disabled')).toBe(true);
  });

  it('input is readonly when readonly prop is set', async () => {
    const page = await newE2EPage();
    await page.setContent('<le-string-input readonly name="title" value="fixed"></le-string-input>');

    const input = await page.find('le-string-input >>> input');
    expect(await input.getProperty('readOnly')).toBe(true);
  });
});

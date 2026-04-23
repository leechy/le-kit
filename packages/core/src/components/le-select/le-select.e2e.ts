import { describe, it } from '@jest/globals';
import { newE2EPage } from '@stencil/core/testing';

describe('le-select e2e', () => {
  const OPTIONS =
    '[{"label":"Alpha","value":"a"},{"label":"Beta","value":"b"},{"label":"Gamma","value":"g"}]';

  it('opens with keyboard (ArrowDown) and closes with Escape', async () => {
    const page = await newE2EPage();
    await page.setContent(`<le-select options='${OPTIONS}'></le-select>`);

    const leOpen = await page.spyOnEvent('leOpen');
    const leClose = await page.spyOnEvent('leClose');

    const trigger = await page.find('le-select >>> le-button >>> button.le-button-container');
    await trigger.focus();
    await trigger.press('ArrowDown');
    await page.waitForChanges();

    const select = await page.find('le-select');
    expect(await select.getProperty('open')).toBe(true);
    expect(leOpen).toHaveReceivedEventTimes(1);

    await page.keyboard.press('Escape');
    await page.waitForChanges();

    expect(await select.getProperty('open')).toBe(false);
    expect(leClose).toHaveReceivedEventTimes(1);
  });

  it('supports End/Home/ArrowUp keyboard navigation and Enter selection', async () => {
    const page = await newE2EPage();
    await page.setContent(`<le-select value="b" options='${OPTIONS}'></le-select>`);

    const leChange = await page.spyOnEvent('leChange');

    const trigger = await page.find('le-select >>> le-button >>> button.le-button-container');
    await trigger.focus();

    await trigger.press('ArrowDown');
    await page.waitForChanges();

    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.waitForChanges();

    expect(leChange).toHaveReceivedEventTimes(1);
    expect(leChange).toHaveReceivedEventDetail({
      value: 'g',
      option: { label: 'Gamma', value: 'g' },
    });

    await trigger.press('ArrowDown');
    await page.waitForChanges();

    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await page.waitForChanges();

    expect(leChange).toHaveReceivedEventTimes(2);
    expect(leChange).toHaveReceivedEventDetail({
      value: 'a',
      option: { label: 'Alpha', value: 'a' },
    });

    await trigger.press('ArrowDown');
    await page.waitForChanges();

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForChanges();

    expect(leChange).toHaveReceivedEventTimes(3);
    expect(leChange).toHaveReceivedEventDetail({
      value: 'g',
      option: { label: 'Gamma', value: 'g' },
    });
  });

  it('opens and closes through public methods (popover integration)', async () => {
    const page = await newE2EPage();
    await page.setContent(`<le-select options='${OPTIONS}'></le-select>`);

    const leOpen = await page.spyOnEvent('leOpen');
    const leClose = await page.spyOnEvent('leClose');

    await page.evaluate(async () => {
      const el = document.querySelector('le-select') as HTMLLeSelectElement;
      await el.showDropdown();
    });
    await page.waitForChanges();

    const select = await page.find('le-select');
    expect(await select.getProperty('open')).toBe(true);
    expect(leOpen).toHaveReceivedEventTimes(1);

    await page.evaluate(async () => {
      const el = document.querySelector('le-select') as HTMLLeSelectElement;
      await el.hideDropdown();
    });
    await page.waitForChanges();

    expect(await select.getProperty('open')).toBe(false);
    expect(leClose).toHaveReceivedEventTimes(1);
  });

  it('does not open when disabled', async () => {
    const page = await newE2EPage();
    await page.setContent(`<le-select disabled options='${OPTIONS}'></le-select>`);

    const leOpen = await page.spyOnEvent('leOpen');

    const trigger = await page.find('le-select >>> le-button >>> button.le-button-container');
    expect(await trigger.getProperty('disabled')).toBe(true);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForChanges();

    const select = await page.find('le-select');
    expect(await select.getProperty('open')).toBe(false);
    expect(leOpen).toHaveReceivedEventTimes(0);
  });

  it('uses declarative le-item children as option source over options prop', async () => {
    const page = await newE2EPage();
    await page.setContent(`
      <le-select value="two" options='[{"label":"Prop Option","value":"prop"}]'>
        <le-item value="one">One</le-item>
        <le-item value="two">Two</le-item>
      </le-select>
    `);

    await page.waitForChanges();

    const label = await page.find('le-select >>> .trigger-label');
    expect(await label.innerText).toBe('Two');
  });
});

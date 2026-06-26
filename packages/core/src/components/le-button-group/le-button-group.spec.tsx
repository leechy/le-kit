import { beforeAll, describe, expect, it } from '@jest/globals';
import { newSpecPage } from '@stencil/core/testing';
import { captureEvent, eventDetail, mockMutationObserver } from '../../utils/test-helpers';
import { LeButtonGroup } from './le-button-group';
import { LeButton } from '../le-button/le-button';

beforeAll(() => {
  mockMutationObserver();
});

describe('le-button-group selection', () => {
  it('renders default child buttons without altering selection when type is undefined', async () => {
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group>
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
        </le-button-group>
      `,
    });

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');
    expect(buttons[0].selected).toBe(false);
    expect(buttons[1].selected).toBe(false);
  });

  it('sets initial radio selection based on group value', async () => {
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group type="radio" value="btn2">
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
        </le-button-group>
      `,
    });

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');
    expect(buttons[0].selected).toBe(false);
    expect(buttons[1].selected).toBe(true);
  });

  it('changes selected button on click and emits leChange event in radio mode', async () => {
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group type="radio" value="btn1">
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
        </le-button-group>
      `,
    });

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');

    const changeSpy = captureEvent(host, 'leChange');

    // Click Button 2
    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    expect(buttons[0].selected).toBe(false);
    expect(buttons[1].selected).toBe(true);
    expect(host.value).toBe('btn2');

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(eventDetail(changeSpy)).toEqual({
      value: 'btn2',
      option: expect.objectContaining({
        value: 'btn2',
        label: 'Button 2',
      }),
    });
  });

  it('sets initial checkbox selections based on group value array', async () => {
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group type="checkbox" value='["btn1", "btn3"]'>
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
          <le-button value="btn3">Button 3</le-button>
        </le-button-group>
      `,
    });

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');
    expect(buttons[0].selected).toBe(true);
    expect(buttons[1].selected).toBe(false);
    expect(buttons[2].selected).toBe(true);
  });

  it('toggles checkbox selections and emits leChange with values and options', async () => {
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group type="checkbox" value='["btn1"]'>
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
        </le-button-group>
      `,
    });

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');

    const changeSpy = captureEvent(host, 'leChange');

    // Toggle Button 2 (should select)
    buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    expect(buttons[0].selected).toBe(true);
    expect(buttons[1].selected).toBe(true);
    expect(host.value).toEqual(['btn1', 'btn2']);

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(eventDetail(changeSpy)).toEqual({
      values: ['btn1', 'btn2'],
      options: [
        expect.objectContaining({ value: 'btn1' }),
        expect.objectContaining({ value: 'btn2' }),
      ],
    });

    // Toggle Button 1 (should deselect)
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await page.waitForChanges();

    expect(buttons[0].selected).toBe(false);
    expect(buttons[1].selected).toBe(true);
    expect(host.value).toEqual(['btn2']);
  });

  it('boosts priority for selected buttons during collapse', async () => {
    // We render a group with three buttons, and a collapse mode that shows only 1 button.
    // By default, without selection, the collapse logic shows button 1 (since index is lowest and priority equal).
    // If button 3 is selected, its priority gets boosted, and syncLayout should keep button 3 visible and collapse button 1 and 2.
    const page = await newSpecPage({
      components: [LeButtonGroup, LeButton],
      html: `
        <le-button-group type="radio" value="btn3" collapse="1">
          <le-button value="btn1">Button 1</le-button>
          <le-button value="btn2">Button 2</le-button>
          <le-button value="btn3">Button 3</le-button>
        </le-button-group>
      `,
    });

    // Make sure syncLayout has run
    await page.waitForChanges();

    const host = page.root as HTMLLeButtonGroupElement;
    const buttons = host.querySelectorAll('le-button');

    // Button 3 (value="btn3") should be visible
    expect(buttons[2].getAttribute('visibility')).toBe('visible');

    // Button 1 and 2 should be collapsed
    expect(buttons[0].getAttribute('visibility')).toBe('collapsed');
    expect(buttons[1].getAttribute('visibility')).toBe('collapsed');
  });
});

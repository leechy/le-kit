import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotLines } from './slot-lines.ts';

const sample = `<le-button variant="solid">
  <le-icon slot="icon-start" name="save"></le-icon>
  Save as
  <le-icon slot="icon-end" name="chevron-down"></le-icon>
</le-button>
<le-button variant="outlined" label="Copy">
  <le-icon slot="icon-only" name="copy"></le-icon>
</le-button>`;

test('lines with slot="…" belong to that slot', () => {
  const lines = slotLines(sample, 'le-button');
  assert.deepEqual(lines['icon-start'], [1]);
  assert.deepEqual(lines['icon-end'], [3]);
  assert.deepEqual(lines['icon-only'], [6]);
});

test('other lines inside the component belong to the default slot', () => {
  assert.deepEqual(slotLines(sample, 'le-button')[''], [2]);
});

test('the component tags themselves and blank lines belong to no slot', () => {
  const all = Object.values(slotLines(sample, 'le-button')).flat();
  for (const host of [0, 4, 5, 7]) assert.ok(!all.includes(host));
});

test('a component written on one line maps nothing', () => {
  assert.deepEqual(slotLines('<le-button>Save</le-button>', 'le-button'), {});
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssDefault, tokensIn } from './css-defaults.ts';

const css = `
/* comment with :host { --le-x: wrong; } */
:host {
  display: inline-flex;
  --le-button-radius: var(--le-radius-md);
  --le-button-gap: var(--le-control-icon-gap, var(--le-spacing-1));
}

:host([size='small']) {
  --le-button-radius: 2px;
}

.container {
  padding: var(
    --le-button-padding,
    var(--le-button-padding-y) var(--_end)
  );
  color: var(--le-motion-view-duration);
}
`;

test('declared in :host', () => {
  assert.deepEqual(cssDefault(css, '--le-button-radius'), { kind: 'declared', value: 'var(--le-radius-md)' });
  assert.deepEqual(cssDefault(css, '--le-button-gap'), {
    kind: 'declared',
    value: 'var(--le-control-icon-gap, var(--le-spacing-1))',
  });
});

test('not declared, used with a fallback', () => {
  assert.deepEqual(cssDefault(css, '--le-button-padding'), {
    kind: 'fallback',
    value: 'var(--le-button-padding-y) var(--_end)',
  });
});

test('not declared, used without a fallback: comes from outside', () => {
  assert.deepEqual(cssDefault(css, '--le-motion-view-duration'), { kind: 'inherited' });
});

test('never used', () => {
  assert.deepEqual(cssDefault(css, '--le-button-bg'), { kind: 'unused' });
});

test('comments are ignored', () => {
  assert.deepEqual(cssDefault(css, '--le-x'), { kind: 'unused' });
});

test('tokensIn lists var() names in order, without duplicates', () => {
  assert.deepEqual(tokensIn('var(--le-control-icon-gap, var(--le-spacing-1))'), [
    '--le-control-icon-gap',
    '--le-spacing-1',
  ]);
  assert.deepEqual(tokensIn('calc(var(--a) - var(--a))'), ['--a']);
  assert.deepEqual(tokensIn('2px'), []);
});

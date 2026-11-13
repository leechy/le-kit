import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, hashForTab, hashForRecipe } from './page-hash.ts';

test('hashForRecipe', () => {
  assert.equal(hashForRecipe('default', true), '');
  assert.equal(hashForRecipe('with-icon', false), '#recipe-with-icon');
});

test('empty hash is none', () => {
  assert.deepEqual(parseHash(''), { kind: 'none' });
  assert.deepEqual(parseHash('#'), { kind: 'none' });
});

test('tab names select tabs', () => {
  assert.deepEqual(parseHash('#api'), { kind: 'tab', tab: 'api' });
  assert.deepEqual(parseHash('#roadmap'), { kind: 'tab', tab: 'roadmap' });
  assert.deepEqual(parseHash('#playground'), { kind: 'tab', tab: 'playground' });
});

test('recipe hash selects a recipe', () => {
  assert.deepEqual(parseHash('#recipe-with-icon'), { kind: 'recipe', id: 'with-icon' });
  assert.deepEqual(parseHash('#recipe-'), { kind: 'none' });
});

test('other hashes are anchors, decoded', () => {
  assert.deepEqual(parseHash('#@variant'), { kind: 'anchor', id: '@variant' });
  assert.deepEqual(parseHash('#%40variant'), { kind: 'anchor', id: '@variant' });
  assert.deepEqual(parseHash('#usage'), { kind: 'anchor', id: 'usage' });
});

test('malformed encoding is none', () => {
  assert.deepEqual(parseHash('#%E0%A4%A'), { kind: 'none' });
});

test('hashForTab', () => {
  assert.equal(hashForTab('playground'), '');
  assert.equal(hashForTab('api'), '#api');
  assert.equal(hashForTab('roadmap'), '#roadmap');
});

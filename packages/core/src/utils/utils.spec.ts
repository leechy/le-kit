import { generateId, parseCommaSeparated } from './utils';

describe('generateId', () => {
  it('generates unique IDs with default prefix', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toMatch(/^le-[a-z0-9]+$/);
    expect(id2).toMatch(/^le-[a-z0-9]+$/);
    expect(id1).not.toEqual(id2);
  });

  it('uses custom prefix', () => {
    const id = generateId('custom');
    expect(id).toMatch(/^custom-[a-z0-9]+$/);
  });
});

describe('parseCommaSeparated', () => {
  it('returns empty array for undefined', () => {
    expect(parseCommaSeparated(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseCommaSeparated('')).toEqual([]);
  });

  it('parses single value', () => {
    expect(parseCommaSeparated('one')).toEqual(['one']);
  });

  it('parses multiple values and trims whitespace', () => {
    expect(parseCommaSeparated('one, two , three')).toEqual(['one', 'two', 'three']);
  });

  it('filters empty values', () => {
    expect(parseCommaSeparated('one,,two')).toEqual(['one', 'two']);
  });
});

import {
  getAllLatestStates,
  getBusTarget,
  getLatestState,
  publishState,
  subscribeState,
} from './state-bus';

const EVENT = 'test:state';
const OTHER_EVENT = 'test:other-state';

function mount(html: string) {
  document.body.innerHTML = html;
}

describe('state bus', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('remembers the latest state per event and key', () => {
    mount('<div id="a"></div>');
    const source = document.getElementById('a')!;

    publishState(source, EVENT, 'one', { visible: false });
    publishState(source, EVENT, 'one', { visible: true });

    expect(getLatestState(EVENT, 'one')).toEqual({ visible: true });
  });

  it('keeps events apart even with the same key', () => {
    mount('<div id="a"></div>');
    const source = document.getElementById('a')!;

    publishState(source, EVENT, 'same', { value: 1 });
    publishState(source, OTHER_EVENT, 'same', { value: 2 });

    expect(getLatestState(EVENT, 'same')).toEqual({ value: 1 });
    expect(getLatestState(OTHER_EVENT, 'same')).toEqual({ value: 2 });
  });

  it('forgets a key when the state is published as undefined', () => {
    mount('<div id="a"></div>');
    const source = document.getElementById('a')!;

    publishState(source, EVENT, 'gone', { value: 1 });
    publishState(source, EVENT, 'gone', undefined);

    expect(getLatestState(EVENT, 'gone')).toBeUndefined();
  });

  it('lists all latest states of an event', () => {
    mount('<div id="a"></div>');
    const source = document.getElementById('a')!;

    publishState(source, 'test:list', 'x', { id: 'x' });
    publishState(source, 'test:list', 'y', { id: 'y' });

    expect(getAllLatestStates('test:list')).toEqual([{ id: 'x' }, { id: 'y' }]);
  });

  it('uses the closest le-kit as the bus, document otherwise', () => {
    mount('<le-kit><div id="inside"></div></le-kit><div id="outside"></div>');

    expect(getBusTarget(document.getElementById('inside')!)).toBe(document.querySelector('le-kit'));
    expect(getBusTarget(document.getElementById('outside')!)).toBe(document);
  });

  it('delivers published states to subscribers in the same scope', () => {
    mount('<div id="source"></div><div id="listener"></div>');
    const received: unknown[] = [];

    const unsubscribe = subscribeState(document.getElementById('listener'), EVENT, (detail, key) =>
      received.push({ detail, key }),
    );
    publishState(document.getElementById('source')!, EVENT, 'k', { visible: true });
    unsubscribe();
    publishState(document.getElementById('source')!, EVENT, 'k', { visible: false });

    expect(received).toEqual([{ detail: { visible: true }, key: 'k' }]);
  });

  it('does not deliver states across separate le-kit scopes', () => {
    mount('<le-kit id="a"><div id="source"></div></le-kit><le-kit id="b"><div id="listener"></div></le-kit>');
    const received: unknown[] = [];

    subscribeState(document.getElementById('listener'), EVENT, detail => received.push(detail));
    publishState(document.getElementById('source')!, EVENT, 'k', { visible: true });

    expect(received).toEqual([]);
  });

  it('delivers from inside a le-kit to a document-level subscriber', () => {
    mount('<le-kit><div id="source"></div></le-kit><div id="listener"></div>');
    const received: unknown[] = [];

    subscribeState(document.getElementById('listener'), EVENT, detail => received.push(detail));
    publishState(document.getElementById('source')!, EVENT, 'k', { visible: true });

    expect(received).toEqual([{ visible: true }]);
  });
});

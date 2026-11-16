/**
 * State bus: how components tell each other about their state without
 * knowing about each other (a list and the buttons bound to it, a side panel
 * and the collapse that shows a replacement when it is hidden, …).
 *
 * - Events travel through the closest <le-kit>, or the document when there is
 *   none. <le-kit> only scopes them; nothing here requires it.
 * - The latest state of every (event, key) pair is remembered at module level,
 *   so a component that loads later can read the current state right away
 *   instead of waiting for the next change. Components load asynchronously, so
 *   without this a listener can easily miss the only event it needed.
 */

/** The closest <le-kit> around `el`, or the document. */
export function getBusTarget(el?: HTMLElement): EventTarget | null {
  if (typeof document === 'undefined') return null;
  const kit = el?.closest('le-kit');
  return kit ?? document;
}

const latestStates = new Map<string, Map<string, unknown>>();

function statesOf(event: string): Map<string, unknown> {
  let states = latestStates.get(event);
  if (!states) {
    states = new Map();
    latestStates.set(event, states);
  }
  return states;
}

/** The most recent state published for `event` under `key`. */
export function getLatestState<T>(event: string, key: string): T | undefined {
  return latestStates.get(event)?.get(key) as T | undefined;
}

/** Forgets the remembered state of (`event`, `key`) without notifying anyone. */
export function forgetState(event: string, key: string): void {
  latestStates.get(event)?.delete(key);
}

/** All currently known states of `event`, in publishing order. */
export function getAllLatestStates<T>(event: string): T[] {
  return Array.from(latestStates.get(event)?.values() ?? []) as T[];
}

/**
 * Remembers `state` as the latest for (`event`, `key`) and dispatches it on the bus.
 * Publishing `undefined` forgets the key (e.g. the source is gone) and still
 * notifies subscribers, with `undefined` as the state.
 */
export function publishState<T>(source: HTMLElement, event: string, key: string, state: T | undefined): void {
  const states = statesOf(event);
  if (state === undefined) {
    states.delete(key);
  } else {
    states.set(key, state);
  }
  dispatchBusEvent(source, event, { key, state });
}

/**
 * Like `publishState`, but skips the publish when `state` has the same flat
 * fields as the remembered one — for components that publish after every render.
 */
export function publishStateIfChanged<T extends Record<string, unknown>>(
  source: HTMLElement,
  event: string,
  key: string,
  state: T,
): void {
  const previous = getLatestState<T>(event, key);
  if (previous && sameFlatFields(previous, state)) return;
  publishState(source, event, key, state);
}

function sameFlatFields(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(k => Object.is(a[k], b[k]));
}

/**
 * Subscribes to state changes of `event` in the scope of `el`.
 * The listener gets the state and its key. Returns an unsubscribe function.
 */
export function subscribeState<T>(
  el: HTMLElement | null | undefined,
  event: string,
  listener: (state: T | undefined, key: string) => void,
): () => void {
  return subscribeBusEvent<{ key: string; state: T | undefined }>(el, event, detail =>
    listener(detail.state, detail.key),
  );
}

/** Dispatches a one-off (not remembered) event on the bus, e.g. a request. */
export function dispatchBusEvent<T>(source: HTMLElement, event: string, detail: T): void {
  const target = getBusTarget(source);
  if (!target) return;
  target.dispatchEvent(new CustomEvent<T>(event, { detail, bubbles: true, composed: true }));
}

/** Subscribes to a bus event in the scope of `el`. Returns an unsubscribe function. */
export function subscribeBusEvent<T>(
  el: HTMLElement | null | undefined,
  event: string,
  listener: (detail: T) => void,
): () => void {
  const target = getBusTarget(el ?? undefined);
  if (!target) return () => {};

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<T>).detail;
    if (detail !== undefined && detail !== null) listener(detail);
  };

  target.addEventListener(event, handler);
  return () => target.removeEventListener(event, handler);
}

/** Parses a comma- or whitespace-separated list of ids into a normalized array. */
export function parseIds(value?: string): string[] {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

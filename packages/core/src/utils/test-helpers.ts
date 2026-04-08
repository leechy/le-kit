import { jest } from '@jest/globals';

// ─── Observer mocks ───────────────────────────────────────────────────────────

/**
 * Installs a no-op MutationObserver mock on globalThis.
 * Required by components that call observeNamedSlotPresence() or
 * observeModeChanges() during lifecycle hooks, because the Jest/jsdom
 * environment used by Stencil spec tests does not provide MutationObserver.
 *
 * Call this once in a beforeAll() block for any spec that registers slot or
 * mode observers.
 */
export function mockMutationObserver(): void {
  (globalThis as any).MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(),
  }));
}

/**
 * Installs a controllable ResizeObserver mock on globalThis.
 * Returns a handle that lets you fire synthetic resize entries for a specific
 * element, making ResizeObserver-driven re-renders deterministic inside spec
 * tests.
 *
 * Usage:
 *   const ro = mockResizeObserver();
 *   // ... render a page ...
 *   ro.trigger(host, { width: 300, height: 100 });
 *   await page.waitForChanges();
 */
export function mockResizeObserver(): ResizeObserverHandle {
  const callbacks = new Map<Element, ResizeObserverCallback>();

  (globalThis as any).ResizeObserver = jest.fn().mockImplementation((cb: unknown) => ({
    observe: jest.fn((el: Element) => {
      callbacks.set(el, cb as ResizeObserverCallback);
    }),
    unobserve: jest.fn((el: Element) => {
      callbacks.delete(el);
    }),
    disconnect: jest.fn(() => {
      callbacks.clear();
    }),
  }));

  return {
    trigger(el: Element, size: { width: number; height: number }) {
      const cb = callbacks.get(el);
      if (!cb) return;
      const entry = {
        target: el,
        contentRect: {
          width: size.width,
          height: size.height,
          top: 0,
          left: 0,
          right: size.width,
          bottom: size.height,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [{ inlineSize: size.width, blockSize: size.height }],
        contentBoxSize: [{ inlineSize: size.width, blockSize: size.height }],
        devicePixelContentBoxSize: [],
      } as unknown as ResizeObserverEntry;
      cb([entry], (globalThis as any).ResizeObserver.mock.instances[0]);
    },
  };
}

export interface ResizeObserverHandle {
  /** Fires a synthetic resize entry for the given element. */
  trigger(el: Element, size: { width: number; height: number }): void;
}

// ─── Shadow DOM helpers ───────────────────────────────────────────────────────

/**
 * Queries the shadow root of a host element and asserts the result is
 * non-null, throwing a descriptive error if the selector matches nothing.
 */
export function shadowQuery<T extends Element = Element>(host: Element, selector: string): T {
  const el = host.shadowRoot?.querySelector<T>(selector);
  if (!el) throw new Error(`shadowQuery: no match for "${selector}" in ${host.tagName}`);
  return el;
}

/** Queries all matching elements inside the shadow root. */
export function shadowQueryAll<T extends Element = Element>(host: Element, selector: string): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}

// ─── Event capture ────────────────────────────────────────────────────────────

/**
 * Attaches a jest spy to an event on a host element and returns it.
 * Call `eventDetail(spy)` afterwards to read the first emitted CustomEvent
 * payload without the `unknown` cast boilerplate.
 *
 * Usage:
 *   const spy = captureEvent(host, 'leChange');
 *   input.dispatchEvent(new Event('change'));
 *   await page.waitForChanges();
 *   expect(eventDetail(spy)).toEqual({ value: 'x', name: 'field' });
 */
export function captureEvent(host: Element, eventName: string): ReturnType<typeof jest.fn> {
  const spy = jest.fn();
  host.addEventListener(eventName, spy);
  return spy;
}

/**
 * Extracts the `detail` from the first call of an event spy created by
 * captureEvent(). Casts through CustomEvent so callers don't need to.
 */
export function eventDetail<T = unknown>(spy: ReturnType<typeof jest.fn>, callIndex = 0): T {
  const event = spy.mock.calls[callIndex][0] as CustomEvent<T>;
  return event.detail;
}

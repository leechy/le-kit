/**
 * Utility functions for le-kit components
 */

import { getMode } from '../global/app';

/**
 * Generates a unique ID for component instances
 */
export function generateId(prefix: string = 'le'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parses a comma-separated string into an array
 */
export function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Checks if a slot has content
 */
export function slotHasContent(el: HTMLElement, slotName: string = ''): boolean {
  const selector = slotName ? `[slot="${slotName}"]` : ':not([slot])';
  return el.querySelector(selector) !== null;
}

/**
 * Sets up a MutationObserver to track mode changes on ancestor elements.
 * Returns a cleanup function to disconnect the observer.
 * 
 * If the element or any ancestor has an explicit `mode` attribute, that creates
 * a "mode boundary" - the mode is determined from that point, not from further up.
 * This allows components like le-popover to force default mode for their children.
 * 
 * @param el - The component's host element
 * @param callback - Function to call when mode changes, receives the new mode
 * @returns Cleanup function to disconnect the observer
 * 
 * @example
 * ```tsx
 * export class MyComponent {
 *   @Element() el: HTMLElement;
 *   @State() adminMode: boolean = false;
 *   private disconnectModeObserver?: () => void;
 * 
 *   connectedCallback() {
 *     this.disconnectModeObserver = observeModeChanges(this.el, (mode) => {
 *       this.adminMode = mode === 'admin';
 *     });
 *   }
 * 
 *   disconnectedCallback() {
 *     this.disconnectModeObserver?.();
 *   }
 * }
 * ```
 */
export function observeModeChanges(
  el: HTMLElement,
  callback: (mode: string) => void
): () => void {
  // Call immediately with current mode
  callback(getMode(el));

  // Set up observer for mode attribute changes
  const observer = new MutationObserver(() => {
    callback(getMode(el));
  });

  // Observe the element itself (for mode boundary changes)
  observer.observe(el, {
    attributes: true,
    attributeFilter: ['mode'],
  });

  // Observe document root
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['mode'],
  });

  // Observe all parent elements up to (but stop at) a mode boundary
  let parent = el.parentElement;
  while (parent) {
    observer.observe(parent, {
      attributes: true,
      attributeFilter: ['mode'],
    });
    // If this parent has an explicit mode, it's a boundary - stop traversing
    // (we still need to observe it for changes, but not beyond)
    if (parent.hasAttribute('mode')) {
      break;
    }
    parent = parent.parentElement;
  }

  // Return cleanup function
  return () => observer.disconnect();
}

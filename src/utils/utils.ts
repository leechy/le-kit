/**
 * Utility functions for le-kit components
 */

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

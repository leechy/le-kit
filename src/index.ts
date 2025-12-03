/**
 * @fileoverview Entry point for le-kit component library
 *
 * This file exports utilities, types, and helper functions.
 * Components are auto-registered and available as custom elements.
 *
 * @see README.md for usage instructions
 */

// Utility exports
export { generateId, parseCommaSeparated, slotHasContent } from './utils/utils';

// Global mode helpers
export { getMode, setGlobalMode } from './global/app';
export type { LeKitMode } from './global/app';

// Type exports
export type * from './components.d.ts';

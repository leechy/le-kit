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

// Global mode and theme helpers
export { setAssetPath } from '@stencil/core';
export {
  getMode,
  setGlobalMode,
  getTheme,
  setGlobalTheme,
  configureLeKit,
  getLeKitConfig,
} from './global/app';
export type { LeKitMode, LeKitTheme } from './global/app';

// Popup/dialog programmatic API
export { leAlert, leConfirm, lePrompt } from './components/le-popup/le-popup.api';
export type { PopupOptions } from './components/le-popup/le-popup.api';
export type { PopupResult, PopupType, PopupPosition } from './components/le-popup/le-popup';

// Type exports
export type * from './components.d.ts';

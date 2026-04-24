/**
 * @fileoverview Entry point for le-kit component library
 *
 * This file exports utilities, types, and helper functions.
 * Components are auto-registered and available as custom elements.
 *
 * @see README.md for usage instructions
 */

// Utility exports
export {
  generateId,
  parseCommaSeparated,
  slotHasContent,
  getActiveContext,
  observeActiveContextChanges,
} from './utils/utils';

// Global mode and theme helpers
export { setAssetPath } from '@stencil/core';
export {
  getMode,
  setGlobalMode,
  getTheme,
  setGlobalTheme,
  configureLeKit,
  getLeKitConfig,
  getAssetBasePath,
} from './global/app';
export type { LeKitMode, LeKitTheme } from './global/app';

// Popup/dialog programmatic API
export { leAlert, leConfirm, lePrompt } from './components/le-popup/le-popup.api';
export type { PopupOptions } from './components/le-popup/le-popup.api';
export type { PopupResult, PopupType, PopupPosition } from './components/le-popup/le-popup';

// le-kit optional store APIs
export {
  createLeKitStore,
  defaultLeKitStore,
  defaultPersistKeys,
  parsePersistConfig,
} from './store/le-kit-store';
export type { LeKitStore, LeKitPersistConfig, LeKitPersistKey } from './store/le-kit-store';
export { atom } from 'nanostores';
export { persistentAtom } from '@nanostores/persistent';

// Type exports
export type * from './components.d.ts';

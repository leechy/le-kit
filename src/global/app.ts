import { setMode } from '@stencil/core';

export type LeKitMode = 'default' | 'admin' | string;
export type LeKitTheme = 'default' | 'dark' | string;

/**
 * Global mode initialization for le-kit components.
 *
 * Mode inheritance works as follows:
 * 1. Check the element's own `mode` attribute
 * 2. Traverse up the DOM to find a parent with `mode` attribute
 * 3. Check the document root element (html) for `mode` attribute
 * 4. Fall back to 'default'
 *
 * This allows setting mode at any level:
 * - `<html mode="admin">` - all components in admin mode
 * - `<le-card mode="admin">` - this card and its children in admin mode
 */
function initializeMode() {
  setMode((el: HTMLElement): LeKitMode => {
    // 1. Check element's own mode attribute
    const ownMode = el.getAttribute('mode');
    if (ownMode) {
      return ownMode as LeKitMode;
    }

    // 2. Traverse up the DOM tree to find inherited mode
    let parent = el.parentElement;
    while (parent) {
      const parentMode = parent.getAttribute('mode');
      if (parentMode) {
        return parentMode as LeKitMode;
      }
      parent = parent.parentElement;
    }

    // 3. Check document root element
    const rootMode = document.documentElement.getAttribute('mode');
    if (rootMode) {
      return rootMode as LeKitMode;
    }

    // 4. Default mode
    return 'default';
  });
}

// Default export for Stencil global script
export default initializeMode;

/**
 * Helper function to get the current mode for an element.
 * Can be used programmatically in components.
 * 
 * This function traverses both regular DOM and shadow DOM boundaries
 * to find the nearest mode attribute.
 */
export function getMode(el: HTMLElement): LeKitMode {
  // Check element's own mode
  const ownMode = el.getAttribute('mode');
  if (ownMode) {
    return ownMode as LeKitMode;
  }

  // Traverse up DOM, crossing shadow boundaries
  let current: Node | null = el;
  while (current) {
    // Try parent element first
    if (current instanceof Element && current.parentElement) {
      current = current.parentElement;
      const mode = (current as HTMLElement).getAttribute?.('mode');
      if (mode) {
        return mode as LeKitMode;
      }
    } else {
      // No parent element - check if we're in a shadow root
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        // Cross the shadow boundary to the host element
        current = root.host;
        const mode = (current as HTMLElement).getAttribute?.('mode');
        if (mode) {
          return mode as LeKitMode;
        }
      } else {
        // We've reached the document root
        break;
      }
    }
  }

  // Check document root
  const rootMode = document.documentElement.getAttribute('mode');
  if (rootMode) {
    return rootMode as LeKitMode;
  }

  return 'default';
}

/**
 * Helper function to get the current theme for an element.
 * Theme inheritance works the same as mode - cascades through DOM.
 */
export function getTheme(el: HTMLElement): LeKitTheme {
  // Check element's own theme
  const ownTheme = el.getAttribute('theme');
  if (ownTheme) {
    return ownTheme as LeKitTheme;
  }

  // Traverse up DOM
  let parent = el.parentElement;
  while (parent) {
    const parentTheme = parent.getAttribute('theme');
    if (parentTheme) {
      return parentTheme as LeKitTheme;
    }
    parent = parent.parentElement;
  }

  // Check root
  const rootTheme = document.documentElement.getAttribute('theme');
  if (rootTheme) {
    return rootTheme as LeKitTheme;
  }

  return 'default';
}

/**
 * Helper function to set mode on the document root.
 * Useful for switching all components to admin mode.
 */
export function setGlobalMode(mode: LeKitMode): void {
  document.documentElement.setAttribute('mode', mode);
}

/**
 * Helper function to set theme on the document root.
 * Useful for switching all components to a different theme.
 */
export function setGlobalTheme(theme: LeKitTheme): void {
  document.documentElement.setAttribute('theme', theme);
}

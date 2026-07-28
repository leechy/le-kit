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

/**
 * Definition of a composed icon in the registry.
 * Used to define icons that combine a base icon with badges or layers.
 */
export interface ComposedIconDef {
  /** Base icon name (the JSON file to load). Optional — omit for layer-only compositions. */
  icon?: string;
  /** Optional viewBox for the composed icon (used when no base icon is set). */
  viewBox?: string;
  /** Optional badge icon name. */
  badge?: string;
  /** Optional badge position (overrides icons.defaultBadgePosition). */
  badgePosition?: string;
  /** Optional badge scale (overrides icons.defaultBadgeScale). */
  badgeScale?: number;
  /** Optional badge opacity (0 to 1). */
  badgeOpacity?: number;
  /** Optional rounded setting for this composed icon. */
  rounded?: boolean;
  /** Optional sharp setting for this composed icon. */
  sharp?: boolean;
  /** Optional filled setting for this composed icon. */
  filled?: boolean;
  /** Optional outlined setting for this composed icon. */
  outlined?: boolean;
  /** Optional thin setting for this composed icon. */
  thin?: boolean;
  /** Optional additional layers. */
  layers?: Array<{
    name: string;
    position?: string;
    scale?: number;
    opacity?: number;
    rounded?: boolean;
    sharp?: boolean;
    filled?: boolean;
    outlined?: boolean;
    thin?: boolean;
  }>;
}

/**
 * Configuration for the icon registry and icon composition defaults.
 */
export interface LeKitIconsConfig {
  /**
   * Default badge position for all composed icons.
   * Can be overridden per-icon via badgePosition prop or registry entry.
   *
   * Default: '-4.5, -4.5' (bottom-right area)
   */
  defaultBadgePosition: string;

  /**
   * Default badge scale for all composed icons.
   * Can be overridden per-icon via badgeScale prop or registry entry.
   *
   * Default: 1
   */
  defaultBadgeScale: number;

  /**
   * Default viewBox for composed icons that have no base icon.
   * Fallback when neither the element nor the registry entry specifies a viewBox.
   *
   * Default: '0 0 16 16'
   */
  defaultViewBox: string;

  /**
   * Default rounded setting for all icons.
   * Can be overridden per icon via `rounded` prop.
   *
   * Default: false
   */
  defaultRounded?: boolean;

  /**
   * Default filled setting for all icons.
   * Can be overridden per icon via `filled` prop.
   *
   * Default: false
   */
  defaultFilled?: boolean;

  /**
   * Default thin setting for all icons.
   * Can be overridden per icon via `thin` prop.
   *
   * Default: false
   */
  defaultThin?: boolean;

  /**
   * Registry of named composed icon definitions.
   * Icons registered here can be used by name in any component that accepts icon names.
   *
   * @example
   * ```ts
   * configureLeKit({
   *   icons: {
   *     composed: {
   *       'move-to': { icon: 'folder', badge: 'move-badge' },
   *       'new-file': { icon: 'file', badge: 'add-badge' },
   *     },
   *   },
   * });
   * ```
   */
  composed: Record<string, ComposedIconDef>;
}

/**
 * Type definition for le-kit configuration
 */
export interface LeKitConfig {
  /**
   * URL to the custom-elements.json manifest.
   * Used by admin components (le-component, le-slot) to load component metadata.
   *
   * Default: '/custom-elements.json' (served from app root)
   *
   * For apps using le-kit, you may need to:
   * 1. Copy the manifest from node_modules/le-kit/custom-elements.json to your public folder
   * 2. Or set this to point to where the manifest is served
   */
  manifestFile: string;

  /**
   * Base path for loading assets (icons, etc.).
   *
   * Default: '' (empty - uses Stencil's getAssetPath)
   *
   * When set, assets will be loaded from: `${assetBasePath}/icons/${name}.json`
   *
   * For apps using le-kit, you should:
   * 1. Copy the assets from node_modules/le-kit/dist/assets to your public folder
   * 2. Set this to point to where the assets are served (e.g., '/le-kit-assets')
   *
   * @example
   * ```ts
   * configureLeKit({ assetBasePath: '/le-kit-assets' });
   * ```
   */
  assetBasePath: string;

  /**
   * Icon registry and composition defaults.
   */
  icons: LeKitIconsConfig;
}

// Use a Symbol to avoid conflicts with other libraries
const LE_KIT_CONFIG_KEY = '__leKitConfig__';

/**
 * Get the global config object, creating it if needed.
 * Uses globalThis (window in browser) to ensure config is shared
 * across all module bundles.
 */
const DEFAULT_ICONS_CONFIG: LeKitIconsConfig = {
  defaultBadgePosition: '-4.5, -4.5',
  defaultBadgeScale: 1,
  defaultViewBox: '0 0 16 16',
  defaultRounded: false,
  defaultFilled: false,
  defaultThin: false,
  composed: {},
};

function getGlobalConfig(): LeKitConfig {
  const g = globalThis as any;
  if (!g[LE_KIT_CONFIG_KEY]) {
    g[LE_KIT_CONFIG_KEY] = {
      manifestFile: 'custom-elements.json',
      assetBasePath: '',
      icons: { ...DEFAULT_ICONS_CONFIG },
    };
  }
  // Ensure icons sub-object has all required defaults (for pre-set configs)
  const cfg = g[LE_KIT_CONFIG_KEY];
  if (cfg.icons) {
    if (!cfg.icons.composed) cfg.icons.composed = {};
    if (!cfg.icons.defaultBadgePosition) cfg.icons.defaultBadgePosition = DEFAULT_ICONS_CONFIG.defaultBadgePosition;
    if (cfg.icons.defaultBadgeScale == null) cfg.icons.defaultBadgeScale = DEFAULT_ICONS_CONFIG.defaultBadgeScale;
    if (!cfg.icons.defaultViewBox) cfg.icons.defaultViewBox = DEFAULT_ICONS_CONFIG.defaultViewBox;
    if (cfg.icons.defaultRounded == null) cfg.icons.defaultRounded = DEFAULT_ICONS_CONFIG.defaultRounded;
    if (cfg.icons.defaultFilled == null) cfg.icons.defaultFilled = DEFAULT_ICONS_CONFIG.defaultFilled;
    if (cfg.icons.defaultThin == null) cfg.icons.defaultThin = DEFAULT_ICONS_CONFIG.defaultThin;
  } else {
    cfg.icons = { ...DEFAULT_ICONS_CONFIG };
  }
  return cfg;
}

/**
 * Configure le-kit global settings.
 *
 * @example
 * ```ts
 * import { configureLeKit } from 'le-kit';
 *
 * configureLeKit({
 *   manifestFile: 'custom-elements.json',
 *   assetBasePath: '/le-kit-assets'
 * });
 * ```
 */
export function configureLeKit(config: Partial<LeKitConfig>): void {
  const globalConfig = getGlobalConfig();

  // Deep-merge icons config so multiple configureLeKit calls add to the registry
  if (config.icons) {
    const iconsConfig = config.icons as Partial<LeKitIconsConfig>;
    if (iconsConfig.composed) {
      globalConfig.icons.composed = { ...globalConfig.icons.composed, ...iconsConfig.composed };
    }
    if (iconsConfig.defaultBadgePosition) {
      globalConfig.icons.defaultBadgePosition = iconsConfig.defaultBadgePosition;
    }
    if (iconsConfig.defaultBadgeScale != null) {
      globalConfig.icons.defaultBadgeScale = iconsConfig.defaultBadgeScale;
    }
    if (iconsConfig.defaultViewBox) {
      globalConfig.icons.defaultViewBox = iconsConfig.defaultViewBox;
    }
    if (iconsConfig.defaultRounded != null) {
      globalConfig.icons.defaultRounded = iconsConfig.defaultRounded;
    }
    if (iconsConfig.defaultFilled != null) {
      globalConfig.icons.defaultFilled = iconsConfig.defaultFilled;
    }
    if (iconsConfig.defaultThin != null) {
      globalConfig.icons.defaultThin = iconsConfig.defaultThin;
    }
    // Apply non-icons config
    const { icons: _, ...rest } = config;
    Object.assign(globalConfig, rest);
  } else {
    Object.assign(globalConfig, config);
  }
}

/**
 * Get the current le-kit configuration.
 */
export function getLeKitConfig(): LeKitConfig {
  return getGlobalConfig();
}

/**
 * Get the configured asset base path.
 * Used internally by components that load assets.
 */
export function getAssetBasePath(): string {
  return getGlobalConfig().assetBasePath;
}

/**
 * Get the default badge position from config.
 */
export function getDefaultBadgePosition(): string {
  return getGlobalConfig().icons.defaultBadgePosition;
}

/**
 * Get the default badge scale from config.
 */
export function getDefaultBadgeScale(): number {
  return getGlobalConfig().icons.defaultBadgeScale;
}

/**
 * Get the default viewBox from config.
 */
export function getDefaultViewBox(): string {
  return getGlobalConfig().icons.defaultViewBox;
}

/**
 * Get the default rounded setting from config.
 */
export function getDefaultIconRounded(): boolean {
  return getGlobalConfig().icons.defaultRounded ?? false;
}

/**
 * Get the default filled setting from config.
 */
export function getDefaultIconFilled(): boolean {
  return getGlobalConfig().icons.defaultFilled ?? false;
}

/**
 * Get the default thin setting from config.
 */
export function getDefaultIconThin(): boolean {
  return getGlobalConfig().icons.defaultThin ?? false;
}

/**
 * Register a single composed icon definition.
 * Can be called at any time to add icons to the registry.
 *
 * @example
 * ```ts
 * registerIcon('move-to', { icon: 'folder', badge: 'move-badge' });
 * ```
 */
export function registerIcon(name: string, def: ComposedIconDef): void {
  getGlobalConfig().icons.composed[name] = def;
}

/**
 * Register multiple composed icon definitions at once.
 *
 * @example
 * ```ts
 * registerIcons({
 *   'move-to': { icon: 'folder', badge: 'move-badge' },
 *   'new-file': { icon: 'file', badge: 'add-badge' },
 * });
 * ```
 */
export function registerIcons(icons: Record<string, ComposedIconDef>): void {
  Object.assign(getGlobalConfig().icons.composed, icons);
}

/**
 * Look up a composed icon definition by name.
 * Returns undefined if the name is not registered.
 */
export function getComposedIcon(name: string): ComposedIconDef | undefined {
  return getGlobalConfig().icons.composed[name];
}

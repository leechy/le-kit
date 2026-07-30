/**
 * Based on the script from Paul Andreson's article:
 * https://paulcpederson.com/articles/stencil-icons/
 */
import { Build, Component, Element, getAssetPath, h, Prop, State, Watch } from '@stencil/core';
import {
  getAssetBasePath,
  getComposedIcon,
  getDefaultBadgePosition,
  getDefaultBadgeScale,
  getDefaultTextBadgePosition,
  getDefaultTextBadgeScale,
  getDefaultIconFilled,
  getDefaultIconRounded,
  getDefaultIconThin,
  getDefaultViewBox,
} from '../../global/app';
import {
  computeLayerTransform,
  LayerConfig,
  parseLayers,
  parsePosition,
  parseViewBox,
} from './icon-utils';

const iconCache: Record<string, any> = {};
const requestCache: Record<string, Promise<any>> = {};

/** Inline separator for badge syntax: "base-icon::badge-icon" */
const INLINE_BADGE_SEPARATOR = '::';

/**
 * Get the URL for loading an icon.
 * Uses configurable assetBasePath if set, otherwise falls back to Stencil's getAssetPath.
 */
function getIconUrl(name: string): string {
  const basePath = getAssetBasePath();
  if (basePath) {
    // Use configured base path - normalize by removing trailing slash
    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    return `${normalizedBase}/icons/${name}.json`;
  }
  // Fall back to Stencil's getAssetPath for local development
  return getAssetPath(`./assets/icons/${name}.json`);
}

async function fetchIcon({ name }: { name: string }): Promise<string> {
  if (iconCache[name]) {
    return iconCache[name];
  }
  if (!requestCache[name]) {
    const iconUrl = getIconUrl(name);
    requestCache[name] = fetch(iconUrl)
      .then(resp => resp.json())
      .catch(() => {
        console.error(`Icon "${name}" could not be loaded from: ${iconUrl}`);
        return '';
      });
  }

  const path = await requestCache[name];
  iconCache[name] = path;

  return path;
}

/**
 * Resolved layer data — combines the layer config with loaded icon data.
 */
interface ResolvedLayer {
  config: LayerConfig;
  data: any;
}

@Component({
  tag: 'le-icon',
  styleUrl: 'le-icon.css',
  shadow: true,
  assetsDirs: ['assets/icons'],
})
export class LeIcon {
  @Element() el!: HTMLElement;

  /**
   * Name of the icon to display. Corresponds to a JSON file in the assets folder.
   * For example, "search" will load the "search.json" file.
   */
  @Prop() name?: string = undefined;

  /**
   * Size of the icon in pixels. Default is 16.
   */
  @Prop() size: number = 16;

  /**
   * Custom viewBox for the SVG. When set, overrides the viewBox from the loaded icon data.
   * Useful for layer-only compositions without a base icon.
   *
   * @example "0 0 16 16"
   */
  @Prop({ attribute: 'view-box' }) viewBox?: string;

  /**
   * Name of a badge icon to overlay on top of the base icon.
   * The badge icon is loaded and composed with mask-based knockout.
   */
  @Prop() badge?: string;

  /**
   * Position of the badge icon within the base icon's viewBox.
   * Comma-separated x,y values in viewBox units or percentages.
   * Positive values = from start/top, Negative values = from end/bottom.
   * Percentages work like CSS background-position.
   * Default: "-5, -5" (bottom-right area).
   *
   * @example "-2, -2"    → 2 units from right and bottom edges
   * @example "100%, 0%"  → top-right corner
   * @example "50%, 50%"  → centered
   */
  @Prop() badgePosition?: string;

  /**
   * Scale factor for the badge icon. Default: 1.0.
   * Badge icons are designed at their natural display size,
   * so 1.0 means no scaling. Use >1 to enlarge, <1 to shrink.
   */
  @Prop() badgeScale?: number;

  /**
   * Optional opacity for the badge icon (0 to 1).
   */
  @Prop({ reflect: true }) badgeOpacity?: number;

  /**
   * Optional numeric count for notification badge (e.g. 5 or 120).
   */
  @Prop({ reflect: true }) count?: number;

  /**
   * Optional max count threshold (e.g. 99 -> "99+").
   */
  @Prop({ reflect: true }) maxCount?: number;

  /**
   * Optional text string for notification badge (e.g. "NEW").
   * Can also be set as boolean attribute `<le-icon badge-text></le-icon>` for an empty dot.
   */
  @Prop({ reflect: true }) badgeText?: string | boolean;

  /**
   * Whether to display an empty circle dot badge.
   */
  @Prop({ reflect: true }) dot?: boolean;

  /**
   * Optional text/font color for the badge text.
   */
  @Prop({ reflect: true }) badgeTextColor?: string;

  /**
   * Optional color for the badge icon or background (CSS color or variable).
   * Defaults to 'transparent'.
   */
  @Prop({ reflect: true }) badgeColor?: string;

  /**
   * Optional color for the base icon (CSS color or variable).
   */
  @Prop({ reflect: true }) baseColor?: string;

  /**
   * JSON string defining additional icon layers to compose on top
   * of the base icon. Each layer has a name, optional position, and
   * optional scale. Layers are rendered in order (first = bottom,
   * last = top), and each layer's maskShape (if present) cuts through
   * all layers below it.
   *
   * @example '[{"name":"folder","position":"0,50%","scale":0.8}]'
   */
  @Prop() layers?: string;

  /**
   * Whether to use rounded variants of icon elements if defined in icon JSON.
   * If not explicitly set, defaults to the global le-kit config (`icons.defaultRounded`).
   */
  @Prop({ reflect: true }) rounded?: boolean;

  /**
   * Whether to force sharp (non-rounded) variants of icon elements.
   * Overrides `rounded` prop, registry settings, and global defaults.
   */
  @Prop({ reflect: true }) sharp?: boolean;

  /**
   * Whether to use filled variants of icon elements if defined in icon JSON.
   * If not explicitly set, defaults to the global le-kit config (`icons.defaultFilled`).
   */
  @Prop({ reflect: true }) filled?: boolean;

  /**
   * Whether to force outlined (non-filled) variants of icon elements.
   * Overrides `filled` prop, registry settings, and global defaults.
   */
  @Prop({ reflect: true }) outlined?: boolean;

  /**
   * Whether to use thin variants of icon elements if defined in icon JSON.
   * If not explicitly set, defaults to the global le-kit config (`icons.defaultThin`).
   */
  @Prop({ reflect: true }) thin?: boolean;

  @State() private iconData: any = null;

  @State() private badgeData: any = null;

  @State() private layersData: ResolvedLayer[] = [];

  @State() private visible = false;

  @Watch('name')
  @Watch('badge')
  @Watch('badgePosition')
  @Watch('badgeScale')
  @Watch('badgeOpacity')
  @Watch('badgeColor')
  @Watch('badgeTextColor')
  @Watch('count')
  @Watch('maxCount')
  @Watch('badgeText')
  @Watch('dot')
  @Watch('baseColor')
  @Watch('layers')
  @Watch('rounded')
  @Watch('sharp')
  @Watch('filled')
  @Watch('outlined')
  @Watch('thin')
  private async loadIconData(): Promise<void> {
    const { name, visible } = this;

    if (!Build.isBrowser || !visible) {
      return;
    }

    // Resolve the icon name — registry → inline :: syntax → direct name
    let baseName = name;
    let resolvedBadge = this.badge;
    let resolvedBadgePosition = this.badgePosition;
    let resolvedBadgeScale = this.badgeScale;
    let resolvedBadgeOpacity = this.badgeOpacity;
    let resolvedBadgeColor = this.badgeColor;
    let resolvedBaseColor = this.baseColor;
    let resolvedLayers = this.layers;
    let resolvedViewBox = this.viewBox;
    let resolvedRounded = this.rounded;
    let resolvedSharp = this.sharp;
    let resolvedFilled = this.filled;
    let resolvedOutlined = this.outlined;
    let resolvedThin = this.thin;

    if (name) {
      let targetName = name;

      // 1. Check if the full name exists in registry
      let composedDef = getComposedIcon(name);

      // 2. If not, check for inline :: separator
      if (!composedDef && name.includes(INLINE_BADGE_SEPARATOR)) {
        const [base, badge] = name.split(INLINE_BADGE_SEPARATOR, 2);
        targetName = base;
        if (!resolvedBadge && badge) {
          resolvedBadge = badge;
        }
        composedDef = getComposedIcon(targetName);
      }

      // 3. Apply composed definition if found (either for full name or extracted base)
      if (composedDef) {
        baseName = composedDef.icon || undefined;
        // Store the registry's viewBox for later resolution
        resolvedViewBox = composedDef.viewBox;
        // Registry values apply only if explicit/resolved props are not set
        if (!resolvedBadge && composedDef.badge) {
          resolvedBadge = composedDef.badge;
        }
        if (!this.badgePosition && composedDef.badgePosition) {
          resolvedBadgePosition = composedDef.badgePosition;
        }
        if (this.badgeScale == null && composedDef.badgeScale != null) {
          resolvedBadgeScale = composedDef.badgeScale;
        }
        if (this.badgeOpacity == null && composedDef.badgeOpacity != null) {
          resolvedBadgeOpacity = composedDef.badgeOpacity;
        }
        if (!this.badgeColor && composedDef.badgeColor) {
          resolvedBadgeColor = composedDef.badgeColor;
        }
        if (!this.baseColor && composedDef.baseColor) {
          resolvedBaseColor = composedDef.baseColor;
        }
        if (this.sharp == null && composedDef.sharp != null) {
          resolvedSharp = composedDef.sharp;
        }
        if (this.rounded == null && composedDef.rounded != null) {
          resolvedRounded = composedDef.rounded;
        }
        if (this.outlined == null && composedDef.outlined != null) {
          resolvedOutlined = composedDef.outlined;
        }
        if (this.filled == null && composedDef.filled != null) {
          resolvedFilled = composedDef.filled;
        }
        if (this.thin == null && composedDef.thin != null) {
          resolvedThin = composedDef.thin;
        }
        if (!this.layers && composedDef.layers) {
          resolvedLayers = JSON.stringify(composedDef.layers);
        }
      } else {
        baseName = targetName;
      }
    }

    // Load all icons in parallel
    const promises: Promise<void>[] = [];

    // Base icon
    if (baseName) {
      promises.push(
        fetchIcon({ name: baseName }).then(data => {
          this.iconData = data;
          if (!data) {
            console.warn(`le-icon: Icon "${baseName}" not found.`);
          }
        }),
      );
    } else {
      this.iconData = null;
    }

    // Badge icon
    if (resolvedBadge) {
      promises.push(
        fetchIcon({ name: resolvedBadge }).then(data => {
          this.badgeData = data;
          if (!data) {
            console.warn(`le-icon: Badge icon "${resolvedBadge}" not found.`);
          }
        }),
      );
    } else {
      this.badgeData = null;
    }

    // Layer icons
    const layerConfigs = parseLayers(resolvedLayers);
    if (layerConfigs.length > 0) {
      const layerPromises = layerConfigs.map(config => {
        const layerName = config.name || config.icon || '';
        return fetchIcon({ name: layerName }).then(data => {
          if (!data) {
            console.warn(`le-icon: Layer icon "${layerName}" not found.`);
          }
          return { config: { ...config, name: layerName }, data };
        });
      });
      promises.push(
        Promise.all(layerPromises).then(resolved => {
          this.layersData = resolved;
        }),
      );
    } else {
      this.layersData = [];
    }

    // Store resolved values for use in rendering
    this._resolvedBadgePosition = resolvedBadgePosition;
    this._resolvedBadgeScale = resolvedBadgeScale;
    this._resolvedBadgeOpacity = resolvedBadgeOpacity;
    this._resolvedBadgeColor = resolvedBadgeColor;
    this._resolvedBaseColor = resolvedBaseColor;
    this._resolvedViewBox = resolvedViewBox;
    this._resolvedRounded = resolvedRounded;
    this._resolvedSharp = resolvedSharp;
    this._resolvedFilled = resolvedFilled;
    this._resolvedOutlined = resolvedOutlined;
    this._resolvedThin = resolvedThin;

    await Promise.all(promises);
  }

  private intersectionObserver?: IntersectionObserver;

  /** Resolved badge position (from explicit prop, registry, or config default). */
  private _resolvedBadgePosition?: string;

  /** Resolved badge scale (from explicit prop, registry, or config default). */
  private _resolvedBadgeScale?: number;

  /** Resolved badge opacity (from explicit prop or registry). */
  private _resolvedBadgeOpacity?: number;

  /** Resolved badge color (from explicit prop or registry). */
  private _resolvedBadgeColor?: string;

  /** Resolved base icon color (from explicit prop or registry). */
  private _resolvedBaseColor?: string;

  /** Resolved viewBox (from explicit prop, registry, config default, or first layer). */
  private _resolvedViewBox?: string;

  /** Resolved rounded setting (from explicit prop, registry, or config default). */
  private _resolvedRounded?: boolean;

  /** Resolved sharp setting (from explicit prop or registry). */
  private _resolvedSharp?: boolean;

  /** Resolved filled setting (from explicit prop, registry, or config default). */
  private _resolvedFilled?: boolean;

  /** Resolved outlined setting (from explicit prop or registry). */
  private _resolvedOutlined?: boolean;

  /** Resolved thin setting (from explicit prop, registry, or config default). */
  private _resolvedThin?: boolean;

  connectedCallback(): void {
    this.waitUntilVisible(() => {
      this.visible = true;
      this.loadIconData();
    });
  }

  disconnectedCallback(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }
  }

  async componentWillLoad(): Promise<void> {
    this.loadIconData();
  }

  private waitUntilVisible(callback: () => void): void {
    if (
      !Build.isBrowser ||
      typeof window === 'undefined' ||
      !(window as any).IntersectionObserver
    ) {
      callback();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.intersectionObserver?.disconnect();
            this.intersectionObserver = undefined;
            callback();
          }
        });
      },
      { rootMargin: '50px' },
    );

    this.intersectionObserver.observe(this.el);
  }

  /**
   * Resolves element descriptors, applying variant overrides (rounded, filled, thin, and combinations)
   * based on the component's current `rounded`, `sharp`, `filled`, `outlined`, and `thin` state,
   * with optional per-layer overrides.
   */
  private resolveNode(
    node: any,
    overrides?: { rounded?: boolean; sharp?: boolean; filled?: boolean; outlined?: boolean; thin?: boolean },
  ): any {
    if (!node) return node;

    let rounded = false;
    if (typeof this.sharp === 'boolean' && this.sharp) {
      rounded = false;
    } else if (typeof this.rounded === 'boolean') {
      rounded = this.rounded;
    } else if (typeof overrides?.sharp === 'boolean' && overrides.sharp) {
      rounded = false;
    } else if (typeof overrides?.rounded === 'boolean') {
      rounded = overrides.rounded;
    } else if (typeof this._resolvedSharp === 'boolean' && this._resolvedSharp) {
      rounded = false;
    } else if (typeof this._resolvedRounded === 'boolean') {
      rounded = this._resolvedRounded;
    } else {
      rounded = getDefaultIconRounded();
    }

    let filled = false;
    if (typeof this.outlined === 'boolean' && this.outlined) {
      filled = false;
    } else if (typeof this.filled === 'boolean') {
      filled = this.filled;
    } else if (typeof overrides?.outlined === 'boolean' && overrides.outlined) {
      filled = false;
    } else if (typeof overrides?.filled === 'boolean') {
      filled = overrides.filled;
    } else if (typeof this._resolvedOutlined === 'boolean' && this._resolvedOutlined) {
      filled = false;
    } else if (typeof this._resolvedFilled === 'boolean') {
      filled = this._resolvedFilled;
    } else {
      filled = getDefaultIconFilled();
    }

    let thin = false;
    if (typeof this.thin === 'boolean') {
      thin = this.thin;
    } else if (typeof overrides?.thin === 'boolean') {
      thin = overrides.thin;
    } else if (typeof this._resolvedThin === 'boolean') {
      thin = this._resolvedThin;
    } else {
      thin = getDefaultIconThin();
    }

    let resolved = { ...node };

    // 1. Single-modifier base overrides
    if (rounded && resolved['rounded']) {
      resolved = this.applyOverride(resolved, resolved['rounded']);
    }
    if (filled && resolved['filled']) {
      resolved = this.applyOverride(resolved, resolved['filled']);
    }
    if (thin && resolved['thin']) {
      resolved = this.applyOverride(resolved, resolved['thin']);
    }

    // 2. Dual-modifier combination overrides
    if (rounded && filled && resolved['rounded-filled']) {
      resolved = this.applyOverride(resolved, resolved['rounded-filled']);
    }
    if (rounded && thin && resolved['rounded-thin']) {
      resolved = this.applyOverride(resolved, resolved['rounded-thin']);
    }
    if (filled && thin && resolved['filled-thin']) {
      resolved = this.applyOverride(resolved, resolved['filled-thin']);
    }

    // 3. Triple-modifier combination override
    if (rounded && filled && thin && resolved['rounded-filled-thin']) {
      resolved = this.applyOverride(resolved, resolved['rounded-filled-thin']);
    }

    delete resolved['rounded'];
    delete resolved['filled'];
    delete resolved['thin'];
    delete resolved['rounded-filled'];
    delete resolved['rounded-thin'];
    delete resolved['filled-thin'];
    delete resolved['rounded-filled-thin'];

    return resolved;
  }

  private applyOverride(base: any, override: any): any {
    const res = { ...base };
    for (const key of Object.keys(override)) {
      if (override[key] === null || override[key] === undefined) {
        delete res[key];
      } else {
        res[key] = override[key];
      }
    }
    return res;
  }

  /**
   * Creates a JSX element from a JSON node descriptor.
   */
  private createElement(
    rawNode: any,
    inverseScale = 1,
    overrides?: { rounded?: boolean; sharp?: boolean; filled?: boolean; outlined?: boolean; thin?: boolean },
  ) {
    if (!rawNode) return null;

    const node = this.resolveNode(rawNode, overrides);
    const { tag, children, ...attrs } = node;

    // Adjust stroke-width to counteract the group transform scale
    if (inverseScale !== 1 && attrs['stroke-width'] !== undefined) {
      const originalStrokeWidth = parseFloat(attrs['stroke-width']);
      if (!isNaN(originalStrokeWidth)) {
        attrs['stroke-width'] = String(originalStrokeWidth / inverseScale);
      }
    }

    return h(tag, attrs, children ? children.map((child: any) => this.createElement(child, inverseScale, overrides)) : null);
  }

  /**
   * Renders the SVG content out of a JSON data in a format:
   * { "viewBox": "...", children: [{ "tag": "g", ""children": [ ... ], ...attrs }, ...] }
   *
   * @returns JSX.Element | null
   */
  private renderSVGContent(
    children?: any[],
    inverseScale = 1,
    overrides?: { rounded?: boolean; sharp?: boolean; filled?: boolean; outlined?: boolean; thin?: boolean },
  ): any[] {
    if (!children || children.length === 0) {
      return [];
    }

    return children.map(child => this.createElement(child, inverseScale, overrides));
  }

  /**
   * Resolves the badge text from count, maxCount, dot, or badgeText props.
   */
  private getResolvedBadgeText(): string | null {
    if (this.dot) {
      return '';
    }
    if (this.count != null) {
      const cnt = Number(this.count);
      if (!isNaN(cnt)) {
        if (this.maxCount != null && cnt > Number(this.maxCount)) {
          return `${this.maxCount}+`;
        }
        return String(cnt);
      }
    }
    if (this.badgeText != null) {
      if (typeof this.badgeText === 'boolean') {
        return this.badgeText ? '' : null;
      }
      const str = String(this.badgeText).trim();
      return str;
    }
    return null;
  }

  /**
   * Checks whether this icon has any overlay layers (badge, layers prop, or count/badgeText/dot).
   */
  private hasOverlays(): boolean {
    return !!(this.badgeData || this.layersData.length > 0 || this.getResolvedBadgeText() != null);
  }

  /**
   * Builds the ordered list of overlay layers to render above the base icon.
   * Layers from the `layers` prop come first, then the badge (always topmost).
   */
  private getOverlayLayers(): ResolvedLayer[] {
    const overlays: ResolvedLayer[] = [];

    // Layers from the `layers` prop
    for (const layer of this.layersData) {
      if (layer.data) {
        overlays.push(layer);
      }
    }

    // Badge is syntactic sugar for a topmost layer
    if (this.badgeData) {
      const defaultPos = getDefaultBadgePosition();
      const defaultScale = getDefaultBadgeScale();
      overlays.push({
        config: {
          name: this.badge || '',
          position: this._resolvedBadgePosition || defaultPos,
          scale: this._resolvedBadgeScale ?? defaultScale,
          opacity: this._resolvedBadgeOpacity,
          color: this._resolvedBadgeColor,
          isBadge: true,
        },
        data: this.badgeData,
      });
    }

    return overlays;
  }

  /**
   * Helper to render maskShape which can be a single node descriptor or an array of node descriptors.
   */
  private renderMaskShape(
    maskShape: any,
    scale: number,
    overrides?: { rounded?: boolean; sharp?: boolean; filled?: boolean; outlined?: boolean; thin?: boolean },
  ): any[] {
    if (!maskShape) return [];
    if (Array.isArray(maskShape)) {
      return maskShape.map(node => this.createElement(node, scale, overrides));
    }
    return [this.createElement(maskShape, scale, overrides)];
  }

  /**
   * Renders the composed SVG with mask-based knockout for overlapping layers.
   */
  private renderComposed() {
    const parentViewBox = this.resolveViewBox();
    const parentVB = parseViewBox(parentViewBox);
    const overlays = this.getOverlayLayers();

    // Compute text / count badge if set
    const textBadgeStr = this.getResolvedBadgeText();
    let textBadgeMaskShape: any = null;
    let textBadgeGroup: any = null;

    if (textBadgeStr != null) {
      const scale = this._resolvedBadgeScale ?? getDefaultTextBadgeScale();
      const pos = parsePosition(
        this._resolvedBadgePosition || getDefaultTextBadgePosition(),
        parentVB.width,
        parentVB.height,
        0,
        0,
      );

      const hVal = 5.5 * scale;
      const rxVal = hVal / 2;
      const len = textBadgeStr.length;
      const charWidth = (len > 2 ? 1.9 : 2.0) * scale;
      const wVal = len <= 1 ? hVal : hVal + (len - 1) * charWidth;

      // Anchor top-right edge at (pos.x, pos.y), expanding to the left
      const rxBox = pos.x - wVal;
      const ryBox = pos.y;
      const centerX = rxBox + wVal / 2;

      // Clearance margin for mask knockout (0.5px margin, matching action badges)
      const m = 0.5 * scale;
      textBadgeMaskShape = h('rect', {
        x: rxBox - m,
        y: ryBox - m,
        width: wVal + 2 * m,
        height: hVal + 2 * m,
        rx: (hVal + 2 * m) / 2,
        ry: (hVal + 2 * m) / 2,
        fill: 'black',
      });

      const isTransparent = this._resolvedBadgeColor === 'transparent' || this._resolvedBadgeColor === 'none';
      const effectiveBgColor = isTransparent ? null : (this._resolvedBadgeColor || 'var(--le-color-danger, #ef4444)');
      const bgRect = effectiveBgColor ? h('rect', { x: rxBox, y: ryBox, width: wVal, height: hVal, rx: rxVal, ry: rxVal, fill: effectiveBgColor }) : null;

      const groupAttrs: any = {};
      if (this._resolvedBadgeOpacity != null) {
        groupAttrs.opacity = String(this._resolvedBadgeOpacity);
      }

      const textBadgeChildren: any[] = [];
      if (bgRect) {
        textBadgeChildren.push(bgRect);
      }

      if (len > 0) {
        const fontSize = (len > 2 ? 3.2 : 3.5) * scale;
        const textFill = this.badgeTextColor || (isTransparent ? 'currentColor' : '#ffffff');

        const textEl = h('text', {
          x: centerX,
          y: ryBox + 2.7 * scale,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': String(fontSize),
          fill: textFill,
        }, textBadgeStr);

        textBadgeChildren.push(textEl);
      }

      textBadgeGroup = h('g', groupAttrs, ...textBadgeChildren);
    }

    // Pre-compute positions and transforms for each overlay
    const overlayInfo = overlays.map(layer => {
      const layerVB = parseViewBox(layer.data.viewBox || '0 0 16 16');
      const scale = layer.config.scale ?? 1;
      const defaultPos = (layer.config as any).isBadge ? getDefaultBadgePosition() : '50%, 50%';
      const pos = parsePosition(
        layer.config.position || defaultPos,
        parentVB.width,
        parentVB.height,
        layerVB.width * scale,
        layerVB.height * scale,
      );
      const transform = computeLayerTransform(pos.x, pos.y, scale, layerVB);

      return { layer, layerVB, scale, pos, transform };
    });

    // Build masks — each layer below needs a mask that knocks out all layers above it
    const masks: any[] = [];

    for (let i = 0; i < overlayInfo.length; i++) {
      // Mask for layer at index i-1 (or the base icon if i === 0)
      // Contains knockout shapes from overlays[i] through overlays[N-1]
      const maskShapes: any[] = [];

      for (let j = i; j < overlayInfo.length; j++) {
        const info = overlayInfo[j];
        if (info.layer.config.mask !== false && info.layer.data.maskShape) {
          const layerOverrides = {
            rounded: info.layer.config.rounded ?? this._resolvedRounded,
            sharp: info.layer.config.sharp ?? this._resolvedSharp,
            filled: info.layer.config.filled ?? this._resolvedFilled,
            outlined: info.layer.config.outlined ?? this._resolvedOutlined,
            thin: info.layer.config.thin ?? this._resolvedThin,
          };
          const maskGroupAttrs: any = {};
          if (info.transform) {
            maskGroupAttrs.transform = info.transform;
          }
          maskShapes.push(
            h('g', maskGroupAttrs, 
              this.renderMaskShape(info.layer.data.maskShape, info.scale, layerOverrides),
            ),
          );
        }
      }

      if (textBadgeMaskShape) {
        maskShapes.push(textBadgeMaskShape);
      }

      if (maskShapes.length > 0) {
        masks.push(
          h('mask', { id: `m${i}`, maskUnits: 'userSpaceOnUse' }, [
            h('rect', {
              x: parentVB.x,
              y: parentVB.y,
              width: parentVB.width,
              height: parentVB.height,
              fill: 'white',
            }),
            ...maskShapes,
          ]),
        );
      }
    }

    // If there's no action layer masks yet but textBadgeMaskShape exists, build mask m0 for base icon
    if (masks.length === 0 && textBadgeMaskShape) {
      masks.push(
        h('mask', { id: 'm0', maskUnits: 'userSpaceOnUse' }, [
          h('rect', {
            x: parentVB.x,
            y: parentVB.y,
            width: parentVB.width,
            height: parentVB.height,
            fill: 'white',
          }),
          textBadgeMaskShape,
        ]),
      );
    }

    // Determine mask IDs for each rendered group
    // Base icon uses mask that contains ALL overlay knockout shapes (mask index 0)
    // Layer[i] uses mask that contains knockout shapes from layers[i+1..N] (mask index i+1)
    // Topmost layer gets no mask

    const hasMaskForBase = masks.length > 0;

    // Render base icon
    const baseContent = this.renderSVGContent(this.iconData?.children);
    const baseAttrs: any = {};
    if (hasMaskForBase) {
      baseAttrs.mask = 'url(#m0)';
    }
    if (this._resolvedBaseColor) {
      baseAttrs.style = { color: this._resolvedBaseColor };
    }
    const baseGroup = Object.keys(baseAttrs).length > 0
      ? h('g', baseAttrs, ...baseContent)
      : baseContent;

    // Render overlay layers
    const overlayGroups = overlayInfo.map((info, i) => {
      const maskIndex = i + 1;
      const hasMask = maskIndex < masks.length;
      const layerOverrides = {
        rounded: info.layer.config.rounded ?? this._resolvedRounded,
        sharp: info.layer.config.sharp ?? this._resolvedSharp,
        filled: info.layer.config.filled ?? this._resolvedFilled,
        outlined: info.layer.config.outlined ?? this._resolvedOutlined,
        thin: info.layer.config.thin ?? this._resolvedThin,
      };

      const groupAttrs: any = {};
      if (info.transform) {
        groupAttrs.transform = info.transform;
      }
      if (info.layer.config.opacity != null) {
        groupAttrs.opacity = String(info.layer.config.opacity);
      }
      if (info.layer.config.color) {
        groupAttrs.style = { color: info.layer.config.color };
      }

      const layerContent = h(
        'g',
        groupAttrs,
        ...this.renderSVGContent(info.layer.data.children, info.scale, layerOverrides),
      );

      return hasMask
        ? h('g', { mask: `url(#m${maskIndex})` }, [layerContent])
        : layerContent;
    });

    return [
      masks.length > 0 ? h('defs', {}, masks) : null,
      baseGroup,
      ...overlayGroups,
      textBadgeGroup,
    ];
  }

  /**
   * Resolves the viewBox for the SVG element using the fallback chain:
   * 1. Element's viewBox prop
   * 2. Registry definition's viewBox
   * 3. Base icon's viewBox (from loaded JSON)
   * 4. Config's defaultViewBox
   * 5. First layer's viewBox
   * 6. Size-based fallback
   */
  private resolveViewBox(): string {
    // 1. Element's viewBox prop (already captured in _resolvedViewBox if set directly)
    // 2. Registry definition's viewBox (also captured in _resolvedViewBox)
    if (this._resolvedViewBox) {
      return this._resolvedViewBox;
    }

    // 3. Base icon's viewBox
    if (this.iconData?.viewBox) {
      return this.iconData.viewBox;
    }

    // 4. Config's defaultViewBox
    const configViewBox = getDefaultViewBox();
    if (configViewBox) {
      return configViewBox;
    }

    // 5. First layer's viewBox
    if (this.layersData.length > 0 && this.layersData[0].data?.viewBox) {
      return this.layersData[0].data.viewBox;
    }

    // 6. Size-based fallback
    return `0 0 ${this.size || 16} ${this.size || 16}`;
  }

  render() {
    const viewBox = this.resolveViewBox();

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        height={this.size || 16}
        width={this.size || 16}
        viewBox={viewBox}
      >
        {this.hasOverlays()
          ? this.renderComposed()
          : this.renderSVGContent(this.iconData?.children)}
      </svg>
    );
  }
}

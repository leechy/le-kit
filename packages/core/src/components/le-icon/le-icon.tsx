/**
 * Based on the script from Paul Andreson's article:
 * https://paulcpederson.com/articles/stencil-icons/
 */
import { Build, Component, Element, getAssetPath, h, Prop, State, Watch } from '@stencil/core';
import { getAssetBasePath, getComposedIcon, getDefaultBadgePosition, getDefaultBadgeScale, getDefaultViewBox } from '../../global/app';
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
   * JSON string defining additional icon layers to compose on top
   * of the base icon. Each layer has a name, optional position, and
   * optional scale. Layers are rendered in order (first = bottom,
   * last = top), and each layer's maskShape (if present) cuts through
   * all layers below it.
   *
   * @example '[{"name":"folder","position":"0,50%","scale":0.8}]'
   */
  @Prop() layers?: string;

  @State() private iconData: any = null;

  @State() private badgeData: any = null;

  @State() private layersData: ResolvedLayer[] = [];

  @State() private visible = false;

  @Watch('name')
  @Watch('badge')
  @Watch('layers')
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
    let resolvedLayers = this.layers;
    let resolvedViewBox = this.viewBox;

    if (name) {
      // 1. Check the registry for a composed icon definition
      const composedDef = getComposedIcon(name);
      if (composedDef) {
        baseName = composedDef.icon || undefined;
        // Store the registry's viewBox for later resolution
        resolvedViewBox = composedDef.viewBox;
        // Registry values apply only if explicit props are not set
        if (!this.badge && composedDef.badge) {
          resolvedBadge = composedDef.badge;
        }
        if (!this.badgePosition && composedDef.badgePosition) {
          resolvedBadgePosition = composedDef.badgePosition;
        }
        if (this.badgeScale == null && composedDef.badgeScale != null) {
          resolvedBadgeScale = composedDef.badgeScale;
        }
        if (!this.layers && composedDef.layers) {
          resolvedLayers = JSON.stringify(composedDef.layers);
        }
      }
      // 2. Check for inline :: separator (only if not a registry match)
      else if (name.includes(INLINE_BADGE_SEPARATOR)) {
        const [base, badge] = name.split(INLINE_BADGE_SEPARATOR, 2);
        baseName = base;
        if (!this.badge && badge) {
          resolvedBadge = badge;
        }
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
      const layerPromises = layerConfigs.map(config =>
        fetchIcon({ name: config.name }).then(data => {
          if (!data) {
            console.warn(`le-icon: Layer icon "${config.name}" not found.`);
          }
          return { config, data };
        }),
      );
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
    this._resolvedViewBox = resolvedViewBox;

    await Promise.all(promises);
  }

  private intersectionObserver?: IntersectionObserver;

  /** Resolved badge position (from explicit prop, registry, or config default). */
  private _resolvedBadgePosition?: string;

  /** Resolved badge scale (from explicit prop, registry, or config default). */
  private _resolvedBadgeScale?: number;

  /** Resolved viewBox (from explicit prop, registry, config default, or first layer). */
  private _resolvedViewBox?: string;

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
   * Creates a JSX element from a JSON node descriptor.
   */
  private createElement(node: any) {
    const { tag, children, ...attrs } = node;
    return h(tag, attrs, children ? children.map((child: any) => this.createElement(child)) : null);
  }

  /**
   * Renders the SVG content out of a JSON data in a format:
   * { "viewBox": "...", children: [{ "tag": "g", ""children": [ ... ], ...attrs }, ...] }
   *
   * @returns JSX.Element | null
   */
  private renderSVGContent(children?: any[]): any[] {
    if (!children || children.length === 0) {
      return [];
    }

    return children.map(child => this.createElement(child));
  }

  /**
   * Checks whether this icon has any overlay layers (badge or layers prop).
   */
  private hasOverlays(): boolean {
    return !!(this.badgeData || this.layersData.length > 0);
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
        },
        data: this.badgeData,
      });
    }

    return overlays;
  }

  /**
   * Renders the composed SVG with mask-based knockout for overlapping layers.
   */
  private renderComposed() {
    const parentViewBox = this.resolveViewBox();
    const parentVB = parseViewBox(parentViewBox);
    const overlays = this.getOverlayLayers();

    // Pre-compute positions and transforms for each overlay
    const overlayInfo = overlays.map(layer => {
      const layerVB = parseViewBox(layer.data.viewBox || '0 0 16 16');
      const scale = layer.config.scale ?? 1;
      const pos = parsePosition(
        layer.config.position || getDefaultBadgePosition(),
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
        if (info.layer.data.maskShape) {
          maskShapes.push(
            h('g', { transform: info.transform }, [
              this.createElement(info.layer.data.maskShape),
            ]),
          );
        }
      }

      if (maskShapes.length > 0) {
        masks.push(
          h('mask', { id: `m${i}` }, [
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

    // Determine mask IDs for each rendered group
    // Base icon uses mask that contains ALL overlay knockout shapes (mask index 0)
    // Layer[i] uses mask that contains knockout shapes from layers[i+1..N] (mask index i+1)
    // Topmost layer gets no mask

    const hasMaskForBase = masks.length > 0;

    // Render base icon
    const baseContent = this.renderSVGContent(this.iconData?.children);
    const baseGroup = hasMaskForBase
      ? h('g', { mask: 'url(#m0)' }, ...baseContent)
      : baseContent;

    // Render overlay layers
    const overlayGroups = overlayInfo.map((info, i) => {
      const maskIndex = i + 1;
      const hasMask = maskIndex < masks.length;

      const layerContent = h(
        'g',
        { transform: info.transform },
        ...this.renderSVGContent(info.layer.data.children),
      );

      return hasMask
        ? h('g', { mask: `url(#m${maskIndex})` }, [layerContent])
        : layerContent;
    });

    return [
      masks.length > 0 ? h('defs', {}, masks) : null,
      baseGroup,
      ...overlayGroups,
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

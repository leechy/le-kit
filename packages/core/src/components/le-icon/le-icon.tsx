/**
 * Based on the script from Paul Andreson's article:
 * https://paulcpederson.com/articles/stencil-icons/
 */
import { Build, Component, Element, getAssetPath, h, Prop, State, Watch } from '@stencil/core';
import { getAssetBasePath } from '../../global/app';

const iconCache: Record<string, any> = {};
const requestCache: Record<string, Promise<any>> = {};

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

async function fetchIcon({ name }): Promise<string> {
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

@Component({
  tag: 'le-icon',
  styleUrl: 'le-icon.css',
  shadow: true,
  assetsDirs: ['assets/icons'],
})
export class LeIcon {
  @Element() el: HTMLElement;

  /**
   * Name of the icon to display. Corresponds to a JSON file in the assets folder.
   * For example, "search" will load the "search.json" file.
   */
  @Prop() name: string = null;

  /**
   * Size of the icon in pixels. Default is 16.
   */
  @Prop() size: number = 16;

  @State() private iconData: any = null;

  @State() private visible = false;

  @Watch('name') private async loadIconData(): Promise<void> {
    const { name, visible } = this;

    if (!Build.isBrowser || !name || !visible) {
      return;
    }

    this.iconData = await fetchIcon({ name });
  }

  private intersectionObserver: IntersectionObserver;

  connectedCallback(): void {
    this.waitUntilVisible(() => {
      this.visible = true;
      this.loadIconData();
    });
  }

  disconnectedCallback(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
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
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
            callback();
          }
        });
      },
      { rootMargin: '50px' },
    );

    this.intersectionObserver.observe(this.el);
  }

  /**
   * Renders the SVG content out of a JSON data in a format:
   * { "viewBox": "...", children: [{ "tag": "g", ""children": [ ... ], ...attrs }, ...] }
   *
   * @returns JSX.Element | null
   */
  private renderSVGContent(children?: any[]) {
    if (!children || children.length === 0) {
      return null;
    }

    const createElement = node => {
      const { tag, children, ...attrs } = node;
      return h(tag, attrs, children ? children.map(createElement) : null);
    };

    const svgElements = children.map(createElement);
    return svgElements;
  }

  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        height={this.size || 16}
        width={this.size || 16}
        viewBox={this.iconData?.viewBox || `0 0 ${this.size || 16} ${this.size || 16}`}
      >
        {this.renderSVGContent(this.iconData?.children)}
      </svg>
    );
  }
}

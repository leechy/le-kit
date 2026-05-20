import { Component, h, Host, Method, Prop } from '@stencil/core';
import type { LeCollapseMeta } from '../../types/toolbar';

/**
 * Flexible spacer for le-toolbar layouts.
 *
 * Default behavior (no width): occupies available free space and shrinks naturally.
 * With numeric `width`: behaves as a fixed-width spacer that can be collapsed by le-toolbar.
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-toolbar-spacer',
  styleUrl: 'le-toolbar-spacer.css',
  shadow: true,
})
export class LeToolbarSpacer {
  /**
   * Optional fixed width in pixels.
   * Numeric values (e.g. `24`) are treated as px.
   */
  @Prop() width?: number | string;

  private getFixedWidthPx(): number | undefined {
    if (this.width === undefined || this.width === null || String(this.width).trim() === '') {
      return undefined;
    }

    const parsed = Number(this.width);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;

    return parsed;
  }

  /**
   * Returns collapse meta for toolbar integration.
   */
  @Method()
  async getCollapseMeta(): Promise<LeCollapseMeta> {
    const fixedWidth = this.getFixedWidthPx();
    return {
      kind: 'spacer',
      minWidth: fixedWidth,
      maxWidth: fixedWidth,
    };
  }

  render() {
    const fixedWidth = this.getFixedWidthPx();
    const hostClass = fixedWidth !== undefined ? 'spacer-fixed' : 'spacer-flex';
    const spacerStyle = 
      fixedWidth !== undefined 
        ? { '--le-toolbar-spacer-width': `${fixedWidth}px` } as any
        : undefined;

    return (
      <Host class={hostClass} style={spacerStyle}>
        <span class="spacer" part="spacer" aria-hidden="true"></span>
      </Host>
    );
  }
}

import { Component, h, Host, Prop } from '@stencil/core';

type LeVisibilityState = 'visible' | 'collapsing' | 'collapsed' | 'expanding';

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

  /**
   * Visibility state controlled by responsive containers such as le-toolbar.
   * @allowedValues visible | collapsing | collapsed | expanding
   */
  @Prop({ reflect: true }) visibility: LeVisibilityState = 'visible';

  private getFixedWidthPx(): number | undefined {
    if (this.width === undefined || this.width === null || String(this.width).trim() === '') {
      return undefined;
    }

    const parsed = Number(this.width);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;

    return parsed;
  }

  render() {
    const fixedWidth = this.getFixedWidthPx();

    if (fixedWidth === undefined) {
      return (
        <Host class="spacer-flex">
          <span class="spacer" part="spacer" aria-hidden="true"></span>
        </Host>
      );
    }

    const spacerStyle = {
      width: `${fixedWidth}px`,
      minWidth: `${fixedWidth}px`,
      maxWidth: `${fixedWidth}px`,
    };

    return (
      <Host class="spacer-fixed">
        <le-visibility
          state={
            this.visibility === 'collapsed' || this.visibility === 'collapsing'
              ? 'collapsed'
              : 'visible'
          }
          mode="width"
        >
          <span class="spacer" part="spacer" style={spacerStyle} aria-hidden="true"></span>
        </le-visibility>
      </Host>
    );
  }
}

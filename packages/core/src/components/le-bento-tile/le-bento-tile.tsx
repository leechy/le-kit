import { Component, Prop, h, Host } from '@stencil/core';

/**
 * A single tile for use inside `le-bento-grid`.
 *
 * Declares how many columns and rows it should span in the bento grid.
 * Visual appearance (border-radius, shadow) is controlled via CSS custom
 * properties so themes can override them.
 *
 * @slot - Content displayed inside the tile
 *
 * @cssprop --le-bento-tile-radius - Border radius (default: var(--le-radius-xl, 0.75rem))
 * @cssprop --le-bento-tile-shadow - Box shadow (default: subtle multi-layer shadow)
 * @cssprop --le-bento-tile-bg - Background color (default: transparent)
 * @cssprop --le-bento-tile-padding - Inner padding (default: 0)
 *
 * @csspart tile - The inner tile wrapper element
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-bento-tile',
  styleUrl: 'le-bento-tile.css',
  shadow: true,
})
export class LeBentoTile {
  /**
   * Number of grid columns this tile should span.
   * @min 1
   */
  @Prop() cols: number = 1;

  /**
   * Number of grid rows this tile should span.
   * @min 1
   */
  @Prop() rows: number = 1;

  render() {
    return (
      <Host
        style={{
          gridColumn: `span ${this.cols}`,
          gridRow: `span ${this.rows}`,
        }}
      >
        <div class="bento-tile" part="tile">
          <slot />
        </div>
      </Host>
    );
  }
}

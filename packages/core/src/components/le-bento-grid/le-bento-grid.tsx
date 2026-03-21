import { Component, Prop, h, Host } from '@stencil/core';

/**
 * A responsive bento-style CSS grid container.
 *
 * `le-bento-grid` creates a dense auto-filling grid using `auto-fill` with
 * `minmax()` columns. Pair it with `le-bento-tile` children that declare
 * how many columns and rows they should span.
 *
 * All sizing props can also be controlled purely via CSS custom properties —
 * useful when you want to configure from a stylesheet or a parent component.
 * If a prop is set, it writes the corresponding CSS custom property as an
 * inline style (which overrides any external stylesheet value).
 *
 * @slot - Accepts `le-bento-tile` elements (or any block-level content)
 *
 * @cssprop --le-bento-col-min - Minimum column track width (default 200px)
 * @cssprop --le-bento-col-max - Maximum column track width (default 250px)
 * @cssprop --le-bento-min-columns - Minimum number of columns before overflow
 * @cssprop --le-bento-max-columns - Maximum number of columns before wrapping
 * @cssprop --le-bento-row-height - Height of each row unit (default 110px)
 * @cssprop --le-bento-gap - Gap between tiles (default 12px)
 * @cssprop --le-bento-max-width - Maximum grid container width (default none)
 *
 * @csspart grid - The inner grid wrapper element
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-bento-grid',
  styleUrl: 'le-bento-grid.css',
  shadow: true,
})
export class LeBentoGrid {
  /**
   * Minimum column width in pixels (maps to the `min` of CSS `minmax()`).
   * Controls how narrow a column can be before wrapping.
   * @min 50
   */
  @Prop() columnMinWidth?: number;

  /**
   * Maximum column width in pixels (maps to the `max` of CSS `minmax()`).
   * The grid stops adding columns when dividing `max-width` by this value.
   * @min 50
   */
  @Prop() columnMaxWidth?: number;

  /**
   * Minimum number of columns before overflow.
   * Sets component `min-width` as:
   * `columnMinWidth * minColumns + gap * (minColumns - 1)`.
   * @min 1
   */
  @Prop({ reflect: true }) minColumns?: number;

  /**
   * Maximum number of columns before the grid wraps.
   *
   * When set, this takes precedence over `maxWidth` and computes the grid's
   * effective maximum width as:
   * `maxColumns * columnMaxWidth + (maxColumns - 1) * gap`
   *
   * This is useful when you want an explicit column cap without manually
   * accounting for the gaps between tracks.
   * @min 1
   */
  @Prop({ reflect: true }) maxColumns?: number;

  /**
   * Maximum overall width of the grid in pixels.
    * Ignored when `maxColumns` is set.
   * @min 100
   */
  @Prop() maxWidth?: number;

  /**
   * Height of each row unit in pixels.
   * A tile with `rows="2"` will be `2 × rowHeight + gap` tall.
   * @min 20
   */
  @Prop() rowHeight?: number;

  /**
   * Gap between tiles in pixels.
   * @min 0
   */
  @Prop() gap?: number;

  render() {
    const style: Record<string, string> = {};
    const slotStyle = [
      'display: grid',
      'grid-auto-flow: dense',
      'grid-template-columns: repeat(auto-fill, minmax(var(--le-bento-col-min, 200px), var(--le-bento-col-max, 250px)))',
      'grid-auto-rows: var(--le-bento-row-height, 110px)',
      'gap: var(--le-bento-gap, 12px)',
      'width: 100%',
    ].join('; ');

    if (this.columnMinWidth !== undefined) style['--le-bento-col-min'] = `${this.columnMinWidth}px`;
    if (this.columnMaxWidth !== undefined) style['--le-bento-col-max'] = `${this.columnMaxWidth}px`;
    if (this.minColumns !== undefined) style['--le-bento-min-columns'] = `${this.minColumns}`;
    if (this.maxColumns !== undefined) style['--le-bento-max-columns'] = `${this.maxColumns}`;
    if (this.maxWidth !== undefined) style['--le-bento-max-width'] = `${this.maxWidth}px`;
    if (this.rowHeight !== undefined) style['--le-bento-row-height'] = `${this.rowHeight}px`;
    if (this.gap !== undefined) style['--le-bento-gap'] = `${this.gap}px`;

    return (
      <Host style={style}>
        <le-component component="le-bento-grid">
          <div class="bento-grid" part="grid">
            <le-slot
              name=""
              description="Bento tiles"
              type="slot"
              allowed-components="le-bento-tile,le-card,le-box,le-button,le-stack,le-text"
              slotStyle={slotStyle}
            >
              <slot />
            </le-slot>
          </div>
        </le-component>
      </Host>
    );
  }
}

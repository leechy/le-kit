import { Component, Prop, h, Element } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible stack layout component using CSS flexbox.
 *
 * `le-stack` arranges its children in a row (horizontal) or column (vertical)
 * with configurable spacing, alignment, and wrapping behavior. Perfect for
 * creating responsive layouts.
 *
 * @slot - Default slot for stack items (le-box components recommended)
 *
 * @cssprop --le-stack-gap - Gap between items (defaults to var(--le-space-md))
 *
 * @csspart stack - The main stack container
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-stack',
  styleUrl: 'le-stack.default.css',
  shadow: true,
})
export class LeStack {
  @Element() el: HTMLElement;

  /**
   * Direction of the stack layout
   * @allowedValues horizontal | vertical
   */
  @Prop() direction: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Gap between items (CSS value like '8px', '1rem', 'var(--le-space-md)')
   */
  @Prop() gap?: string;

  /**
   * Alignment of items on the cross axis
   * @allowedValues start | center | end | stretch | baseline
   */
  @Prop() align: 'start' | 'center' | 'end' | 'stretch' | 'baseline' = 'stretch';

  /**
   * Distribution of items on the main axis
   * @allowedValues start | center | end | space-between | space-around | space-evenly
   */
  @Prop() justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' = 'start';

  /**
   * Whether items should wrap to multiple lines
   */
  @Prop() wrap: boolean = false;

  /**
   * Alignment of wrapped lines (only applies when wrap is true)
   * @allowedValues start | center | end | stretch | space-between | space-around
   */
  @Prop() alignContent: 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' = 'stretch';

  /**
   * Whether to reverse the order of items
   */
  @Prop() reverse: boolean = false;

  /**
   * Maximum number of items allowed in the stack (for CMS validation)
   * @min 1
   */
  @Prop() maxItems?: number;

  /**
   * Whether the stack should take full width of its container
   */
  @Prop() fullWidth: boolean = false;

  /**
   * Whether the stack should take full height of its container
   */
  @Prop() fullHeight: boolean = false;

  /**
   * Padding inside the stack container (CSS value)
   */
  @Prop() padding?: string;

  private getFlexDirection(): string {
    const base = this.direction === 'vertical' ? 'column' : 'row';
    return this.reverse ? `${base}-reverse` : base;
  }

  private getAlignItems(): string {
    const alignMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
      baseline: 'baseline',
    };
    return alignMap[this.align] || 'stretch';
  }

  private getJustifyContent(): string {
    const justifyMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      'space-between': 'space-between',
      'space-around': 'space-around',
      'space-evenly': 'space-evenly',
    };
    return justifyMap[this.justify] || 'flex-start';
  }

  private getAlignContent(): string {
    const alignContentMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
      'space-between': 'space-between',
      'space-around': 'space-around',
    };
    return alignContentMap[this.alignContent] || 'stretch';
  }

  render() {
    const style: { [key: string]: string } = {
      display: 'flex',
      flexDirection: this.getFlexDirection(),
      alignItems: this.getAlignItems(),
      justifyContent: this.getJustifyContent(),
      flexWrap: this.wrap ? 'wrap' : 'nowrap',
    };

    if (this.wrap) {
      style.alignContent = this.getAlignContent();
    }

    if (this.gap) {
      style.gap = this.gap;
    }

    if (this.padding) {
      style.padding = this.padding;
    }

    if (this.fullWidth) {
      style.width = '100%';
    }

    if (this.fullHeight) {
      style.height = '100%';
    }

    const hostClass = classnames(
      `direction-${this.direction}`,
      {
        'wrap': this.wrap,
        'reverse': this.reverse,
        'full-width': this.fullWidth,
        'full-height': this.fullHeight,
      }
    );

    return (
      <le-component component="le-stack" hostClass={hostClass}>
        <div class="stack" part="stack" style={style}>
          <le-slot
            name=""
            label="Stack Items"
            description={`Items arranged ${this.direction}ly${this.maxItems ? ` (max ${this.maxItems})` : ''}`}
            type="slot"
            allowed-components="le-box,le-card,le-button,le-stack"
          >
            <slot></slot>
          </le-slot>
        </div>
      </le-component>
    );
  }
}

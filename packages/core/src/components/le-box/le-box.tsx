import { Component, Prop, h, Element, Host } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible box component for use as a flex item within le-stack.
 *
 * `le-box` wraps content and provides flex item properties like grow, shrink,
 * basis, and self-alignment. It can also control its internal content alignment.
 *
 * @slot - Default slot for box content
 *
 * @cssprop --le-box-bg - Background color
 * @cssprop --le-box-padding - Padding inside the box
 * @cssprop --le-box-border-radius - Border radius
 *
 * @csspart box - The main box container
 * @csspart content - The inner content wrapper
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-box',
  styleUrl: 'le-box.css',
  shadow: true,
})
export class LeBox {
  @Element() el: HTMLElement;

  /**
   * Flex grow factor - how much the item should grow relative to siblings
   * @min 0
   */
  @Prop() grow: number = 0;

  /**
   * Flex shrink factor - how much the item should shrink relative to siblings
   * @min 0
   */
  @Prop() shrink: number = 1;

  /**
   * Flex basis - initial size before growing/shrinking (e.g., '200px', '25%', 'auto')
   */
  @Prop() basis: string = 'auto';

  /**
   * Width of the box (CSS value like '100px', '50%', 'auto')
   */
  @Prop() width?: string;

  /**
   * Height of the box (CSS value)
   */
  @Prop() height?: string;

  /**
   * Minimum width constraint
   */
  @Prop() minWidth?: string;

  /**
   * Maximum width constraint
   */
  @Prop() maxWidth?: string;

  /**
   * Minimum height constraint
   */
  @Prop() minHeight?: string;

  /**
   * Maximum height constraint
   */
  @Prop() maxHeight?: string;

  /**
   * Background color or CSS value (e.g., '#f0f0f0', 'var(--le-color-primary-light)')
   */
  @Prop() background?: string;

  /**
   * Border radius (e.g., '8px', 'var(--le-radius-md)')
   */
  @Prop() borderRadius?: string;

  /**
   * Border style (e.g., '1px solid #ccc', '2px dashed var(--le-color-border)')
   */
  @Prop() border?: string;

  /**
   * Self-alignment override for this item on the cross axis
   * @allowedValues auto | start | center | end | stretch | baseline
   */
  @Prop() alignSelf: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline' = 'auto';

  /**
   * Internal horizontal alignment of content
   * @allowedValues start | center | end | stretch
   */
  @Prop() alignContent: 'start' | 'center' | 'end' | 'stretch' = 'stretch';

  /**
   * Internal vertical alignment of content
   * @allowedValues start | center | end | stretch
   */
  @Prop() justifyContent: 'start' | 'center' | 'end' | 'stretch' = 'start';

  /**
   * Padding inside the box (CSS value like '8px', '1rem')
   */
  @Prop() padding?: string;

  /**
   * Order in the flex container (lower values come first)
   */
  @Prop() order?: number;

  /**
   * Whether to display box content as flex (for internal alignment)
   */
  @Prop() displayFlex: boolean = false;

  /**
   * Direction of internal flex layout when displayFlex is true
   * @allowedValues horizontal | vertical
   */
  @Prop() innerDirection: 'horizontal' | 'vertical' = 'vertical';

  /**
   * Gap between internal flex items when displayFlex is true
   */
  @Prop() innerGap?: string;

  private getAlignSelf(): string {
    const alignMap: Record<string, string> = {
      auto: 'auto',
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
      baseline: 'baseline',
    };
    return alignMap[this.alignSelf] || 'auto';
  }

  private getContentAlign(): string {
    const alignMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return alignMap[this.alignContent] || 'stretch';
  }

  private getContentJustify(): string {
    const justifyMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return justifyMap[this.justifyContent] || 'flex-start';
  }

  render() {
    // Host styles for flex item behavior
    const hostStyle: { [key: string]: string } = {
      flexGrow: String(this.grow),
      flexShrink: String(this.shrink),
      flexBasis: this.basis,
      alignSelf: this.getAlignSelf(),
    };

    if (this.width) hostStyle.width = this.width;
    if (this.height) hostStyle.height = this.height;
    if (this.minWidth) hostStyle.minWidth = this.minWidth;
    if (this.maxWidth) hostStyle.maxWidth = this.maxWidth;
    if (this.minHeight) hostStyle.minHeight = this.minHeight;
    if (this.maxHeight) hostStyle.maxHeight = this.maxHeight;
    if (this.order !== undefined) hostStyle.order = String(this.order);

    // Inner content styles
    const contentStyle: { [key: string]: string } = {};

    if (this.padding) {
      contentStyle.padding = this.padding;
    }
    if (this.background) {
      contentStyle.background = this.background;
    }
    if (this.borderRadius) {
      contentStyle.borderRadius = this.borderRadius;
    }
    if (this.border) {
      contentStyle.border = this.border;
    }

    if (this.displayFlex) {
      contentStyle.display = 'flex';
      contentStyle.flexDirection = this.innerDirection === 'vertical' ? 'column' : 'row';
      contentStyle.alignItems = this.getContentAlign();
      contentStyle.justifyContent = this.getContentJustify();
      if (this.innerGap) {
        contentStyle.gap = this.innerGap;
      }
    }

    const hostClass = classnames({
      'has-grow': this.grow > 0,
      'display-flex': this.displayFlex,
      [`inner-${this.innerDirection}`]: this.displayFlex,
    });

    return (
      <Host style={hostStyle} class={hostClass}>
        <le-component component="le-box">
          <div class="box" part="box">
            <div class="content" part="content" style={contentStyle}>
              <le-slot
                name=""
                description="Content inside this flex item"
                type="slot"
                allowed-components="le-text,le-card,le-button,le-stack,le-box"
              >
                <slot></slot>
              </le-slot>
            </div>
          </div>
        </le-component>
      </Host>
    );
  }
}

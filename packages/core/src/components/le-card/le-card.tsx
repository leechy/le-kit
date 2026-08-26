import { Component, Prop, h, Element, Host } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible card component with header, content, and footer slots.
 *
 * The card uses le-slot wrappers for each slot area. In admin mode,
 * le-slot shows placeholders for CMS editing. In default mode,
 * le-slot acts as a transparent passthrough.
 *
 * @slot header - Card header content (title, actions)
 * @slot - Default slot for main card content
 * @slot footer - Card footer content (buttons, links)
 *
 * @cssprop --le-card-bg - Card background color
 * @cssprop --le-card-border-radius - Card border radius
 * @cssprop --le-card-shadow - Card box shadow
 * @cssprop --le-card-padding - Card content padding
 *
 * @csspart card - The main card container
 * @csspart header - The card header section
 * @csspart content - The card content section
 * @csspart footer - The card footer section
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-card',
  styleUrl: 'le-card.css',
  shadow: true,
})
export class LeCard {
  @Element() el!: HTMLElement;

  /**
   * Card variant style
   * @allowedValues default | outlined | elevated
   */
  @Prop() variant: 'default' | 'outlined' | 'elevated' = 'default';

  /**
   * Whether the card is interactive (clickable)
   */
  @Prop() interactive: boolean = false;

  render() {
    return (
      <Host class={classnames(`variant-${this.variant}`, { interactive: this.interactive })}>
        <div class="card" part="card">
          <div class="card-header" part="header">
            <slot name="header"></slot>
          </div>

          <div class="card-content" part="content">
            <slot></slot>
          </div>

          <div class="card-footer" part="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </Host>
    );
  }
}

import { Component, Prop, h, Host, Element } from '@stencil/core';

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
  styleUrl: 'le-card.default.css',
  shadow: true,
})
export class LeCard {
  @Element() el: HTMLElement;

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
      <Host
        class={{
          [`variant-${this.variant}`]: true,
          interactive: this.interactive,
        }}
      >
        <div class="card" part="card">
          <div class="card-header" part="header">
            <le-slot name="header" label="Header" description="Card title and header actions" allowed-components="le-text,le-heading,le-button">
              <slot name="header"></slot>
            </le-slot>
          </div>

          <div class="card-content" part="content">
            <le-slot name="" label="Content" description="Main card content" required>
              <slot></slot>
            </le-slot>
          </div>

          <div class="card-footer" part="footer">
            <le-slot name="footer" label="Footer" description="Card footer with actions" allowed-components="le-button,le-link">
              <slot name="footer"></slot>
            </le-slot>
          </div>
        </div>
      </Host>
    );
  }
}

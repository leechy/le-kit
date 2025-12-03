import { Component, Prop, h, Host, Element } from '@stencil/core';
import { getMode } from '../../global/app';

/**
 * A flexible card component with header, content, and footer slots.
 *
 * The card adapts its appearance based on the current mode:
 * - `default`: Normal card display
 * - `admin`: Shows slot placeholders for CMS editing
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
  styleUrls: {
    default: 'le-card.default.css',
    admin: 'le-card.admin.css',
  },
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

  private isAdminMode(): boolean {
    return getMode(this.el) === 'admin';
  }

  render() {
    const adminMode = this.isAdminMode();

    return (
      <Host
        class={{
          [`variant-${this.variant}`]: true,
          interactive: this.interactive,
        }}
      >
        <div class="card" part="card">
          <div class="card-header" part="header">
            {adminMode ? (
              <le-slot name="header" label="Header" description="Card title and header actions" allowed-components="le-text,le-heading,le-button">
                <slot name="header"></slot>
              </le-slot>
            ) : (
              <slot name="header"></slot>
            )}
          </div>

          <div class="card-content" part="content">
            {adminMode ? (
              <le-slot name="" label="Content" description="Main card content" required>
                <slot></slot>
              </le-slot>
            ) : (
              <slot></slot>
            )}
          </div>

          <div class="card-footer" part="footer">
            {adminMode ? (
              <le-slot name="footer" label="Footer" description="Card footer with actions" allowed-components="le-button,le-link">
                <slot name="footer"></slot>
              </le-slot>
            ) : (
              <slot name="footer"></slot>
            )}
          </div>
        </div>
      </Host>
    );
  }
}

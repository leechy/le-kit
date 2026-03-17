import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

/**
 * A tag/chip component for displaying labels with optional dismiss functionality.
 *
 * @cmsEditable false
 * @cmsCategory Form
 *
 * @slot - Default slot for custom content (overrides label prop)
 *
 * @example Basic tag
 * ```html
 * <le-tag label="JavaScript"></le-tag>
 * ```
 *
 * @example Dismissible tag
 * ```html
 * <le-tag label="Remove me" dismissible></le-tag>
 * ```
 *
 * @example With icon
 * ```html
 * <le-tag label="Settings" icon="⚙️"></le-tag>
 * ```
 *
 * @example Different sizes
 * ```html
 * <le-tag label="Small" size="small"></le-tag>
 * <le-tag label="Medium" size="medium"></le-tag>
 * <le-tag label="Large" size="large"></le-tag>
 * ```
 *
 * @example Different variants
 * ```html
 * <le-tag label="Default" variant="default"></le-tag>
 * <le-tag label="Primary" variant="primary"></le-tag>
 * <le-tag label="Success" variant="success"></le-tag>
 * <le-tag label="Warning" variant="warning"></le-tag>
 * <le-tag label="Danger" variant="danger"></le-tag>
 * ```
 */
@Component({
  tag: 'le-tag',
  styleUrl: 'le-tag.css',
  shadow: true,
})
export class LeTag {
  /**
   * The text label to display in the tag.
   */
  @Prop() label: string;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode: 'default' | 'admin';

  /**
   * Icon to display before the label.
   * Can be an emoji, URL, or icon name.
   */
  @Prop() icon?: string;

  /**
   * Whether the tag can be dismissed (shows close button).
   */
  @Prop() dismissible: boolean = false;

  /**
   * Whether the tag is disabled.
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * The size of the tag.
   */
  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * The visual variant of the tag.
   */
  @Prop({ reflect: true }) variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';

  /**
   * Emitted when the dismiss button is clicked.
   */
  @Event() leDismiss: EventEmitter<void>;

  private handleDismiss = (e: MouseEvent) => {
    e.stopPropagation();
    if (!this.disabled) {
      this.leDismiss.emit();
    }
  };

  private renderIcon() {
    if (!this.icon) return null;

    // Check if it's a URL (starts with http, https, or /)
    if (this.icon.startsWith('http') || this.icon.startsWith('/')) {
      return <img class="tag-icon" src={this.icon} alt="" />;
    }

    // Otherwise render as text (emoji or icon font)
    return <span class="tag-icon">{this.icon}</span>;
  }

  render() {
    return (
      <le-component component="le-tag">
        <span class="tag">
          {this.renderIcon()}
          <span class="tag-label">
            <le-slot name="" tag="span" type="text">
              <slot>{this.label}</slot>
            </le-slot>
          </span>
          {this.dismissible && (
            <button type="button" class="tag-dismiss" onClick={this.handleDismiss} disabled={this.disabled} aria-label="Remove">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </span>
      </le-component>
    );
  }
}

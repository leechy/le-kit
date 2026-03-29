import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';
import { classnames } from '../../utils/utils';

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
 * @example Different colors
 * ```html
 * <le-tag label="Default" color="default"></le-tag>
 * <le-tag label="Primary" color="primary"></le-tag>
 * <le-tag label="Success" color="success"></le-tag>
 * <le-tag label="Warning" color="warning"></le-tag>
 * <le-tag label="Danger" color="danger"></le-tag>
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
  @Prop() label?: string;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode?: 'default' | 'admin';

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
   * The color of the tag.
   */
  @Prop({ reflect: true }) color:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'secondary'
    | 'info' = 'default';

  /**
   * Emitted when the dismiss button is clicked.
   */
  @Event() leDismiss?: EventEmitter<void>;

  private handleDismiss = (e: Event) => {
    e.stopPropagation();
    if (!this.disabled) {
      this.leDismiss?.emit();
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
        <span
          class={classnames('tag', {
            'tag-dismissible': this.dismissible,
          })}
        >
          {this.renderIcon()}
          <span class="tag-label">
            <le-slot name="" tag="span" type="text">
              <slot>{this.label}</slot>
            </le-slot>
          </span>
          {this.dismissible && (
            <le-button
              type="button"
              variant="clear"
              class="tag-dismiss"
              onClick={this.handleDismiss}
              disabled={this.disabled}
              aria-label="Remove"
              color={this.color !== 'default' ? this.color : 'transparent'}
            >
              <le-icon
                slot="icon-only"
                name="clear"
                size={this.size === 'small' ? 12 : this.size === 'large' ? 16 : 14}
              ></le-icon>
            </le-button>
          )}
        </span>
      </le-component>
    );
  }
}

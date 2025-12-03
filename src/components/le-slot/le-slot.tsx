import { Component, Prop, h, Host, Element } from '@stencil/core';

/**
 * Slot placeholder component for admin/CMS mode.
 *
 * This component renders a visual placeholder for slots when in admin mode,
 * allowing CMS systems to show available drop zones for content.
 *
 * In non-admin mode, this component renders nothing and acts as a passthrough.
 *
 * @slot - Default slot for placeholder content or drop zone UI
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-slot',
  styleUrls: {
    default: 'le-slot.default.css',
    admin: 'le-slot.admin.css',
  },
  shadow: true,
})
export class LeSlot {
  @Element() el: HTMLElement;

  /**
   * The name of the slot this placeholder represents.
   * Should match the slot name in the parent component.
   */
  @Prop() name: string = '';

  /**
   * Label to display in admin mode.
   * If not provided, the slot name will be used.
   */
  @Prop() label?: string;

  /**
   * Description of what content this slot accepts.
   * Shown in admin mode to guide content editors.
   */
  @Prop() description?: string;

  /**
   * Comma-separated list of allowed component tags for this slot.
   * Used by CMS to filter available components.
   *
   * @example "le-card,le-button,le-text"
   */
  @Prop() allowedComponents?: string;

  /**
   * Whether multiple components can be dropped in this slot.
   */
  @Prop() multiple: boolean = true;

  /**
   * Whether this slot is required to have content.
   */
  @Prop() required: boolean = false;

  render() {
    const displayLabel = this.label || this.name || 'default';

    return (
      <Host
        role="region"
        aria-label={`Slot: ${displayLabel}`}
        data-slot-name={this.name}
        data-allowed={this.allowedComponents}
        data-multiple={this.multiple}
        data-required={this.required}
      >
        <div class="le-slot-container">
          <div class="le-slot-header">
            <span class="le-slot-label">{displayLabel}</span>
            {this.required && <span class="le-slot-required">*</span>}
          </div>
          {this.description && <div class="le-slot-description">{this.description}</div>}
          <div class="le-slot-dropzone">
            <slot></slot>
          </div>
        </div>
      </Host>
    );
  }
}

import { Component, Prop, State, h, Host, Element, Event, EventEmitter } from '@stencil/core';
import { observeModeChanges } from '../../utils/utils';

/**
 * Slot placeholder component for admin/CMS mode.
 *
 * This component renders a visual placeholder for slots when in admin mode,
 * allowing CMS systems to show available drop zones for content or inline editing.
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
   * The type of slot content.
   * - `slot`: Default, shows a dropzone for components (default)
   * - `text`: Shows a single-line text input
   * - `textarea`: Shows a multi-line text area
   */
  @Prop() type: 'slot' | 'text' | 'textarea' = 'slot';

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

  /**
   * Placeholder text for text/textarea inputs in admin mode.
   */
  @Prop() placeholder?: string;

  /**
   * Internal state to track admin mode
   */
  @State() private adminMode: boolean = false;

  /**
   * Internal state for text input value (synced from slot content)
   */
  @State() private textValue: string = '';

  /**
   * Emitted when text content changes in admin mode.
   * The event detail contains the new text value.
   */
  @Event() leSlotChange: EventEmitter<{ name: string; value: string }>;

  private disconnectModeObserver?: () => void;

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, (mode) => {
      this.adminMode = mode === 'admin';
    });

    // Initialize text value from slot content
    if (this.type === 'text' || this.type === 'textarea') {
      this.textValue = this.el.textContent?.trim() || '';
    }
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
  }

  private handleTextInput = (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.textValue = target.value;
    this.leSlotChange.emit({ name: this.name, value: this.textValue });
  };

  render() {
    const displayLabel = this.label || this.name || 'default';

    // In non-admin mode, just render the slot passthrough
    if (!this.adminMode) {
      return (
        <Host>
          <slot></slot>
        </Host>
      );
    }

    // In admin mode, render based on type
    return (
      <Host
        role="region"
        aria-label={`Slot: ${displayLabel}`}
        data-slot-name={this.name}
        data-slot-type={this.type}
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
          {this.renderContent()}
        </div>
      </Host>
    );
  }

  private renderContent() {
    switch (this.type) {
      case 'text':
        return (
          <div class="le-slot-input">
            <input
              type="text"
              value={this.textValue}
              placeholder={this.placeholder || `Enter ${this.label || this.name || 'text'}...`}
              onInput={this.handleTextInput}
              required={this.required}
            />
            <slot></slot>
          </div>
        );

      case 'textarea':
        return (
          <div class="le-slot-input">
            <textarea
              value={this.textValue}
              placeholder={this.placeholder || `Enter ${this.label || this.name || 'text'}...`}
              onInput={this.handleTextInput}
              required={this.required}
              rows={3}
            ></textarea>
            <slot></slot>
          </div>
        );

      case 'slot':
      default:
        return (
          <div class="le-slot-dropzone">
            <slot></slot>
          </div>
        );
    }
  }
}

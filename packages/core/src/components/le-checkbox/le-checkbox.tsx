import { Component, Prop, Event, EventEmitter, h, Element } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A checkbox component with support for labels, descriptions, and external IDs.
 *
 * @slot - The label text for the checkbox
 * @slot description - Additional description text displayed below the label
 *
 * @cssprop --le-checkbox-size - Size of the checkbox input
 * @cssprop --le-checkbox-color - Color of the checkbox when checked
 * @cssprop --le-checkbox-label-color - Color of the label text
 * @cssprop --le-checkbox-desc-color - Color of the description text
 */
@Component({
  tag: 'le-checkbox',
  styleUrl: 'le-checkbox.css',
  shadow: true,
})
export class LeCheckbox {
  @Element() el: HTMLElement;

  /**
   * Whether the checkbox is checked
   */
  @Prop({ mutable: true, reflect: true }) checked: boolean = false;

  /**
   * Whether the checkbox is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * The name of the checkbox input
   */
  @Prop() name: string;

  /**
   * The value of the checkbox input
   */
  @Prop() value: string;

  /**
   * External ID for linking with external systems (e.g. database ID, PDF form field ID)
   */
  @Prop() externalId: string;

  /**
   * Emitted when the checked state changes
   */
  @Event({ eventName: 'change' }) leChange: EventEmitter<{ checked: boolean; value: string; name: string; externalId: string }>;

  private handleChange = (event: Event) => {
    // We stop the internal button click from bubbling up
    event.stopPropagation();

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.leChange.emit({
      checked: this.checked,
      value: this.value,
      name: this.name,
      externalId: this.externalId
    });
  };

  render() {
    return (
      <le-component component="le-checkbox" hostClass={classnames({ 'disabled': this.disabled })}>
        <div class="le-checkbox-wrapper">
          <label class="le-checkbox-label">
            <span class="le-checkbox-input">
              <input
                type="checkbox"
                name={this.name}
                value={this.value}
                checked={this.checked}
                disabled={this.disabled}
                onChange={this.handleChange}
              />
            </span>
            <span class="le-checkbox-text">
              <le-slot name="" type="text" tag="span">
                <slot></slot>
              </le-slot>
            </span>
          </label>
          
          <div class="le-checkbox-description">
            <le-slot name="description" type="text" tag="div" label="Description">
              <slot name="description"></slot>
            </le-slot>
          </div>
        </div>
      </le-component>
    );
  }
}

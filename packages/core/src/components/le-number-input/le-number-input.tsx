import { Component, Prop, Event, EventEmitter, State, h, Element, Watch } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A number input component with validation, keyboard controls, and custom spinners.
 *
 * @slot - The label text for the input
 * @slot description - Additional description text displayed below the input
 * @slot icon-start - Icon to display at the start of the input
 *
 * @cssprop --le-input-bg - Input background color
 * @cssprop --le-input-color - Input text color
 * @cssprop --le-input-border - Input border style
 * @cssprop --le-input-border-focus - Input border style when focused
 * @cssprop --le-input-border-error - Input border style when invalid
 * @cssprop --le-input-radius - Input border radius
 * @cssprop --le-input-padding - Input padding
 */
@Component({
  tag: 'le-number-input',
  styleUrl: 'le-number-input.css',
  shadow: true,
})
export class LeNumberInput {
  @Element() el: HTMLElement;

  /**
   * The value of the input
   */
  @Prop({ mutable: true, reflect: true }) value: number;

  /**
   * The name of the input
   */
  @Prop() name: string;

  /**
   * Label for the input
   */
  @Prop() label: string;

  /**
   * Placeholder text
   */
  @Prop() placeholder: string;

  /**
   * Minimum allowed value
   */
  @Prop() min?: number;

  /**
   * Maximum allowed value
   */
  @Prop() max?: number;

  /**
   * Step value for increment/decrement
   */
  @Prop() step: number = 1;

  /**
   * Whether the input is required
   */
  @Prop() required: boolean = false;

  /**
   * Whether the input is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * Whether the input is read-only
   */
  @Prop() readonly: boolean = false;

  /**
   * Icon for the start icon
   */
  @Prop() iconStart?: string;

  /**
   * Whether to show the spinner controls
   */
  @Prop() showSpinners: boolean = true;

  /**
   * External ID for linking with external systems
   */
  @Prop() externalId: string;

  /**
   * Internal validation state
   */
  @State() private isValid: boolean = true;
  @State() private validationMessage: string = '';

  /**
   * Emitted when the value changes (on blur or Enter)
   */
  @Event() leChange: EventEmitter<{ value: number; name: string; externalId: string; isValid: boolean }>;

  /**
   * Emitted when the input value changes (on keystroke/spin)
   */
  @Event() leInput: EventEmitter<{ value: number; name: string; externalId: string; isValid: boolean }>;

  @Watch('value')
  valueChanged() {
    this.validate();
  }

  private validate() {
    if (this.required && (this.value === undefined || this.value === null || isNaN(this.value))) {
      this.isValid = false;
      this.validationMessage = 'This field is required';
      return;
    }

    if (this.value !== undefined && this.value !== null && !isNaN(this.value)) {
      if (this.min !== undefined && this.value < this.min) {
        this.isValid = false;
        this.validationMessage = `Value must be at least ${this.min}`;
        return;
      }
      if (this.max !== undefined && this.value > this.max) {
        this.isValid = false;
        this.validationMessage = `Value must be at most ${this.max}`;
        return;
      }
    }

    this.isValid = true;
    this.validationMessage = '';
  }

  private emitChange() {
    this.leChange.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
      isValid: this.isValid
    });
  }

  private emitInput() {
    this.leInput.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
      isValid: this.isValid
    });
  }

  private updateValue(newValue: number) {
    if (this.disabled || this.readonly) return;
    
    // Round to avoid floating point errors
    const precision = this.step.toString().split('.')[1]?.length || 0;
    const rounded = parseFloat(newValue.toFixed(precision));
    
    this.value = rounded;
    this.validate();
    this.emitInput();
  }

  private handleInput = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const val = parseFloat(input.value);
    
    if (input.value === '') {
      this.value = undefined;
    } else if (!isNaN(val)) {
      this.value = val;
    }
    
    this.validate();
    this.emitInput();
  };

  private handleChange = () => {
    this.validate();
    this.emitChange();
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled || this.readonly) return;

    let multiplier = 1;
    if (ev.shiftKey) multiplier = 10;
    if (ev.altKey) multiplier = 0.1;

    const current = this.value || 0;

    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.updateValue(current + (this.step * multiplier));
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      this.updateValue(current - (this.step * multiplier));
    }
  };

  private handleWheel = (ev: WheelEvent) => {
    if (this.disabled || this.readonly) return;
    // Only handle if input is focused to prevent accidental scrolling
    if (document.activeElement !== ev.target) return;

    ev.preventDefault();
    const current = this.value || 0;
    
    if (ev.deltaY < 0) {
      this.updateValue(current + this.step);
    } else {
      this.updateValue(current - this.step);
    }
  };

  private increment = (ev: Event) => {
    ev.preventDefault(); // Prevent focus loss
    const current = this.value || 0;
    this.updateValue(current + this.step);
    // Trigger change event for buttons as they are "final" actions usually
    this.emitChange();
  };

  private decrement = (ev: Event) => {
    ev.preventDefault();
    const current = this.value || 0;
    this.updateValue(current - this.step);
    this.emitChange();
  };

  render() {
    return (
      <le-component component="le-number-input" hostClass={classnames({ 'disabled': this.disabled })}>
        <div class="le-input-wrapper">
          {this.label && (
            <label class="le-input-label" htmlFor={this.name}>{this.label}</label>
          )}
          
          <div class={classnames('le-input-container', { 'has-error': !this.isValid })}>
            {this.iconStart && (
              <span class="icon-start">{this.iconStart}</span>
            )}
            
            <input
              id={this.name}
              type="number"
              name={this.name}
              placeholder={this.placeholder}
              min={this.min}
              max={this.max}
              step={this.step}
              value={this.value}
              disabled={this.disabled}
              readOnly={this.readonly}
              required={this.required}
              onInput={this.handleInput}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              onWheel={this.handleWheel}
            />
            
            {this.showSpinners && (
              <div class="le-input-controls">
                <le-button
                  mode="default"
                  variant="clear" 
                  size="small"
                  icon-only
                  class="le-input-control-btn" 
                  onClick={this.increment}
                  disabled={this.disabled || this.readonly || (this.max !== undefined && this.value >= this.max)}
                  tabindex="-1"
                >
                  <span slot="icon-only">↑</span>
                </le-button>
                <le-button
                  mode="default"
                  variant="clear" 
                  size="small" 
                  icon-only 
                  class="le-input-control-btn" 
                  onClick={this.decrement}
                  disabled={this.disabled || this.readonly || (this.min !== undefined && this.value <= this.min)}
                  tabindex="-1"
                >
                  <span slot="icon-only">↓</span>
                </le-button>
              </div>
            )}
          </div>

          {!this.isValid && <div class="le-input-error">{this.validationMessage}</div>}

          <div class="le-input-description">
            <le-slot name="description" type="text" tag="p" label="Description">
              <slot name="description"></slot>
            </le-slot>
          </div>
        </div>
      </le-component>
    );
  }
}

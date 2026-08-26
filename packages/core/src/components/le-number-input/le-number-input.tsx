import { Component, Prop, Event, EventEmitter, State, h, Element, Watch, Host } from '@stencil/core';
import { classnames, observeNamedSlotPresence, slotHasContent } from '../../utils/utils';

/**
 * A number input component with validation, keyboard controls, and custom spinners or steppers.
 *
 * @slot - The label text for the input
 * @slot description - Additional description text displayed below the input
 * @slot icon-start - Icon to display at the start of the input
 * @slot icon-end - Icon to display at the end of the input
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
  @Element() el!: HTMLElement;

  /**
   * The value of the input
   */
  @Prop({ mutable: true, reflect: true }) value?: number;

  /**
   * The name of the input
   */
  @Prop() name?: string;

  /**
   * Label for the input
   */
  @Prop() label?: string;

  /**
   * Placeholder text
   */
  @Prop() placeholder?: string;

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
   * Step value when holding Shift key
   */
  @Prop() shiftStep?: number;

  /**
   * Multiplier for step value when holding Shift key
   */
  @Prop() shiftMultiplier?: number;

  /**
   * Step value when holding Alt/Option key
   */
  @Prop() altStep?: number;

  /**
   * Multiplier for step value when holding Alt/Option key
   */
  @Prop() altMultiplier?: number;

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
   * Icon for the end icon
   */
  @Prop() iconEnd?: string;

  /**
   * Controls type for numerical adjustment ('spinner' | 'stepper' | 'none')
   */
  @Prop() controls: 'spinner' | 'stepper' | 'none' = 'none';

  /**
   * External ID for linking with external systems
   */
  @Prop() externalId?: string;

  /**
   * Internal validation state
   */
  @State() private isValid: boolean = true;
  @State() private validationMessage: string = '';

  @State() private hasIconStartSlot = false;
  @State() private hasIconEndSlot = false;
  private disconnectSlotObserver?: () => void;

  /**
   * Emitted when the value changes (on blur or Enter)
   */
  @Event() leChange?: EventEmitter<{
    value?: number;
    name?: string;
    externalId?: string;
    isValid: boolean;
  }>;

  /**
   * Emitted when the input value changes (on keystroke/spin)
   */
  @Event() leInput?: EventEmitter<{
    value?: number;
    name?: string;
    externalId?: string;
    isValid: boolean;
  }>;

  private initSlotObserver() {
    if (this.disconnectSlotObserver) {
      return;
    }

    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['icon-start', 'icon-end'],
      presence => {
        this.hasIconStartSlot = !!presence['icon-start'];
        this.hasIconEndSlot = !!presence['icon-end'];
      },
    );
  }

  componentWillLoad() {
    this.hasIconStartSlot = slotHasContent(this.el, 'icon-start');
    this.hasIconEndSlot = slotHasContent(this.el, 'icon-end');
    this.initSlotObserver();
  }

  componentDidLoad() {
    this.initSlotObserver();
  }

  private repeatTimeout?: any;
  private repeatInterval?: any;
  private lastPressTime = 0;

  private stopRepeat = () => {
    if (this.repeatTimeout) {
      clearTimeout(this.repeatTimeout);
      this.repeatTimeout = undefined;
    }
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = undefined;
    }
    window.removeEventListener('pointerup', this.stopRepeat);
    window.removeEventListener('pointercancel', this.stopRepeat);
    window.removeEventListener('mouseup', this.stopRepeat);
  };

  private startRepeat = (action: 'inc' | 'dec', ev: UIEvent) => {
    if ('button' in ev && (ev as MouseEvent).button !== 0) return;

    const now = Date.now();
    if (now - this.lastPressTime < 100 && ev.type === 'mousedown') {
      ev.preventDefault();
      return;
    }
    this.lastPressTime = now;

    ev.preventDefault();
    this.stopRepeat();

    if (action === 'inc') {
      this.increment(ev);
    } else {
      this.decrement(ev);
    }

    window.addEventListener('pointerup', this.stopRepeat, { once: true });
    window.addEventListener('pointercancel', this.stopRepeat, { once: true });
    window.addEventListener('mouseup', this.stopRepeat, { once: true });

    this.repeatTimeout = setTimeout(() => {
      this.repeatInterval = setInterval(() => {
        if (action === 'inc') {
          if (this.max !== undefined && this.value !== undefined && this.value >= this.max) {
            this.stopRepeat();
            return;
          }
          this.increment(ev);
        } else {
          if (this.min !== undefined && this.value !== undefined && this.value <= this.min) {
            this.stopRepeat();
            return;
          }
          this.decrement(ev);
        }
      }, 60);
    }, 400);
  };

  disconnectedCallback() {
    this.stopRepeat();
    this.disconnectSlotObserver?.();
  }

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
    this.leChange?.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
      isValid: this.isValid,
    });
  }

  private emitInput() {
    this.leInput?.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
      isValid: this.isValid,
    });
  }

  private getPrecision(num: number): number {
    const str = num.toString();
    if (str.includes('e-')) {
      const parts = str.split('e-');
      return parseInt(parts[1], 10);
    }
    return str.split('.')[1]?.length || 0;
  }

  private getEffectiveStep(ev?: any): number {
    const shiftKey = Boolean(ev?.shiftKey || ev?.detail?.shiftKey);
    const altKey = Boolean(ev?.altKey || ev?.detail?.altKey);

    if (shiftKey) {
      if (this.shiftStep !== undefined) {
        return this.shiftStep;
      }
      if (this.shiftMultiplier !== undefined) {
        return this.step * this.shiftMultiplier;
      }
      return this.step * 10;
    }
    if (altKey) {
      if (this.altStep !== undefined) {
        return this.altStep;
      }
      if (this.altMultiplier !== undefined) {
        return this.step * this.altMultiplier;
      }
      return this.step * 0.1;
    }
    return this.step;
  }

  private updateValue(newValue: number, effectiveStep?: number) {
    if (this.disabled || this.readonly) return;

    const stepToUse = effectiveStep !== undefined ? effectiveStep : this.step;
    // Round to avoid floating point errors while preserving decimal precision
    const precision = Math.max(
      this.getPrecision(this.step),
      this.getPrecision(stepToUse),
      this.getPrecision(this.value || 0)
    );
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

    const current = this.value || 0;
    const effectiveStep = this.getEffectiveStep(ev);

    if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (this.max !== undefined && this.value !== undefined && this.value >= this.max) {
        return;
      }
      const nextVal =
        this.max !== undefined ? Math.min(this.max, current + effectiveStep) : current + effectiveStep;
      this.updateValue(nextVal, effectiveStep);
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (this.min !== undefined && this.value !== undefined && this.value <= this.min) {
        return;
      }
      const nextVal =
        this.min !== undefined ? Math.max(this.min, current - effectiveStep) : current - effectiveStep;
      this.updateValue(nextVal, effectiveStep);
    }
  };

  private handleWheel = (ev: WheelEvent) => {
    if (this.disabled || this.readonly) return;
    // Only handle if input is focused to prevent accidental scrolling
    if (document.activeElement !== ev.target) return;

    ev.preventDefault();
    const current = this.value || 0;
    const effectiveStep = this.getEffectiveStep(ev);

    if (ev.deltaY < 0) {
      if (this.max !== undefined && this.value !== undefined && this.value >= this.max) {
        return;
      }
      const nextVal =
        this.max !== undefined ? Math.min(this.max, current + effectiveStep) : current + effectiveStep;
      this.updateValue(nextVal, effectiveStep);
    } else {
      if (this.min !== undefined && this.value !== undefined && this.value <= this.min) {
        return;
      }
      const nextVal =
        this.min !== undefined ? Math.max(this.min, current - effectiveStep) : current - effectiveStep;
      this.updateValue(nextVal, effectiveStep);
    }
  };

  private handleClick = (action: 'inc' | 'dec', ev: any) => {
    ev.preventDefault();
    if (Date.now() - this.lastPressTime < 300) {
      return;
    }
    if (action === 'inc') {
      this.increment(ev);
    } else {
      this.decrement(ev);
    }
  };

  private increment = (ev: Event) => {
    ev.preventDefault(); // Prevent focus loss
    if (this.max !== undefined && this.value !== undefined && this.value >= this.max) {
      return;
    }
    const current = this.value || 0;
    const effectiveStep = this.getEffectiveStep(ev as MouseEvent);
    const nextVal =
      this.max !== undefined ? Math.min(this.max, current + effectiveStep) : current + effectiveStep;
    this.updateValue(nextVal, effectiveStep);
    // Trigger change event for buttons as they are "final" actions usually
    this.emitChange();
  };

  private decrement = (ev: Event) => {
    ev.preventDefault();
    if (this.min !== undefined && this.value !== undefined && this.value <= this.min) {
      return;
    }
    const current = this.value || 0;
    const effectiveStep = this.getEffectiveStep(ev as MouseEvent);
    const nextVal =
      this.min !== undefined ? Math.max(this.min, current - effectiveStep) : current - effectiveStep;
    this.updateValue(nextVal, effectiveStep);
    this.emitChange();
  };

  private renderIconContent(icon?: string) {
    if (!icon) return null;
    if (Array.from(icon).length <= 2) {
      return icon;
    }
    return <le-icon name={icon}></le-icon>;
  }

  render() {
    const hasIconStart = Boolean(this.iconStart || this.hasIconStartSlot);
    const hasIconEnd = Boolean(this.iconEnd || this.hasIconEndSlot);
    const isStepper = this.controls === 'stepper';
    const isSpinner = this.controls === 'spinner';

    return (
      <Host class={classnames({ disabled: this.disabled })}>
        <div class="le-input-wrapper">
          {this.label && (
            <label class="le-input-label" htmlFor={this.name}>
              {this.label}
            </label>
          )}

          <div
            class={classnames('le-input-container', 'le-control-focus', {
              'has-error': !this.isValid,
              'has-stepper': isStepper,
              'has-spinner': isSpinner,
            })}
          >
            {isStepper && (
              <le-button
                mode="default"
                variant="clear"
                icon-only="minus"
                class="le-stepper-btn stepper-decrement"
                onMouseDown={(ev: any) => this.startRepeat('dec', ev)}
                onPointerDown={(ev: any) => this.startRepeat('dec', ev)}
                onPointerUp={this.stopRepeat}
                onPointerLeave={this.stopRepeat}
                onClick={(ev: any) => this.handleClick('dec', ev)}
                disabled={
                  this.disabled ||
                  this.readonly ||
                  (this.min !== undefined && this.value !== undefined && this.value <= this.min)
                }
                tabindex="-1"
              />
            )}

            <span
              class={classnames('icon-start', { 'is-visible': hasIconStart })}
              part="icon-start"
            >
              <slot name="icon-start">{this.renderIconContent(this.iconStart)}</slot>
            </span>

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
              part="input"
            />

            <span class={classnames('icon-end', { 'is-visible': hasIconEnd })} part="icon-end">
              <slot name="icon-end">{this.renderIconContent(this.iconEnd)}</slot>
            </span>

            {isStepper && (
              <le-button
                mode="default"
                variant="clear"
                icon-only="plus"
                class="le-stepper-btn stepper-increment"
                onMouseDown={(ev: any) => this.startRepeat('inc', ev)}
                onPointerDown={(ev: any) => this.startRepeat('inc', ev)}
                onPointerUp={this.stopRepeat}
                onPointerLeave={this.stopRepeat}
                onClick={(ev: any) => this.handleClick('inc', ev)}
                disabled={
                  this.disabled ||
                  this.readonly ||
                  (this.max !== undefined && this.value !== undefined && this.value >= this.max)
                }
                tabindex="-1"
              />
            )}

            {isSpinner && (
              <div class="le-input-controls">
                <le-button
                  mode="default"
                  variant="clear"
                  size="small"
                  icon-only="chevron-up"
                  class="le-input-control-btn"
                  onMouseDown={(ev: any) => this.startRepeat('inc', ev)}
                  onPointerDown={(ev: any) => this.startRepeat('inc', ev)}
                  onPointerUp={this.stopRepeat}
                  onPointerLeave={this.stopRepeat}
                  onClick={(ev: any) => this.handleClick('inc', ev)}
                  disabled={
                    this.disabled ||
                    this.readonly ||
                    (this.max !== undefined && this.value !== undefined && this.value >= this.max)
                  }
                  tabindex="-1"
                />
                <le-button
                  mode="default"
                  variant="clear"
                  size="small"
                  icon-only="chevron-down"
                  class="le-input-control-btn"
                  onMouseDown={(ev: any) => this.startRepeat('dec', ev)}
                  onPointerDown={(ev: any) => this.startRepeat('dec', ev)}
                  onPointerUp={this.stopRepeat}
                  onPointerLeave={this.stopRepeat}
                  onClick={(ev: any) => this.handleClick('dec', ev)}
                  disabled={
                    this.disabled ||
                    this.readonly ||
                    (this.min !== undefined && this.value !== undefined && this.value <= this.min)
                  }
                  tabindex="-1"
                />
              </div>
            )}
          </div>

          {!this.isValid && <div class="le-input-error">{this.validationMessage}</div>}

          <div class="le-input-description">
            <slot name="description"></slot>
          </div>
        </div>
      </Host>
    );
  }
}

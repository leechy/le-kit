import { Component, Prop, Event, EventEmitter, State, h, Element, Watch } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A one-time code input component with individual frames for each character.
 * Supports standard copy/paste and range selection behaviors.
 *
 * @slot description - Additional description text displayed below the input
 *
 * @cssprop --le-code-box-size - Size of each character box (default: 40px width, 48px height)
 * @cssprop --le-input-bg - Input background color
 * @cssprop --le-input-color - Input text color
 * @cssprop --le-input-border - Input border style
 * @cssprop --le-input-border-focus - Input border style when focused
 * @cssprop --le-input-border-error - Input border style when invalid
 * @cssprop --le-input-radius - Input border radius
 */
@Component({
  tag: 'le-code-input',
  styleUrl: 'le-code-input.css',
  shadow: true,
})
export class LeCodeInput {
  @Element() el: HTMLElement;

  /**
   * The value of the input
   */
  @Prop({ mutable: true, reflect: true }) value: string = '';

  /**
   * The name of the input
   */
  @Prop() name: string;

  /**
   * Label for the input
   */
  @Prop() label: string;

  /**
   * Length of the code (number of characters)
   */
  @Prop() length: number = 6;

  /**
   * Description text displayed below the input
   * in case there is a more complex markup,
   * it can be provided via slot as well
   */
  @Prop() description?: string;

  /**
   * The type of code (numeric or alphanumeric)
   * This affects the keyboard layout on mobile devices.
   */
  @Prop() type: 'text' | 'number' = 'text';

  /**
   * Whether the input is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * Whether the input is read-only
   */
  @Prop() readonly: boolean = false;

  /**
   * External ID for linking with external systems
   */
  @Prop() externalId: string;

  /**
   * Internal validation state (can be set externally manually or via simple check)
   */
  @Prop() error: boolean = false;

  /**
   * Emitted when the value changes (on blur or Enter)
   */
  @Event() leChange: EventEmitter<{ value: string; name: string; externalId: string }>;

  /**
   * Emitted when the input value changes (on keystroke)
   */
  @Event() leInput: EventEmitter<{ value: string; name: string; externalId: string }>;

  /**
   * Emitted when the input is focused
   */
  @Event() leFocus: EventEmitter<void>;

  /**
   * Emitted when the input is blurred
   */
  @Event() leBlur: EventEmitter<void>;

  @State() private isFocused: boolean = false;
  @State() private selectionStart: number = 0;
  @State() private selectionEnd: number = 0;

  @Watch('value')
  valueChanged(newValue: string) {
    if (newValue && newValue.length > this.length) {
      this.value = newValue.slice(0, this.length);
    }
  }

  componentWillLoad() {
    if (this.value && this.value.length > this.length) {
      this.value = this.value.slice(0, this.length);
    }
  }

  private handleInput = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    let val = input.value;

    // Enforce length limit
    if (val.length > this.length) {
      val = val.slice(0, this.length);
      // We need to force update the input value if it exceeded length
      // because Stencil prop update might not happen if value is same as prop but input is different
      input.value = val;
    }

    this.value = val;
    this.updateSelection(input);

    this.leInput.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
    });
  };

  private handleChange = () => {
    this.leChange.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
    });
  };

  private handleFocus = (ev: Event) => {
    this.isFocused = true;
    const input = ev.target as HTMLInputElement;

    // Move cursor to the end on focus so typing appends to current value
    window.requestAnimationFrame(() => {
      const len = input.value.length;
      input.setSelectionRange(len, len);
      this.updateSelection(input);
    });

    this.leFocus.emit();
  };

  private handleBlur = () => {
    this.isFocused = false;
    this.leBlur.emit();
    // Trigger change on blur
    this.handleChange();
  };

  private handleSelect = (ev: Event) => {
    this.updateSelection(ev.target as HTMLInputElement);
  };

  private updateSelection(input: HTMLInputElement) {
    this.selectionStart = input.selectionStart || 0;
    this.selectionEnd = input.selectionEnd || 0;
  }

  /**
   * Helper to determine active index for focus ring
   */
  private getActiveIndex(): number {
    if (!this.isFocused) return -1;

    // If we have a range selection, usually focus ring is not shown or shown around selection?
    // We'll stick to showing it at the cursor end (selectionEnd) or start?
    // If range selected, `selectionStart` is start of range.

    // If cursor is at the very end (pos == length), we highlight the last box
    if (this.selectionStart === this.length && this.length > 0) {
      return this.length - 1;
    }

    return this.selectionStart;
  }

  private renderBoxes() {
    const boxes = [];
    const activeIndex = this.getActiveIndex();
    const isRangeSelection = this.selectionEnd - this.selectionStart > 0;

    for (let i = 0; i < this.length; i++) {
      const char = this.value ? this.value[i] : '';
      const isActive = this.isFocused && !isRangeSelection && i === activeIndex;
      const isSelected =
        this.isFocused && isRangeSelection && i >= this.selectionStart && i < this.selectionEnd;

      boxes.push(
        <div
          class={classnames('code-box', {
            'active': isActive,
            'selected': isSelected,
            'has-value': !!char,
          })}
        >
          {char}
        </div>,
      );
    }
    return boxes;
  }

  render() {
    return (
      <le-component
        component="le-code-input"
        hostClass={classnames({ 'disabled': this.disabled, 'has-error': this.error })}
      >
        <div class="le-code-input-wrapper">
          {this.label && (
            <label class="le-input-label" htmlFor={this.name}>
              {this.label}
            </label>
          )}

          <div class={classnames('input-group', { 'has-error': this.error })}>
            <input
              class="ghost-input"
              id={this.name}
              name={this.name}
              type="text"
              inputMode={this.type === 'number' ? 'numeric' : 'text'}
              pattern={this.type === 'number' ? '[0-9]*' : undefined}
              autocomplete="one-time-code"
              value={this.value}
              maxLength={this.length}
              disabled={this.disabled}
              readOnly={this.readonly}
              onInput={this.handleInput}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              onSelect={this.handleSelect}
              // Prevent browser autofill background from messing up visual
              spellcheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />

            <div class="visual-container">{this.renderBoxes()}</div>
          </div>

          {!this.error && (
            <div class="le-input-description">
              <le-slot name="description" type="text" tag="p" label="Description">
                <slot name="description">{this.description}</slot>
              </le-slot>
            </div>
          )}
        </div>
      </le-component>
    );
  }
}

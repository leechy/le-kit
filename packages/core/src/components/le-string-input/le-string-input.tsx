import { Component, Prop, Event, EventEmitter, h, Element, State } from '@stencil/core';
import { classnames, observeNamedSlotPresence, slotHasContent } from '../../utils/utils';

/**
 * A text input component with support for labels, descriptions, icons, and external IDs.
 *
 * @slot label - The label content for the input
 * @slot description - Additional description text displayed below the input
 * @slot icon-start - Icon to display at the start of the input
 * @slot icon-end - Icon to display at the end of the input
 *
 * @cssprop --le-input-bg - Input background color
 * @cssprop --le-input-color - Input text color
 * @cssprop --le-input-border - Input border style
 * @cssprop --le-input-border-focus - Input border style when focused
 * @cssprop --le-input-radius - Input border radius
 * @cssprop --le-input-padding - Input padding
 */
@Component({
  tag: 'le-string-input',
  styleUrl: 'le-string-input.css',
  shadow: true,
})
export class LeStringInput {
  @Element() el!: HTMLElement;

  @State() private hasLabelSlot: boolean = false;
  @State() private hasIconStartSlot: boolean = false;
  @State() private hasIconEndSlot: boolean = false;
  @State() private hasDescriptionSlot: boolean = false;

  private disconnectSlotObserver?: () => void;
  private inputEl?: HTMLInputElement;

  /**
   * Pass the ref of the input element to the parent component
   */
  @Prop() inputRef?: (el: HTMLInputElement) => void;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode?: 'default' | 'admin';

  /**
   * The value of the input
   */
  @Prop({ mutable: true, reflect: true }) value?: string;

  /**
   * The name of the input
   */
  @Prop() name?: string;

  /**
   * The type of the input (text, email, password, etc.)
   */
  @Prop() type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' = 'text';

  /**
   * Label for the input
   */
  @Prop() label?: string;

  /**
   * Description text displayed below the input
   */
  @Prop() description?: string;

  /**
   * Icon for the start icon
   */
  @Prop() iconStart?: string;

  /**
   * Icon for the end icon
   */
  @Prop() iconEnd?: string;

  /**
   * Placeholder text
   */
  @Prop() placeholder?: string;

  /**
   * Whether the input can be cleared with a built-in clear button
   */
  @Prop() clearable: boolean = false;

  /**
   * Native autocomplete attribute forwarded to the input
   */
  @Prop() autocomplete?: string;

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
  @Prop() externalId?: string;

  /**
   * Emitted when the value changes (on blur or Enter)
   */
  @Event() leChange?: EventEmitter<{
    value?: string;
    name?: string;
    externalId?: string;
  }>;

  /**
   * Emitted when the input value changes (on keystroke)
   */
  @Event() leInput?: EventEmitter<{
    value?: string;
    name?: string;
    externalId?: string;
  }>;

  private handleInput = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    this.value = input.value;
    this.leInput?.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
    });
  };

  private handleChange = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    this.value = input.value;
    this.leChange?.emit({
      value: this.value,
      name: this.name,
      externalId: this.externalId,
    });
  };

  private handleClick = (ev: Event) => {
    ev.stopPropagation();
  };

  private handleClear = () => {
    if (this.disabled || this.readonly || !this.value) {
      return;
    }

    this.value = '';

    if (this.inputEl) {
      this.inputEl.value = '';
      this.inputEl.focus();
    }

    const payload = {
      value: this.value,
      name: this.name,
      externalId: this.externalId,
    };

    this.leInput?.emit(payload);
    this.leChange?.emit(payload);
  };

  private initSlotObserver() {
    if (this.disconnectSlotObserver) {
      return;
    }

    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['label', 'icon-start', 'icon-end', 'description'],
      presence => {
        this.hasLabelSlot = !!presence['label'];
        this.hasIconStartSlot = !!presence['icon-start'];
        this.hasIconEndSlot = !!presence['icon-end'];
        this.hasDescriptionSlot = !!presence['description'];
      },
    );
  }

  componentWillLoad() {
    // Seed slot presence before first render to avoid componentDidLoad state-change warnings.
    this.hasLabelSlot = slotHasContent(this.el, 'label');
    this.hasIconStartSlot = slotHasContent(this.el, 'icon-start');
    this.hasIconEndSlot = slotHasContent(this.el, 'icon-end');
    this.hasDescriptionSlot = slotHasContent(this.el, 'description');

    // Start observing as early as possible.
    this.initSlotObserver();
  }

  componentDidLoad() {
    // Fallback in case shadow DOM was not ready during componentWillLoad.
    this.initSlotObserver();
  }

  disconnectedCallback() {
    this.disconnectSlotObserver?.();
  }

  render() {
    const hasLabel = this.label !== undefined || this.hasLabelSlot;
    const hasIconStart = this.iconStart !== undefined || this.hasIconStartSlot;
    const hasIconEnd = this.iconEnd !== undefined || this.hasIconEndSlot;
    const hasDescription = this.description !== undefined || this.hasDescriptionSlot;
    const hasValue = !!this.value;
    const showClearButton = this.clearable && hasValue;

    return (
      <le-component component="le-string-input" hostClass={classnames({ disabled: this.disabled })}>
        <div class="le-input-wrapper">
          <label
            class={classnames('le-input-label', { 'is-visible': hasLabel })}
            htmlFor={this.name}
          >
            <slot name="label">{this.label}</slot>
          </label>

          <div class="le-input-container" part="container">
            <span class={classnames('icon-start', { 'is-visible': hasIconStart })}>
              <slot name="icon-start">{this.iconStart}</slot>
            </span>
            <input
              ref={el => {
                this.inputEl = el ?? undefined;

                if (this.inputRef && el) {
                  this.inputRef(el);
                }
              }}
              id={this.name}
              type={this.type}
              name={this.name}
              value={this.value}
              placeholder={this.placeholder}
              autocomplete={this.autocomplete}
              disabled={this.disabled}
              readOnly={this.readonly}
              onInput={this.handleInput}
              onChange={this.handleChange}
              onClick={this.handleClick}
            />
            {showClearButton && (
              <le-button
                variant="clear"
                size="small"
                iconOnly=""
                onClick={() => this.handleClear()}
              >
                <le-icon name="clear" slot="icon-only"></le-icon>
              </le-button>
            )}
            <span class={classnames('icon-end', { 'is-visible': hasIconEnd })}>
              <slot name="icon-end">{this.iconEnd}</slot>
            </span>
          </div>

          <div class={classnames('le-input-description', { 'is-visible': hasDescription })}>
            <le-slot name="description" type="text" tag="p" label="Description">
              <slot name="description">{this.description}</slot>
            </le-slot>
          </div>
        </div>
      </le-component>
    );
  }
}

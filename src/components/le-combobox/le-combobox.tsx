import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Method,
  Element,
  Watch,
  h,
  Listen,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';

/**
 * A combobox component with searchable dropdown.
 *
 * Combines a text input with a dropdown list, allowing users to
 * filter options by typing or select from the list.
 *
 * @cmsEditable true
 * @cmsCategory Form
 *
 * @example Basic combobox
 * ```html
 * <le-combobox
 *   placeholder="Search..."
 *   options='[{"label": "Apple"}, {"label": "Banana"}, {"label": "Cherry"}]'
 * ></le-combobox>
 * ```
 *
 * @example Allow custom values
 * ```html
 * <le-combobox
 *   placeholder="Type or select..."
 *   allow-custom
 *   options='[{"label": "Red"}, {"label": "Green"}, {"label": "Blue"}]'
 * ></le-combobox>
 * ```
 */
@Component({
  tag: 'le-combobox',
  styleUrl: 'le-combobox.css',
  shadow: true,
})
export class LeCombobox {
  @Element() el: HTMLElement;

  /**
   * The options to display in the dropdown.
   */
  @Prop() options: LeOption[] | string = [];

  /**
   * The currently selected value.
   */
  @Prop({ mutable: true }) value?: LeOptionValue;

  /**
   * Placeholder text for the input.
   */
  @Prop() placeholder: string = 'Type to search...';

  /**
   * Whether the combobox is disabled.
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * Whether selection is required.
   */
  @Prop() required: boolean = false;

  /**
   * Name attribute for form submission.
   */
  @Prop() name?: string;

  /**
   * Whether the multiselect should take full width of its container.
   */
  @Prop({ reflect: true }) fullWidth: boolean = false;

  /**
   * Size variant of the combobox.
   */
  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether to allow custom values not in the options list.
   */
  @Prop() allowCustom: boolean = false;

  /**
   * Minimum characters before showing filtered results.
   */
  @Prop() minSearchLength: number = 0;

  /**
   * Text to show when no options match the search.
   */
  @Prop() emptyText: string = 'No results found';

  /**
   * Whether the dropdown is currently open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Emitted when the selected value changes.
   */
  @Event() leChange: EventEmitter<LeOptionSelectDetail>;

  /**
   * Emitted when the input value changes (for custom values).
   */
  @Event() leInput: EventEmitter<{ value: string }>;

  /**
   * Emitted when the dropdown opens.
   */
  @Event() leOpen: EventEmitter<void>;

  /**
   * Emitted when the dropdown closes.
   */
  @Event() leClose: EventEmitter<void>;

  @Listen('click', { target: 'window' })
  handleWindowClick(event: MouseEvent) {
    if (!this.el.contains(event.target as Node)) {
      this.dropdownEl?.hide();
    }
  }

  @State() private inputValue: string = '';
  @State() private selectedOption?: LeOption;

  private dropdownEl?: HTMLLeDropdownBaseElement;
  private inputEl?: HTMLInputElement;

  @Watch('value')
  handleValueChange() {
    this.updateSelectedOption();
  }

  @Watch('options')
  handleOptionsChange() {
    this.updateSelectedOption();
  }

  componentWillLoad() {
    this.updateSelectedOption();
  }

  private get parsedOptions(): LeOption[] {
    if (typeof this.options === 'string') {
      try {
        return JSON.parse(this.options);
      } catch {
        return [];
      }
    }
    return this.options;
  }

  private updateSelectedOption() {
    if (this.value !== undefined) {
      this.selectedOption = this.parsedOptions.find(opt => (opt.value ?? opt.label) === this.value);
      if (this.selectedOption) {
        this.inputValue = this.selectedOption.label;
      } else if (this.allowCustom) {
        this.inputValue = this.value.toString();
      }
    } else {
      this.selectedOption = undefined;
      this.inputValue = '';
    }
  }

  private filterOption = (option: LeOption, query: string): boolean => {
    if (!query || query.length < this.minSearchLength) return true;
    const searchLower = query.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.description?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  private handleOptionSelect = (e: CustomEvent<LeOptionSelectDetail>) => {
    this.value = e.detail.value;
    this.selectedOption = e.detail.option;
    this.inputValue = e.detail.option.label;
    this.leChange.emit(e.detail);
  };

  private handleDropdownOpen = () => {
    this.open = true;
    this.leOpen.emit();
  };

  private handleDropdownClose = () => {
    this.open = false;
    this.leClose.emit();

    // If custom values not allowed, reset input to selected option
    if (!this.allowCustom && this.selectedOption) {
      this.inputValue = this.selectedOption.label;
    } else if (!this.allowCustom && !this.selectedOption) {
      this.inputValue = '';
    }
  };

  private handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.inputValue = target.value;

    // Emit input event for custom values
    if (this.allowCustom) {
      this.leInput.emit({ value: this.inputValue });
    }

    // Open dropdown when typing
    if (!this.open && this.inputValue.length >= this.minSearchLength) {
      this.dropdownEl?.show();
    }
  };

  private handleInputFocus = () => {
    if (!this.disabled) {
      this.dropdownEl?.show();
    }
  };

  private handleInputKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open) {
          this.dropdownEl?.show();
        }
        break;

      case 'Enter':
        if (this.allowCustom && this.inputValue && !this.open) {
          // Accept custom value
          this.value = this.inputValue;
          this.leChange.emit({
            value: this.inputValue,
            option: { label: this.inputValue, value: this.inputValue },
          });
        }
        break;

      case 'Escape':
        if (this.open) {
          this.dropdownEl?.hide();
        }
        break;
    }
  };

  private handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    this.value = undefined;
    this.selectedOption = undefined;
    this.inputValue = '';
    this.inputEl?.focus();
    this.leChange.emit({
      value: '',
      option: { label: '', value: '' },
    });
  };

  /**
   * Opens the dropdown.
   */
  @Method()
  async showDropdown() {
    await this.dropdownEl?.show();
  }

  /**
   * Closes the dropdown.
   */
  @Method()
  async hideDropdown() {
    await this.dropdownEl?.hide();
  }

  /**
   * Focuses the input element.
   */
  @Method()
  async focusInput() {
    this.inputEl?.focus();
  }

  render() {
    const hasValue = this.inputValue.length > 0;

    return (
      <le-component component="le-combobox">
        <le-dropdown-base
          ref={el => (this.dropdownEl = el)}
          options={this.parsedOptions}
          value={this.value}
          disabled={this.disabled}
          filterFn={this.filterOption}
          filterQuery={this.inputValue}
          emptyText={this.emptyText}
          fullWidth={this.fullWidth}
          closeOnClickOutside={false}
          onLeOptionSelect={this.handleOptionSelect}
          onLeDropdownOpen={this.handleDropdownOpen}
          onLeDropdownClose={this.handleDropdownClose}
        >
          <div slot="trigger" class={{ 'combobox-trigger': true, 'is-open': this.open }}>
            <le-string-input
              mode="default"
              hideDescription={true}
              inputRef={el => (this.inputEl = el)}
              type="text"
              class="combobox-input"
              value={this.inputValue}
              placeholder={this.placeholder}
              disabled={this.disabled}
              aria-haspopup="listbox"
              aria-expanded={this.open ? 'true' : 'false'}
              aria-autocomplete="list"
              onInput={this.handleInputChange}
              onFocus={this.handleInputFocus}
              onKeyDown={this.handleInputKeyDown}
            />
            {hasValue && !this.disabled && (
              <button
                type="button"
                class="combobox-clear"
                onClick={this.handleClear}
                aria-label="Clear"
                tabIndex={-1}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
            <span class="combobox-arrow">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </span>
          </div>
        </le-dropdown-base>

        {/* Hidden input for form submission */}
        {this.name && <input type="hidden" name={this.name} value={this.value?.toString() ?? ''} />}
      </le-component>
    );
  }
}

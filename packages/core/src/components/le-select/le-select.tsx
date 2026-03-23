import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Method,
  Element,
  Watch,
  Listen,
  h,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';
import { buildDeclarativeOptionsFromChildren, parseOptionInput } from '../../utils/utils';

/**
 * A select dropdown component for single selection.
 *
 * @cmsEditable true
 * @cmsCategory Form
 *
 * @example Basic select
 * ```html
 * <le-select
 *   placeholder="Choose an option"
 *   options='[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]'
 * ></le-select>
 * ```
 *
 * @example With icons
 * ```html
 * <le-select
 *   options='[
 *     {"label": "Apple", "value": "apple", "iconStart": "🍎"},
 *     {"label": "Banana", "value": "banana", "iconStart": "🍌"}
 *   ]'
 * ></le-select>
 * ```
 *
 * @example Grouped options
 * ```html
 * <le-select
 *   options='[
 *     {"label": "Apple", "value": "apple", "group": "Fruits"},
 *     {"label": "Carrot", "value": "carrot", "group": "Vegetables"}
 *   ]'
 * ></le-select>
 * ```
 */
@Component({
  tag: 'le-select',
  styleUrl: 'le-select.css',
  shadow: true,
})
export class LeSelect {
  @Element() el!: HTMLElement;

  /**
   * The options to display in the dropdown.
   */
  @Prop() options: LeOption[] | string = [];

  /**
   * The currently selected value.
   */
  @Prop({ mutable: true }) value?: LeOptionValue;

  /**
   * Placeholder text when no option is selected.
   */
  @Prop() placeholder: string = 'Select an option';

  /**
   * Whether the select is disabled.
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
   * Size variant of the select.
   */
  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Visual variant of the select.
   */
  @Prop({ reflect: true }) variant: 'default' | 'outlined' | 'solid' = 'default';

  /**
   * Whether the dropdown is currently open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Emitted when the selected value changes.
   */
  @Event() leChange!: EventEmitter<LeOptionSelectDetail>;

  /**
   * Emitted when the dropdown opens.
   */
  @Event() leOpen!: EventEmitter<void>;

  /**
   * Emitted when the dropdown closes.
   */
  @Event() leClose!: EventEmitter<void>;

  @State() private selectedOption?: LeOption;

  @State() private declarativeOptions: LeOption[] = [];

  @State() private isDeclarativeMode: boolean = false;

  private dropdownEl?: HTMLLeDropdownBaseElement;

  private mutationObserver?: MutationObserver;

  @Watch('value')
  handleValueChange() {
    this.updateSelectedOption();
  }

  @Watch('options')
  handleOptionsChange() {
    this.updateSelectedOption();
  }

  async componentWillLoad() {
    await this.syncDeclarativeOptionsAndSelection();
  }

  connectedCallback() {
    this.mutationObserver = new MutationObserver(() => {
      void this.syncDeclarativeOptionsAndSelection();
    });
    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: true,
    });
  }

  disconnectedCallback() {
    this.mutationObserver?.disconnect();
  }

  @Listen('slotchange')
  handleSlotChange() {
    void this.syncDeclarativeOptionsAndSelection();
  }

  private async syncDeclarativeOptionsAndSelection() {
    await this.buildDeclarativeOptions();
    this.updateSelectedOption();
  }

  private async buildDeclarativeOptions() {
    const { isDeclarativeMode, options } = await buildDeclarativeOptionsFromChildren(
      this.el,
      'le-select',
    );

    this.isDeclarativeMode = isDeclarativeMode;
    this.declarativeOptions = options;
  }

  private get parsedOptions(): LeOption[] {
    if (this.isDeclarativeMode) {
      return this.declarativeOptions;
    }

    return parseOptionInput(this.options, 'le-select', 'options');
  }

  private updateSelectedOption() {
    if (this.value !== undefined) {
      this.selectedOption = this.parsedOptions.find(opt => (opt.value ?? opt.label) === this.value);
    } else {
      this.selectedOption = undefined;
    }
  }

  private handleOptionSelect = (e: CustomEvent<LeOptionSelectDetail>) => {
    this.value = e.detail.value;
    this.selectedOption = e.detail.option;
    this.leChange.emit(e.detail);
  };

  private handleDropdownOpen = () => {
    this.open = true;
    this.leOpen.emit();
  };

  private handleDropdownClose = () => {
    this.open = false;
    this.leClose.emit();
  };

  private handleTriggerClick = () => {
    if (!this.disabled) {
      this.dropdownEl?.toggle();
    }
  };

  private handleTriggerKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.dropdownEl?.show();
      return;
    }

    const isPrintable = e.key.length === 1 && e.key.trim().length > 0;
    if (!e.ctrlKey && !e.metaKey && !e.altKey && isPrintable) {
      e.preventDefault();
      this.dropdownEl?.typeahead(e.key);
    }
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

  private renderIcon(icon: string | undefined) {
    if (!icon) return null;

    if (icon.startsWith('http') || icon.startsWith('/')) {
      return <img class="trigger-icon" src={icon} alt="" />;
    }

    return <span class="trigger-icon">{icon}</span>;
  }

  render() {
    const hasValue = this.selectedOption !== undefined;

    return (
      <le-component component="le-select">
        <le-dropdown-base
          ref={el => (this.dropdownEl = el)}
          options={this.parsedOptions}
          value={this.value}
          disabled={this.disabled}
          onLeOptionSelect={this.handleOptionSelect}
          onLeDropdownOpen={this.handleDropdownOpen}
          onLeDropdownClose={this.handleDropdownClose}
          full-width
        >
          <le-button
            variant={this.variant && this.variant !== 'default' ? this.variant : 'outlined'}
            slot="trigger"
            align="space-between"
            class={{
              'select-trigger': true,
              'has-value': hasValue,
              'is-open': this.open,
            }}
            mode="default"
            size={this.size}
            disabled={this.disabled}
            aria-haspopup="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            onClick={this.handleTriggerClick}
            onKeyDown={this.handleTriggerKeyDown}
            full-width
            iconStart={
              hasValue && this.selectedOption?.iconStart
                ? this.renderIcon(this.selectedOption.iconStart)
                : null
            }
            iconEnd={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            }
          >
            <span class="trigger-label">
              {hasValue ? this.selectedOption!.label : this.placeholder}
            </span>
          </le-button>
        </le-dropdown-base>

        <div class="hidden-slot-container">
          <slot></slot>
        </div>

        {/* Hidden input for form submission */}
        {this.name && <input type="hidden" name={this.name} value={this.value?.toString() ?? ''} />}
      </le-component>
    );
  }
}

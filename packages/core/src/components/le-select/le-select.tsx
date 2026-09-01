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
  Host,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';
import {
  buildDeclarativeOptionsFromChildren,
  parseOptionInput,
  slotHasContent,
} from '../../utils/utils';

/**
 * A select dropdown component for single selection.
 *
 * @cmsEditable true
 * @cmsCategory Form
 *
 * @slot chevron - Custom chevron icon to display at the end of the select trigger
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
  @Prop({ reflect: true }) variant: 'default' | 'outlined' | 'solid' | 'clear' = 'default';

  /**
   * Custom chevron icon name or text.
   */
  @Prop() chevron?: string;

  /**
   * Whether to hide the chevron icon completely.
   */
  @Prop({ reflect: true }) hideChevron: boolean = false;

  /**
   * Compact mode shortcut: sets size="small", variant="clear", hideChevron=true, and autoWidth=true.
   */
  @Prop({ reflect: true }) compact: boolean = false;

  /**
   * Whether the select should take full width of its container.
   */
  @Prop({ reflect: true }) fullWidth: boolean = false;

  /**
   * Whether the dropdown width should size automatically to its content rather than matching the trigger width.
   * Defaults to false.
   */
  @Prop({ reflect: true }) autoWidth: boolean = false;

  /**
   * Whether the dropdown should match the trigger width.
   * Defaults to true. Setting autoWidth=true or compact=true overrides this to false.
   */
  @Prop({ reflect: true }) matchTriggerWidth: boolean = true;

  /**
   * Whether the dropdown is currently open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Emitted when the selected value changes.
   */
  @Event() leChange?: EventEmitter<LeOptionSelectDetail>;

  /**
   * Emitted when the dropdown opens.
   */
  @Event() leOpen?: EventEmitter<void>;

  /**
   * Emitted when the dropdown closes.
   */
  @Event() leClose?: EventEmitter<void>;

  @State() private selectedOption?: LeOption;

  @State() private declarativeOptions: LeOption[] = [];

  @State() private isDeclarativeMode: boolean = false;

  @State() private hasChevronSlot: boolean = false;

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
    this.hasChevronSlot = slotHasContent(this.el, 'chevron');
    await this.syncDeclarativeOptionsAndSelection();
  }

  connectedCallback() {
    this.mutationObserver = new MutationObserver(() => {
      this.hasChevronSlot = slotHasContent(this.el, 'chevron');
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
    this.hasChevronSlot = slotHasContent(this.el, 'chevron');
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
    this.leChange?.emit(e.detail);
  };

  private handleDropdownOpen = () => {
    this.open = true;
    this.leOpen?.emit();
  };

  private handleDropdownClose = () => {
    this.open = false;
    this.leClose?.emit();
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

  private renderChevron() {
    if (this.hasChevronSlot) {
      return <slot slot="icon-end" name="chevron"></slot>;
    }

    if (this.chevron) {
      if (Array.from(this.chevron).length <= 2) {
        return <span slot="icon-end" class="chevron">{this.chevron}</span>;
      }
      return <le-icon slot="icon-end" name={this.chevron} size={16} class="chevron" />;
    }

    return <le-icon slot="icon-end" name="chevron-down" size={16} class="chevron" />;
  }

  render() {
    const hasValue = this.selectedOption !== undefined;
    const size = this.compact && this.size === 'medium' ? 'small' : this.size;
    const variant = this.compact && this.variant === 'default' ? 'clear' : this.variant;
    const hideChevron = this.compact ? true : this.hideChevron;
    const autoWidth = this.autoWidth || this.compact;
    const matchTriggerWidth = autoWidth ? false : this.matchTriggerWidth;

    return (
      <Host>
        <le-dropdown-base
          ref={el => (this.dropdownEl = el)}
          options={this.parsedOptions}
          value={this.value}
          disabled={this.disabled}
          onLeOptionSelect={this.handleOptionSelect}
          onLeDropdownOpen={this.handleDropdownOpen}
          onLeDropdownClose={this.handleDropdownClose}
          fullWidth={this.fullWidth}
          autoWidth={autoWidth}
          matchTriggerWidth={matchTriggerWidth}
          hideCheckboxes={size === 'small'}
          size={size}
        >
          <le-button
            variant={variant !== 'default' ? variant : 'outlined'}
            slot="trigger"
            align="space-between"
            class={{
              'select-trigger': true,
              'has-value': hasValue,
              'is-open': this.open,
              'no-chevron': hideChevron,
            }}
            mode="default"
            size={size}
            disabled={this.disabled}
            aria-haspopup="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            onKeyDown={this.handleTriggerKeyDown}
            fullWidth={this.fullWidth}
            iconStart={
              hasValue && this.selectedOption?.iconStart
                ? this.renderIcon(this.selectedOption.iconStart)
                : undefined
            }
          >
            <span class="trigger-label">
              {hasValue ? this.selectedOption!.label : this.placeholder}
            </span>
            {!hideChevron && this.renderChevron()}
          </le-button>
        </le-dropdown-base>

        <div class="hidden-slot-container">
          <slot></slot>
        </div>

        {/* Hidden input for form submission */}
        {this.name && <input type="hidden" name={this.name} value={this.value?.toString() ?? ''} />}
      </Host>
    );
  }
}

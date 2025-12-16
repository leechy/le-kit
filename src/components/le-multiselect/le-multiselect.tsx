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
} from '@stencil/core';
import {
  LeOption,
  LeOptionValue,
  LeMultiOptionSelectDetail,
  LeOptionSelectDetail,
} from '../../types/options';

/**
 * A multiselect component for selecting multiple options.
 *
 * Displays selected items as tags with optional search filtering.
 *
 * @cmsEditable true
 * @cmsCategory Form
 *
 * @example Basic multiselect
 * ```html
 * <le-multiselect
 *   placeholder="Select options..."
 *   options='[{"label": "Red"}, {"label": "Green"}, {"label": "Blue"}]'
 * ></le-multiselect>
 * ```
 *
 * @example With max selections
 * ```html
 * <le-multiselect
 *   max-selections="3"
 *   options='[{"label": "Option 1"}, {"label": "Option 2"}, {"label": "Option 3"}, {"label": "Option 4"}]'
 * ></le-multiselect>
 * ```
 *
 * @example With search
 * ```html
 * <le-multiselect
 *   searchable
 *   placeholder="Search and select..."
 *   options='[{"label": "Apple"}, {"label": "Banana"}, {"label": "Cherry"}]'
 * ></le-multiselect>
 * ```
 */
@Component({
  tag: 'le-multiselect',
  styleUrl: 'le-multiselect.css',
  shadow: true,
})
export class LeMultiselect {
  @Element() el: HTMLElement;

  /**
   * The options to display in the dropdown.
   */
  @Prop() options: LeOption[] | string = [];

  /**
   * The currently selected values.
   */
  @Prop({ mutable: true }) value: LeOptionValue[] = [];

  /**
   * Placeholder text when no options are selected.
   */
  @Prop() placeholder: string = 'Select options...';

  /**
   * Whether the multiselect is disabled.
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
   * Size variant of the multiselect.
   */
  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Maximum number of selections allowed.
   */
  @Prop() maxSelections?: number;

  /**
   * Labels for the "Select All" option.
   */
  @State() private selectAllLabel: string = 'Select All';
  @State() private deselectAllLabel: string = 'Deselect All';

  /**
   * Whether to show a "Select All" option.
   * Also accepts a string or array of strings to customize the label(s).
   */
  @Prop({ mutable: true }) showSelectAll: boolean | string | string[] = false;

  /**
   * Whether the input is searchable.
   */
  @Prop() searchable: boolean = false;

  /**
   * Text to show when no options match the search.
   */
  @Prop() emptyText: string = 'No results found';

  /**
   * Whether the dropdown is currently open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Emitted when the selected values change.
   */
  @Event() leChange: EventEmitter<LeMultiOptionSelectDetail>;

  /**
   * Emitted when the dropdown opens.
   */
  @Event() leOpen: EventEmitter<void>;

  /**
   * Emitted when the dropdown closes.
   */
  @Event() leClose: EventEmitter<void>;

  @State() private selectedOptions: LeOption[] = [];
  @State() private searchQuery: string = '';

  private dropdownEl?: HTMLLeDropdownBaseElement;
  private inputEl?: HTMLInputElement;

  @Watch('value')
  handleValueChange() {
    this.updateSelectedOptions();
  }

  @Watch('options')
  handleOptionsChange() {
    this.updateSelectedOptions();
  }

  @Watch('showSelectAll')
  handleShowSelectAllChange(newValue: boolean | string | string[]) {
    if (typeof newValue !== 'boolean' && typeof newValue !== 'string') {
      this.showSelectAll = false;
    } else if (typeof newValue === 'boolean') {
      this.showSelectAll = newValue;
    } else if (Array.isArray(newValue)) {
      this.showSelectAll = true;
      this.selectAllLabel = newValue[0];
      this.deselectAllLabel = newValue[1] || newValue[0];
    } else if (typeof newValue === 'string') {
      this.showSelectAll = true;
      try {
        const parsed = JSON.parse(newValue);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          this.selectAllLabel = parsed[0];
          this.deselectAllLabel = parsed[1] || parsed[0];
        } else {
          this.selectAllLabel = newValue;
          this.deselectAllLabel = newValue;
        }
      } catch {
        this.selectAllLabel = newValue;
        this.deselectAllLabel = newValue;
      }
    }
  }

  componentWillLoad() {
    this.updateSelectedOptions();
    this.handleShowSelectAllChange(this.showSelectAll);
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

  private get effectiveOptions(): LeOption[] {
    let options = [...this.parsedOptions];

    // Add "Select All" option if enabled
    if (this.showSelectAll && options.length > 0) {
      const allSelected =
        this.selectedOptions.length === this.parsedOptions.filter(opt => !opt.disabled).length;
      options = [
        {
          label: allSelected ? this.deselectAllLabel : this.selectAllLabel,
          value: '__select_all__',
          iconStart: allSelected ? '✕' : '⇣',
        },
        ...options,
      ];
    }

    return options;
  }

  private updateSelectedOptions() {
    const valueArray = Array.isArray(this.value) ? this.value : [];
    this.selectedOptions = this.parsedOptions.filter(opt =>
      valueArray.includes(opt.value ?? opt.label),
    );
  }

  private filterOption = (option: LeOption, query: string): boolean => {
    if (!query) return true;
    // Always show "Select All" option
    if (option.value === '__select_all__') return true;

    const searchLower = query.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.description?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  private handleOptionSelect = (e: CustomEvent<LeOptionSelectDetail>) => {
    const { value } = e.detail;

    const enabledOptions = this.parsedOptions.filter(opt => !opt.disabled);
    if (enabledOptions.length === 0) return;

    // Handle "Select All" option
    if (value === '__select_all__') {
      if (this.selectedOptions.length === enabledOptions.length) {
        // Deselect all
        this.value = [];
      } else {
        // Select all (respect maxSelections)
        const selectableOptions = this.maxSelections
          ? enabledOptions.slice(0, this.maxSelections)
          : enabledOptions;
        this.value = selectableOptions.map(opt => opt.value ?? opt.label);
      }
      this.emitChange();
      return;
    }

    const isSelected = this.value.includes(value);

    if (isSelected) {
      // Remove from selection
      this.value = this.value.filter(v => v !== value);
      this.selectedOptions = this.selectedOptions.filter(opt => (opt.value ?? opt.label) !== value);
    } else {
      // Add to selection (if not at max)
      if (this.maxSelections && this.value.length >= this.maxSelections) {
        return; // Don't add more
      }
      this.value = [...this.value, value];
    }

    this.emitChange();

    // Clear search after szelection
    this.searchQuery = '';
  };

  private emitChange() {
    this.leChange.emit({
      values: this.value,
      options: this.selectedOptions,
    });
  }

  private handleDropdownOpen = () => {
    this.open = true;
    this.leOpen.emit();

    // Focus search input if searchable
    if (this.searchable) {
      setTimeout(() => {
        this.inputEl?.focus();
      }, 50);
    }
  };

  private handleDropdownClose = () => {
    this.open = false;
    this.searchQuery = '';
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
    }
  };

  private handleTagDismiss = (option: LeOption, e: CustomEvent) => {
    e.stopPropagation();
    const value = option.value ?? option.label;
    this.value = this.value.filter(v => v !== value);
    this.selectedOptions = this.selectedOptions.filter(opt => opt !== option);
    this.emitChange();
  };

  private handleSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.searchQuery = target.value;
  };

  private handleClearAll = (e: MouseEvent) => {
    e.stopPropagation();
    this.value = [];
    this.selectedOptions = [];
    this.emitChange();
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
   * Clears all selections.
   */
  @Method()
  async clearSelection() {
    this.value = [];
    this.selectedOptions = [];
    this.emitChange();
  }

  private renderTags() {
    if (this.selectedOptions.length === 0) {
      return <span class="multiselect-placeholder">{this.placeholder}</span>;
    }

    return (
      <div class="multiselect-tags">
        {this.selectedOptions.map(option => (
          <le-tag
            key={option.value ?? option.label}
            label={option.label}
            icon={option.iconStart}
            size={this.size === 'large' ? 'medium' : 'small'}
            dismissible
            disabled={this.disabled}
            onLeDismiss={e => this.handleTagDismiss(option, e)}
            mode="default"
          />
        ))}
      </div>
    );
  }

  render() {
    const hasSelections = this.selectedOptions.length > 0;
    const atMaxSelections = this.maxSelections && this.value.length >= this.maxSelections;

    return (
      <le-component component="le-multiselect">
        <le-dropdown-base
          ref={el => (this.dropdownEl = el)}
          options={this.effectiveOptions}
          value={this.value}
          multiple={true}
          disabled={this.disabled}
          filterFn={this.searchable ? this.filterOption : undefined}
          filterQuery={this.searchQuery}
          emptyText={this.emptyText}
          showCheckboxes={true}
          fullWidth={this.fullWidth}
          onLeOptionSelect={this.handleOptionSelect}
          onLeDropdownOpen={this.handleDropdownOpen}
          onLeDropdownClose={this.handleDropdownClose}
        >
          <div
            slot="trigger"
            class={{
              'multiselect-trigger': true,
              'has-selections': hasSelections,
              'is-open': this.open,
              'is-disabled': this.disabled,
            }}
            tabIndex={this.disabled ? -1 : 0}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            aria-disabled={this.disabled ? 'true' : undefined}
            onClick={this.handleTriggerClick}
            onKeyDown={this.handleTriggerKeyDown}
          >
            {this.renderTags()}

            <div class="multiselect-actions">
              {hasSelections && !this.disabled && (
                <button
                  type="button"
                  class="multiselect-clear"
                  onClick={this.handleClearAll}
                  aria-label="Clear all"
                  tabIndex={-1}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              )}
              <span class="multiselect-arrow">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </span>
            </div>
          </div>

          {/* Search input shown in dropdown header */}
          {this.searchable && this.open && (
            <div class="multiselect-search" slot="header">
              <le-string-input
                mode="default"
                inputRef={el => (this.inputEl = el)}
                class="search-input"
                placeholder="Search..."
                value={this.searchQuery}
                onInput={this.handleSearchInput}
              />
            </div>
          )}
        </le-dropdown-base>

        {/* Hidden inputs for form submission */}
        {this.name &&
          this.value.map(val => (
            <input type="hidden" name={this.name} value={val.toString()} key={val.toString()} />
          ))}

        {/* Status message */}
        {atMaxSelections && (
          <span class="multiselect-status">Maximum {this.maxSelections} selections</span>
        )}
      </le-component>
    );
  }
}

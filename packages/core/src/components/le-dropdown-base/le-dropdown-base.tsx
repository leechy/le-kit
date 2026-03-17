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
  Host,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';
import { generateId } from '../../utils/utils';

/**
 * Internal dropdown base component that provides shared functionality
 * for select, combobox, and multiselect components.
 *
 * Wraps le-popover for positioning and provides:
 * - Option list rendering with groups
 * - Keyboard navigation (↑↓, Enter, Escape, Home/End)
 * - Option filtering support
 * - Single and multi-select modes
 *
 * @cmsInternal true
 * @cmsCategory System
 *
 * @slot trigger - The element that triggers the dropdown
 */
@Component({
  tag: 'le-dropdown-base',
  styleUrl: 'le-dropdown-base.css',
  shadow: true,
})
export class LeDropdownBase {
  @Element() el: HTMLElement;

  /**
   * The options to display in the dropdown.
   */
  @Prop() options: LeOption[] = [];

  /**
   * Current value(s) - single value or array for multiselect.
   */
  @Prop() value?: LeOptionValue | LeOptionValue[];

  /**
   * Whether multiple selection is allowed.
   */
  @Prop() multiple: boolean = false;

  /**
   * Whether the dropdown is open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Whether the dropdown is disabled.
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * Filter function for options.
   * Return true to include the option.
   */
  @Prop() filterFn?: (option: LeOption, query: string) => boolean;

  /**
   * Current filter query string.
   */
  @Prop() filterQuery: string = '';

  /**
   * Placeholder text when no options match filter.
   */
  @Prop() emptyText: string = 'No options';

  /**
   * Whether to show checkboxes for multiselect mode.
   */
  @Prop() showCheckboxes: boolean = true;

  /**
   * Maximum height of the dropdown list.
   */
  @Prop() maxHeight: string = '300px';

  /**
   * Width of the dropdown. If not set, matches trigger width.
   */
  @Prop() width?: string;

  /**
   * Sets the dropdown to full width of the trigger.
   */
  @Prop() fullWidth: boolean = false;

  /**
   * Whether to close the dropdown when clicking outside.
   * (used to support combobox with input focus)
   */
  @Prop() closeOnClickOutside: boolean = true;

  /**
   * Emitted when an option is selected.
   */
  @Event() leOptionSelect: EventEmitter<LeOptionSelectDetail>;

  /**
   * Emitted when the dropdown opens.
   */
  @Event() leDropdownOpen: EventEmitter<void>;

  /**
   * Emitted when the dropdown closes.
   */
  @Event() leDropdownClose: EventEmitter<void>;

  @State() private focusedIndex: number = -1;
  @State() private filteredOptions: LeOption[] = [];

  private popoverEl?: HTMLLePopoverElement;
  private listEl?: HTMLElement;
  private triggerWidth: number = 0;

  @Watch('options')
  @Watch('filterQuery')
  handleOptionsChange() {
    this.updateFilteredOptions();
  }

  componentWillLoad() {
    this.updateFilteredOptions();
  }

  private updateFilteredOptions() {
    // Remember previously focused option
    const focusedOption = this.filteredOptions[this.focusedIndex];

    if (!this.filterQuery || !this.filterFn) {
      this.filteredOptions = this.options;
    } else {
      this.filteredOptions = this.options.filter(opt => this.filterFn!(opt, this.filterQuery));
    }

    // try to maintain focus on same option if still present
    if (focusedOption) {
      const newIndex = this.filteredOptions.indexOf(focusedOption);
      this.focusedIndex = newIndex >= 0 ? newIndex : this.getInitialFocusIndex();
    } else {
      this.focusedIndex = -1;
    }
  }

  private getSelectableOptions(): LeOption[] {
    return this.filteredOptions.filter(opt => !opt.disabled);
  }

  private isSelected(option: LeOption): boolean {
    const optValue = option.value ?? option.label;
    if (this.multiple && Array.isArray(this.value)) {
      setTimeout(() => {
        this.popoverEl?.updatePosition();
      }, 50);
      return this.value.includes(optValue);
    }
    return this.value === optValue;
  }

  private handleOptionClick(option: LeOption, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (option.disabled) return;

    this.leOptionSelect.emit({
      value: option.value ?? option.label,
      option,
    });

    // Close dropdown for single select
    if (!this.multiple) {
      this.hide();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;

    const optionCount = this.filteredOptions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // check for the next non-disabled option and focus
        let nextIndex = this.focusedIndex < optionCount - 1 ? this.focusedIndex + 1 : 0;
        while (this.filteredOptions[nextIndex].disabled) {
          nextIndex = ++nextIndex < optionCount ? nextIndex : 0;
        }
        this.focusedIndex = nextIndex;
        this.scrollToFocused();
        break;

      case 'ArrowUp':
        e.preventDefault();
        // check for the previous non-disabled option and focus
        let prevIndex = this.focusedIndex > 0 ? this.focusedIndex - 1 : optionCount - 1;
        while (this.filteredOptions[prevIndex].disabled) {
          prevIndex = --prevIndex >= 0 ? prevIndex : optionCount - 1;
        }
        this.focusedIndex = prevIndex;
        this.scrollToFocused();
        break;

      case 'Home':
        e.preventDefault();
        // check for the first non-disabled option and focus
        let firstIndex = 0;
        while (this.filteredOptions[firstIndex].disabled) {
          firstIndex++;
          if (firstIndex >= optionCount) {
            firstIndex = -1;
            break;
          }
        }
        this.focusedIndex = firstIndex;
        this.scrollToFocused();
        break;

      case 'End':
        e.preventDefault();
        // check for the last non-disabled option and focus
        let lastIndex = optionCount - 1;
        while (this.filteredOptions[lastIndex].disabled) {
          lastIndex--;
          if (lastIndex < 0) {
            lastIndex = -1;
            break;
          }
        }
        this.focusedIndex = lastIndex;
        this.scrollToFocused();
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.focusedIndex >= 0 && this.focusedIndex < optionCount) {
          const option = this.filteredOptions[this.focusedIndex];
          if (!option || option.disabled) return;
          this.leOptionSelect.emit({
            value: option.value ?? option.label,
            option,
          });
          if (!this.multiple) {
            this.hide();
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.hide();
        break;

      case 'Tab':
        this.hide();
        break;
    }
  };

  private scrollToFocused() {
    if (!this.listEl || this.focusedIndex < 0) return;

    const focusedEl = this.listEl.querySelector(
      `[data-index="${this.focusedIndex}"]`,
    ) as HTMLElement;
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  private handlePopoverOpen = () => {
    this.open = true;
    this.focusedIndex = this.getInitialFocusIndex();
    this.leDropdownOpen.emit();

    // Add keyboard listener
    document.addEventListener('keydown', this.handleKeyDown);
  };

  private handlePopoverClose = () => {
    this.open = false;
    this.focusedIndex = -1;
    this.leDropdownClose.emit();

    // Remove keyboard listener
    document.removeEventListener('keydown', this.handleKeyDown);
  };

  private getInitialFocusIndex(): number {
    // Focus on first selected option, or first option
    const selectableOptions = this.getSelectableOptions();
    const selectedIndex = selectableOptions.findIndex(opt => this.isSelected(opt));
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  /**
   * Opens the dropdown.
   */
  @Method()
  async show() {
    if (this.disabled) return;

    // Capture trigger width for matching dropdown width
    const trigger = this.el.querySelector('[slot="trigger"]') as HTMLElement;
    if (trigger) {
      this.triggerWidth = trigger.offsetWidth;
    }

    await this.popoverEl?.show();
  }

  /**
   * Closes the dropdown.
   */
  @Method()
  async hide() {
    await this.popoverEl?.hide();
  }

  /**
   * Toggles the dropdown.
   */
  @Method()
  async toggle() {
    if (this.open) {
      await this.hide();
    } else {
      await this.show();
    }
  }

  private renderIcon(icon: string | undefined, className: string) {
    if (!icon) return null;

    if (icon.startsWith('http') || icon.startsWith('/')) {
      return <img class={className} src={icon} alt="" />;
    }

    return <span class={className}>{icon}</span>;
  }

  private renderOption(option: LeOption, index: number) {
    const isSelected = this.isSelected(option);
    const isFocused = index === this.focusedIndex;
    const optionId = option.id || generateId();

    return (
      <div
        class={{
          'dropdown-option': true,
          'is-selected': isSelected,
          'is-focused': isFocused,
          'is-disabled': !!option.disabled,
        }}
        role="option"
        id={optionId}
        aria-selected={isSelected ? 'true' : 'false'}
        aria-disabled={option.disabled ? 'true' : undefined}
        data-index={index}
        onClick={e => this.handleOptionClick(option, e)}
        onMouseEnter={() => {
          if (!option.disabled) {
            this.focusedIndex = index;
          }
        }}
      >
        {this.renderIcon(option.iconStart, 'option-icon-start')}
        <div class="option-content">
          <span class="option-label">{option.label}</span>
          {option.description && <span class="option-description">{option.description}</span>}
        </div>
        {this.renderIcon(option.iconEnd, 'option-icon-end')}
        {(!this.multiple || this.showCheckboxes) && isSelected && (
          <span class="option-check">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          </span>
        )}
      </div>
    );
  }

  private renderOptions() {
    if (this.filteredOptions.length === 0) {
      return <div class="dropdown-empty">{this.emptyText}</div>;
    }

    // Group options if they have group property
    const grouped = new Map<string, LeOption[]>();
    const ungrouped: LeOption[] = [];

    this.filteredOptions.forEach(opt => {
      if (opt.group) {
        const group = grouped.get(opt.group) || [];
        group.push(opt);
        grouped.set(opt.group, group);
      } else {
        ungrouped.push(opt);
      }
    });

    // Build flat list with group headers for index tracking
    let globalIndex = 0;
    const elements: any[] = [];

    // Render ungrouped options first
    ungrouped.forEach(opt => {
      if (opt.separator === 'before') {
        elements.push(<div class="dropdown-separator" role="separator" />);
      }
      elements.push(this.renderOption(opt, globalIndex++));
      if (opt.separator === 'after') {
        elements.push(<div class="dropdown-separator" role="separator" />);
      }
    });

    // Render grouped options
    grouped.forEach((options, groupLabel) => {
      elements.push(
        <div class="dropdown-group-header" role="presentation">
          {groupLabel}
        </div>,
      );
      options.forEach(opt => {
        elements.push(this.renderOption(opt, globalIndex++));
      });
    });

    return elements;
  }

  render() {
    const dropdownWidth = this.width || (this.triggerWidth ? `${this.triggerWidth}px` : undefined);

    return (
      <Host>
        <le-popover
          ref={el => (this.popoverEl = el)}
          position="bottom"
          align="start"
          showClose={false}
          closeOnClickOutside={this.closeOnClickOutside}
          closeOnEscape={true}
          offset={4}
          width={dropdownWidth}
          minWidth="150px"
          trigger-full-width={this.fullWidth}
          onLePopoverOpen={this.handlePopoverOpen}
          onLePopoverClose={this.handlePopoverClose}
        >
          <slot name="trigger" slot="trigger" />
          <slot name="header" />
          <div
            class="dropdown-list"
            role="listbox"
            aria-multiselectable={this.multiple ? 'true' : undefined}
            ref={el => (this.listEl = el)}
            style={{ maxHeight: this.maxHeight }}
          >
            {this.renderOptions()}
          </div>
        </le-popover>
      </Host>
    );
  }
}

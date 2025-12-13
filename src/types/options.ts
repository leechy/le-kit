/**
 * Universal option interface used across Le-Kit components.
 *
 * Used by: le-select, le-combobox, le-multiselect, le-tabs,
 * le-block-menu, le-emoji-picker, and any menu/list components.
 *
 * @example Basic option
 * ```typescript
 * const option: LeOption = {
 *   label: 'Option 1',
 *   value: 'opt1'
 * };
 * ```
 *
 * @example With icons and description
 * ```typescript
 * const option: LeOption = {
 *   label: 'Settings',
 *   value: 'settings',
 *   iconStart: '⚙️',
 *   description: 'Configure application settings'
 * };
 * ```
 *
 * @example Grouped options
 * ```typescript
 * const options: LeOption[] = [
 *   { label: 'Apple', value: 'apple', group: 'Fruits' },
 *   { label: 'Banana', value: 'banana', group: 'Fruits' },
 *   { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
 * ];
 * ```
 *
 * @example Nested options (for submenus)
 * ```typescript
 * const option: LeOption = {
 *   label: 'More actions',
 *   iconEnd: '▶',
 *   children: [
 *     { label: 'Duplicate', value: 'duplicate' },
 *     { label: 'Archive', value: 'archive' },
 *   ]
 * };
 * ```
 */
export interface LeOption {
  /**
   * Unique identifier for the option.
   * Auto-generated if not provided.
   */
  id?: string;

  /**
   * Display text for the option (required).
   */
  label: string;

  /**
   * Selection value. Defaults to label if not provided.
   */
  value?: string | number;

  /**
   * Whether the option is disabled and cannot be selected.
   */
  disabled?: boolean;

  /**
   * Whether the option is currently selected.
   * Used for multiselect and menu components.
   */
  selected?: boolean;

  /**
   * Whether the option is checked.
   * Used for checkbox/radio menu items.
   */
  checked?: boolean;

  /**
   * Icon displayed at the start (left) of the option.
   * Can be a URL, icon name, or emoji character.
   */
  iconStart?: string;

  /**
   * Icon displayed at the end (right) of the option.
   * Can be a URL, icon name, or emoji character.
   */
  iconEnd?: string;

  /**
   * Secondary description text displayed below the label.
   */
  description?: string;

  /**
   * Nested child options for hierarchical menus or submenus.
   */
  children?: LeOption[];

  /**
   * Group label for categorizing options in flat lists.
   * Options with the same group value are visually grouped together.
   */
  group?: string;

  /**
   * Add a visual separator line before or after this option.
   */
  separator?: 'before' | 'after';

  /**
   * Custom data passthrough for application-specific needs.
   * This data is included in selection events.
   */
  data?: Record<string, unknown>;
}

/**
 * Helper type for option value
 */
export type LeOptionValue = string | number;

/**
 * Event detail for option selection events
 */
export interface LeOptionSelectDetail {
  value: LeOptionValue;
  option: LeOption;
}

/**
 * Event detail for multi-option selection events
 */
export interface LeMultiOptionSelectDetail {
  values: LeOptionValue[];
  options: LeOption[];
}

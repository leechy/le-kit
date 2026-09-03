import type { LeOption } from './options';

/**
 * Column definition for `<le-list>` component.
 */
export interface LeColumn {
  /**
   * Data key / field path on the item.
   * Can reference top-level LeOption properties ('label', 'value', 'description', 'id', etc.)
   * or nested properties inside the item's `data` object (e.g. 'data.role', 'data.email', 'email').
   */
  key: string;

  /**
   * Display label for column header.
   * If omitted, capitalized `key` will be used.
   */
  label?: string;

  /**
   * Type of column data used for formatting and default sorting.
   * Supported: 'string' | 'number' | 'date' | 'boolean' | 'badge' | 'custom' | string
   */
  type?: 'string' | 'number' | 'date' | 'boolean' | 'badge' | 'custom' | string;

  /**
   * Whether this column is sortable by the user.
   */
  sortable?: boolean;

  /**
   * Whether this column is initially hidden.
   */
  hidden?: boolean;

  /**
   * Whether this column's visibility can be toggled by the user in the context menu.
   * Defaults to true if omitted. If set to false, the column appears in the context menu but is disabled.
   */
  toggleable?: boolean;

  /**
   * Column width (e.g., '150px', '20%', 'minmax(100px, 1fr)').
   */
  width?: string;

  /**
   * Text alignment for column cell values.
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Custom cell formatter function when used programmatically.
   */
  format?: (value: any, item: LeOption) => string;

  /**
   * Custom sort comparator function for this column when used programmatically.
   * Receives two `LeOption` items and the current sort direction ('asc' | 'desc').
   * Should return a standard comparison number (< 0 if a < b, 0 if equal, > 0 if a > b).
   */
  sortFn?: (a: LeOption, b: LeOption, direction: 'asc' | 'desc') => number;

  /**
   * Placement of the sort icon in the column header cell.
   * - 'start': Icon placed before header label (default for right-aligned columns).
   * - 'end': Icon placed after header label (default for left/center-aligned columns).
   * - 'none': Sort icon hidden (column remains clickable if sortable: true).
   */
  sortIconPosition?: 'start' | 'end' | 'none';

  /**
   * Initial sort direction on the first header click.
   * Defaults to 'asc' (or 'desc' if specified).
   */
  sortStart?: 'asc' | 'desc';

  /**
   * Whether clicking a sorted column header a 3rd time clears sorting back to unsorted.
   * If omitted, falls back to list's `allowClearSort` prop (default: true).
   */
  allowClearSort?: boolean;
}

export type LeListReorderMode = 'none' | 'siblings' | 'nested';

export interface LeListItemReorderDetail {
  item: LeOption;
  draggedId: string;
  targetItem?: LeOption;
  targetId?: string;
  position: 'before' | 'inside' | 'after';
  oldParentId?: string;
  newParentId?: string;
  items: LeOption[];
  originalEvent?: PointerEvent | MouseEvent;
}


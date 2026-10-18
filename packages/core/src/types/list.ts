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
  key?: string;

  /**
   * Column identifier (alias for key).
   */
  id?: string;

  /**
   * Display label for column header.
   * If omitted, capitalized `key` will be used.
   */
  label?: string;

  /**
   * Display name for column header (alias for label).
   */
  name?: string;

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
   * Defaults to 'right' for number and actions columns, 'left' otherwise.
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

  /**
   * Custom cell render function returning JSX / VNode / DOM node or string.
   * Gives full programmatic control over cell rendering.
   */
  render?: (value: any, item: LeOption, column: LeColumn, list: HTMLElement) => any;

  /**
   * Maximum number of action buttons rendered before overflowing into '...' dropdown.
   * Applicable when type === 'actions'.
   * If set to 0, only the overflow menu is visible.
   * Defaults to 3.
   */
  maxVisibleActions?: number;

  /**
   * Marks the column holding the main name of the entity.
   * Rendered as the row header in the table and as the large title in cards.
   */
  primary?: boolean;
}

/**
 * Layout of `<le-list>`:
 * - 'table': rows with columns (default)
 * - 'cards': each item is a card, see `LeListCardConfig`
 * - 'auto': cards when the list is narrower than `cardBreakpoint`, table otherwise
 */
export type LeListLayout = 'auto' | 'table' | 'cards';

/**
 * One line of a card. Values are column keys (or item field paths) rendered the same way as in the table.
 * An array puts several values next to each other, joined with the card separator (' · ' by default).
 */
export interface LeListCardRow {
  /** Values aligned to the start of the line */
  start?: string | string[];

  /** Values aligned to the end of the line */
  end?: string | string[];

  /**
   * Text size of the line. When not set on any line, the title is the line holding the
   * `primary` column, or the 1st of 1–2 lines, or the 2nd of 3+ lines.
   */
  size?: 'title' | 'default';
}

/**
 * Context passed to a custom card render function.
 */
export interface LeListCardRenderContext {
  /**
   * Renders a value the same way as its table cell, marked with `data-le-field`
   * so it can move between the table and the card in layout transitions.
   */
  value: (key: string) => any;

  /** Reference to the hosting le-list element */
  list: HTMLElement;
}

/**
 * Card layout configuration. Without it, a card shows the label as the title and the description below.
 */
export interface LeListCardConfig {
  /** Card lines from top to bottom */
  rows?: LeListCardRow[];

  /** Separator between several values in one slot. Defaults to ' · '. */
  separator?: string;

  /**
   * Fully custom card content. Return JSX or an HTML string.
   * Mark elements with `data-le-field="<key>"` to animate them between layouts.
   */
  render?: (item: LeOption, context: LeListCardRenderContext) => any;
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

/**
 * Context provided to action execution handlers and dynamic predicates.
 */
export interface LeActionContext {
  /** Target item on which the action was invoked (if row-specific) */
  item?: LeOption;
  /** Currently selected items in the list */
  selectedItems: LeOption[];
  /** Currently selected item IDs */
  selectedIds: string[];
  /** Reference to the hosting le-list element */
  list: HTMLElement;
  /** Source event that triggered the action */
  event?: Event;
  /** Row index if applicable */
  index?: number;
  /** Count of selected items */
  count?: number;
}

/**
 * Definition of an action that can be performed on list items or the list as a whole.
 */
export interface LeListAction {
  /** Unique action identifier (e.g., 'edit', 'delete', 'create-child', 'duplicate') */
  id: string;

  /** Display label for 1 item or default (e.g. 'Delete', 'Edit') */
  label: string;

  /**
   * Label used when multiple items are selected.
   * Can be a template string with "{count}" or a function: (count: number) => string.
   * E.g. "Delete {count} items" or (count) => `Delete ${count} items`
   */
  labelMultiple?: string | ((count: number) => string);

  /** Icon name, URL, or emoji (e.g. 'trash', 'pencil', 'plus') */
  icon?: string;

  /** Semantic color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | string */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | string;

  /**
   * Action execution handler. Can be asynchronous.
   */
  handler?: (item: LeOption, context: LeActionContext) => void | Promise<void>;

  /**
   * Dynamic disabled predicate or boolean.
   */
  disabled?: boolean | ((item: LeOption, context: LeActionContext) => boolean);

  /**
   * Dynamic hidden predicate or boolean.
   */
  hidden?: boolean | ((item: LeOption, context: LeActionContext) => boolean);

  /**
   * Selection requirements for external toolbars and multi-selection:
   * - 'single': Enabled only when exactly 1 item is selected (e.g. 'edit', 'rename')
   * - 'multiple': Enabled only when 2 or more items are selected (e.g. 'merge', 'compare')
   * - 'both': Enabled when 1 or more items are selected (e.g. 'delete', 'archive')
   * - 'none': Enabled only when nothing is selected (e.g. 'select-all')
   * - 'any': Always enabled, regardless of selection (e.g. 'create-new', 'refresh'); same as not set
   */
  selectionMode?: 'single' | 'multiple' | 'both' | 'none' | 'any';

  /**
   * Visual separator line before or after this action in menus.
   */
  separator?: 'before' | 'after' | boolean;

  /** Optional keyboard shortcut display representation (e.g. 'Del', 'Cmd+D') */
  shortcut?: string;

  /** Optional direct link URL if the action acts as navigation */
  href?: string;
  target?: string;

  /** Custom metadata passthrough */
  data?: Record<string, unknown>;
}

/**
 * Event detail payload emitted on 'le-list:action-state'
 */
export interface LeListActionStateDetail {
  listId: string;
  selectedCount: number;
  selectedItems: LeOption[];
  selectedIds: string[];
  actions: Record<
    string,
    {
      action: LeListAction;
      enabled: boolean;
      hidden: boolean;
      label: string;
    }
  >;
  unloaded?: boolean;
}

/**
 * Event detail payload emitted on 'le-list:trigger-action'
 */
export interface LeListTriggerActionDetail {
  action: string;
  listIds?: string[];
  source?: HTMLElement;
}


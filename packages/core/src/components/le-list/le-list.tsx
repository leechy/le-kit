import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import type { LeOption } from '../../types/options';
import type { LeColumn } from '../../types/list';
import { buildDeclarativeOptionsFromChildren, observeNamedSlotPresence, parseOptionInput } from '../../utils/utils';

@Component({
  tag: 'le-list',
  styleUrl: 'le-list.css',
  shadow: true,
})
export class LeList {
  @Element() el!: HTMLElement;

  /**
   * Data items to display in the list.
   * Can be an array of `LeOption` objects or a JSON string.
   * If omitted or empty, top-level `<le-item>` child elements will be parsed.
   */
  @Prop() data: LeOption[] | string = [];

  /**
   * Column configuration for the list table view.
   * Can be an array of `LeColumn` objects or a JSON string.
   * If omitted, columns will be automatically generated from data item properties.
   */
  @Prop() columns: LeColumn[] | string = [];

  /**
   * Whether clicking a sorted column header a 3rd time clears sorting back to unsorted.
   * Defaults to true.
   */
  @Prop() allowClearSort: boolean = true;

  /**
   * Default sort icon placement across columns ('start' | 'end' | 'none').
   * If omitted, right-aligned columns default to 'start' and left/center columns default to 'end'.
   */
  @Prop() defaultSortIconPosition?: 'start' | 'end' | 'none';

  /**
   * Whether to enable right-click context menu on table header row to toggle column visibility.
   * Defaults to false.
   */
  @Prop() columnVisibilityToggle: boolean = false;

  /**
   * Alias for columnVisibilityToggle.
   */
  @Prop() allowColumnToggle: boolean = false;

  /**
   * Main label text for default empty state (<le-empty>).
   */
  @Prop() emptyLabel?: string;

  /**
   * Title text for default empty state (<le-empty>).
   */
  @Prop() emptyTitle?: string;

  /**
   * Secondary description text for default empty state (<le-empty>).
   */
  @Prop() emptyMessage?: string;

  /**
   * Icon for default empty state (<le-empty>).
   */
  @Prop() emptyIcon?: string;

  @State() parsedOptions: LeOption[] = [];
  @State() parsedColumns: LeColumn[] = [];
  @State() sortColumnKey: string | undefined;
  @State() sortDirection: 'asc' | 'desc' | undefined;
  @State() private slotPresence: Record<string, boolean> = {};

  /**
   * Emitted when column sorting changes.
   */
  @Event() leSortChange!: EventEmitter<{ key?: string; column?: LeColumn; direction?: 'asc' | 'desc' }>;

  /**
   * Emitted when column visibility changes via the context menu.
   */
  @Event() leColumnVisibilityChange!: EventEmitter<{ columns: LeColumn[]; toggledColumn: LeColumn; hidden: boolean }>;

  private childrenObserver?: MutationObserver;
  private disconnectSlotObserver?: () => void;

  @Watch('data')
  async handleDataChange() {
    await this.loadDataAndColumns();
  }

  @Watch('columns')
  async handleColumnsChange() {
    await this.loadColumns();
  }

  async componentWillLoad() {
    await this.loadDataAndColumns();
  }

  connectedCallback() {
    this.setupChildrenObserver();
    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['empty'],
      presence => {
        this.slotPresence = { ...presence };
      },
    );
  }

  disconnectedCallback() {
    this.childrenObserver?.disconnect();
    this.disconnectSlotObserver?.();
  }

  private setupChildrenObserver() {
    this.childrenObserver = new MutationObserver(async () => {
      // Re-evaluate declarative children if data prop is empty
      const rawData = parseOptionInput(this.data, 'le-list', 'data');
      if (rawData.length === 0) {
        await this.loadDataAndColumns();
      }
    });

    this.childrenObserver.observe(this.el, {
      childList: true,
      subtree: false,
    });
  }

  private async loadDataAndColumns() {
    const rawDataOptions = parseOptionInput(this.data, 'le-list', 'data');

    if (rawDataOptions.length > 0) {
      this.parsedOptions = rawDataOptions;
    } else {
      const declarative = await buildDeclarativeOptionsFromChildren(this.el, 'le-list');
      this.parsedOptions = declarative.options;
    }

    await this.loadColumns();
  }

  private async loadColumns() {
    let cols: LeColumn[] = [];

    if (typeof this.columns === 'string') {
      try {
        cols = JSON.parse(this.columns);
      } catch {
        try {
          // eslint-disable-next-line @typescript-eslint/no-implied-eval
          const fn = new Function(`return ${this.columns}`);
          const evaluated = fn();
          cols = Array.isArray(evaluated) ? evaluated : [];
        } catch {
          cols = [];
        }
      }
    } else if (Array.isArray(this.columns)) {
      cols = this.columns;
    }

    if (cols.length > 0) {
      this.parsedColumns = cols;
    } else {
      this.parsedColumns = this.generateDefaultColumns();
    }
  }

  private generateDefaultColumns(): LeColumn[] {
    if (this.parsedOptions.length === 0) {
      return [{ key: 'label', label: 'Label', sortable: true }];
    }

    const firstItem = this.parsedOptions[0];
    const cols: LeColumn[] = [];

    if (firstItem.label !== undefined) {
      cols.push({ key: 'label', label: 'Label', sortable: true, type: 'string' });
    }

    if (firstItem.description) {
      cols.push({ key: 'description', label: 'Description', sortable: true, type: 'string' });
    }

    if (firstItem.value !== undefined && firstItem.value !== firstItem.label) {
      cols.push({ key: 'value', label: 'Value', sortable: true, type: 'string' });
    }

    if (firstItem.data && typeof firstItem.data === 'object') {
      Object.keys(firstItem.data).forEach(dataKey => {
        const val = firstItem.data?.[dataKey];
        let type: string = 'string';
        if (typeof val === 'number') type = 'number';
        else if (typeof val === 'boolean') type = 'boolean';

        cols.push({
          key: `data.${dataKey}`,
          label: this.capitalize(dataKey),
          sortable: true,
          type,
        });
      });
    }

    return cols.length > 0 ? cols : [{ key: 'label', label: 'Label', sortable: true }];
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getItemValue(item: LeOption, key: string): any {
    if (!key) return undefined;

    // Handle nested dot notation, e.g. "data.role" or "data.user.email"
    if (key.includes('.')) {
      const parts = key.split('.');
      let current: any = item;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    }

    // Check top-level LeOption properties first
    if (key in item) {
      return (item as any)[key];
    }

    // Fallback to item.data[key] if present
    if (item.data && typeof item.data === 'object' && key in item.data) {
      return item.data[key];
    }

    return undefined;
  }

  private handleSort(col: LeColumn) {
    if (!col.sortable) return;

    const initialDir: 'asc' | 'desc' = col.defaultSortDirection || 'asc';
    const oppositeDir: 'asc' | 'desc' = initialDir === 'asc' ? 'desc' : 'asc';
    const canClear = col.allowClearSort ?? this.allowClearSort;

    if (this.sortColumnKey === col.key) {
      if (this.sortDirection === initialDir) {
        this.sortDirection = oppositeDir;
      } else if (this.sortDirection === oppositeDir) {
        if (canClear) {
          this.sortColumnKey = undefined;
          this.sortDirection = undefined;
        } else {
          this.sortDirection = initialDir;
        }
      } else {
        this.sortDirection = initialDir;
      }
    } else {
      this.sortColumnKey = col.key;
      this.sortDirection = initialDir;
    }

    this.leSortChange.emit({
      key: this.sortColumnKey,
      column: col,
      direction: this.sortDirection,
    });
  }

  private getSortedOptions(): LeOption[] {
    if (!this.sortColumnKey || !this.sortDirection) {
      return this.parsedOptions;
    }

    const col = this.parsedColumns.find(c => c.key === this.sortColumnKey);
    const colType = col?.type || 'string';
    const key = this.sortColumnKey;
    const isAsc = this.sortDirection === 'asc';

    return [...this.parsedOptions].sort((a, b) => {
      if (col?.sortFn) {
        return col.sortFn(a, b, this.sortDirection!);
      }

      const valA = this.getItemValue(a, key);
      const valB = this.getItemValue(b, key);

      if (valA === undefined || valA === null) return isAsc ? 1 : -1;
      if (valB === undefined || valB === null) return isAsc ? -1 : 1;

      if (colType === 'number') {
        const numA = Number(valA);
        const numB = Number(valB);
        return isAsc ? numA - numB : numB - numA;
      }

      if (colType === 'date') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return isAsc ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }

  private renderHeaderCell(col: LeColumn) {
    const isSorted = this.sortColumnKey === col.key && !!this.sortDirection;
    const isRightAligned = col.align === 'right' || (col.type === 'number' && !col.align);
    const alignClass = `align-${col.align || (col.type === 'number' ? 'right' : 'left')}`;

    const iconPos: 'start' | 'end' | 'none' =
      col.sortIconPosition ||
      this.defaultSortIconPosition ||
      (isRightAligned ? 'start' : 'end');

    const sortIconElement = col.sortable && iconPos !== 'none' ? (
      <span class="le-list-sort-icon">
        {isSorted ? (
          this.sortDirection === 'asc' ? (
            <le-icon name="sort-asc" size="14" />
          ) : (
            <le-icon name="sort-desc" size="14" />
          )
        ) : (
          <le-icon name="sort" size="14" />
        )}
      </span>
    ) : null;

    const headerLabel = col.label || this.capitalize(col.key.replace('data.', ''));

    return (
      <th
        class={{
          'le-list-th': true,
          'sortable': !!col.sortable,
          'sorted': isSorted,
          [alignClass]: true,
        }}
        style={col.width ? { width: col.width } : undefined}
        onClick={() => this.handleSort(col)}
        part="header-cell"
      >
        <div class={`le-list-th-content icon-${iconPos}`}>
          {iconPos === 'start' && sortIconElement}
          <span>{headerLabel}</span>
          {iconPos === 'end' && sortIconElement}
        </div>
      </th>
    );
  }

  private getTagColor(color?: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' {
    const validColors = ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'];
    if (color && validColors.includes(color)) {
      return color as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    }
    return 'primary';
  }

  private renderCellValue(col: LeColumn, item: LeOption) {
    const rawVal = this.getItemValue(item, col.key);

    if (col.format) {
      return col.format(rawVal, item);
    }

    if (rawVal === undefined || rawVal === null) {
      return '';
    }

    if (col.type === 'badge' || col.type === 'tag') {
      return <le-tag label={String(rawVal)} color={this.getTagColor(item.color)} size="small" />;
    }

    if (col.type === 'boolean') {
      return rawVal ? (
        <le-icon name="check" size="20" color="var(--le-color-success)" />
      ) : (
        <le-icon name="clear" size="20" color="var(--le-color-secondary)" />
      );
    }

    if (col.type === 'date' && rawVal) {
      try {
        const d = new Date(rawVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString();
        }
      } catch {
        // Fallback to raw string
      }
    }

    const iconName = item.icon || item.iconStart;
    const isLabelColumn = col.key === 'label' || col.key === 'name';

    if (isLabelColumn) {
      return (
        <div class="le-list-cell-inner">
          {iconName && (
            <span class="le-list-icon">
              {iconName.length <= 4 && !iconName.includes('-') && !iconName.includes('/') ? (
                <span>{iconName}</span>
              ) : (
                <le-icon name={iconName} size="18" />
              )}
            </span>
          )}
          <div class="le-list-cell-text-group">
            <span class="le-list-cell-label">{String(rawVal)}</span>
            {item.description && <span class="le-list-cell-description">{item.description}</span>}
          </div>
        </div>
      );
    }

    return String(rawVal);
  }

  private getColumnContextMenuItems(): LeOption[] {
    const visibleCount = this.parsedColumns.filter(c => !c.hidden).length;

    return this.parsedColumns.map(col => {
      const isHidden = !!col.hidden;
      const isNonToggleable = col.toggleable === false;
      const isLastRemainingVisible = !isHidden && visibleCount <= 1;

      return {
        id: col.key,
        value: col.key,
        label: col.label || this.capitalize(col.key.replace('data.', '')),
        checked: !isHidden,
        disabled: isNonToggleable || isLastRemainingVisible,
      };
    });
  }

  private handleColumnVisibilityToggle(item: LeOption) {
    const targetKey = item.value || item.id;
    if (!targetKey) return;

    const visibleCount = this.parsedColumns.filter(c => !c.hidden).length;

    let toggledCol: LeColumn | undefined;
    const updatedCols = this.parsedColumns.map(col => {
      if (col.key === targetKey) {
        if (col.toggleable === false) return col;
        if (!col.hidden && visibleCount <= 1) return col;
        toggledCol = { ...col, hidden: !col.hidden };
        return toggledCol;
      }
      return col;
    });

    if (toggledCol) {
      this.parsedColumns = updatedCols;
      this.leColumnVisibilityChange.emit({
        columns: [...this.parsedColumns],
        toggledColumn: toggledCol,
        hidden: !!toggledCol.hidden,
      });
    }
  }

  private renderEmptyState(colSpan: number) {
    const hasSlot = this.slotPresence['empty'];
    const hasEmptyProps = !!(this.emptyLabel || this.emptyTitle || this.emptyMessage || this.emptyIcon);

    if (hasSlot) {
      return (
        <tr>
          <td class="le-list-empty-cell" colSpan={colSpan}>
            <slot name="empty" />
          </td>
        </tr>
      );
    }

    if (hasEmptyProps) {
      return (
        <tr>
          <td class="le-list-empty-cell" colSpan={colSpan}>
            <slot name="empty" />
            <le-empty
              icon={this.emptyIcon}
              label={this.emptyLabel || this.emptyTitle}
              message={this.emptyMessage}
            />
          </td>
        </tr>
      );
    }

    // Always render <slot name="empty" /> in hidden row if unused, so slotted elements are detected & projected instantly
    return (
      <tr style={{ display: 'none' }}>
        <td class="le-list-empty-cell" colSpan={colSpan}>
          <slot name="empty" />
        </td>
      </tr>
    );
  }

  render() {
    const visibleColumns = this.parsedColumns.filter(c => !c.hidden);
    const displayOptions = this.getSortedOptions();

    const isColumnToggleEnabled = this.columnVisibilityToggle || this.allowColumnToggle;

    const headerRow = (
      <thead class="le-list-thead" part="header">
        <tr>{visibleColumns.map(col => this.renderHeaderCell(col))}</tr>
      </thead>
    );

    return (
      <Host>
        {/* Hidden slot for declarative child options */}
        <div style={{ display: 'none' }}>
          <slot />
        </div>

        <div class="le-list-table-container">
          <div class="le-list-table-scroll">
            <table class="le-list-table">
              {isColumnToggleEnabled ? (
                <le-context-menu
                  items={this.getColumnContextMenuItems()}
                  onLeContextMenuSelect={(e) => this.handleColumnVisibilityToggle(e.detail.item)}
                >
                  {headerRow}
                </le-context-menu>
              ) : (
                headerRow
              )}
              <tbody class="le-list-tbody">
                {displayOptions.length === 0
                  ? this.renderEmptyState(visibleColumns.length)
                  : displayOptions.map((item, rowIndex) => (
                      <tr key={item.id || item.value || rowIndex}>
                        {visibleColumns.map(col => {
                          const alignClass = `align-${col.align || (col.type === 'number' ? 'right' : 'left')}`;
                          return <td class={`le-list-td ${alignClass}`}>{this.renderCellValue(col, item)}</td>;
                        })}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </Host>
    );
  }
}

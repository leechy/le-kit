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
   * Default initial sort direction for sortable columns on first click ('asc' | 'desc').
   * Individual columns can override this via their `sortStart` property.
   * Defaults to 'asc'.
   */
  @Prop() defaultSortDirection: 'asc' | 'desc' = 'asc';

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
   * Whether to allow column reordering via right-click header context menu.
   * Defaults to false.
   */
  @Prop() columnReorder: boolean = false;

  /**
   * Alias for columnReorder.
   */
  @Prop() allowColumnReorder: boolean = false;

  /**
   * Row separation style: 'none' | 'borders' | 'zebra'.
   * Defaults to 'zebra'.
   */
  @Prop() rowSeparators: 'none' | 'borders' | 'zebra' = 'zebra';

  /**
   * Column separation style: 'none' | 'borders' | 'zebra'.
   * Defaults to 'none'.
   */
  @Prop() columnSeparators: 'none' | 'borders' | 'zebra' = 'none';

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
  @State() private openState: Record<string, boolean> = {};

  /**
   * Emitted when column sorting changes.
   */
  @Event() leSortChange!: EventEmitter<{ key?: string; column?: LeColumn; direction?: 'asc' | 'desc' }>;

  /**
   * Emitted when column visibility changes via the context menu.
   */
  @Event() leColumnVisibilityChange!: EventEmitter<{ columns: LeColumn[]; toggledColumn: LeColumn; hidden: boolean }>;

  /**
   * Emitted when column order changes via the context menu.
   */
  @Event() leColumnOrderChange!: EventEmitter<{ columns: LeColumn[]; draggedColumn: LeColumn; targetColumn?: LeColumn }>;

  /**
   * Emitted when a hierarchical row item is expanded or collapsed.
   */
  @Event() leItemToggle!: EventEmitter<{ item: LeOption; open: boolean; originalEvent?: MouseEvent }>;

  private childrenObserver?: MutationObserver;
  private disconnectSlotObserver?: () => void;
  private renderedRowCount = 0;

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
    if (Array.isArray(this.columns) && this.columns.length > 0) {
      this.parsedColumns = this.columns;
      return;
    }

    if (typeof this.columns === 'string' && this.columns.trim() !== '') {
      try {
        const parsed = JSON.parse(this.columns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.parsedColumns = parsed;
          return;
        }
      } catch (err) {
        console.warn('[le-list] Failed to parse columns JSON string:', err);
      }
    }

    // Auto-generate columns from data item properties if none provided
    this.parsedColumns = this.generateFallbackColumns();
  }

  private generateFallbackColumns(): LeColumn[] {
    if (!this.parsedOptions || this.parsedOptions.length === 0) {
      return [];
    }

    const firstItem = this.parsedOptions[0];
    const generated: LeColumn[] = [];

    // Always add label column first
    generated.push({
      key: 'label',
      label: 'Label',
      type: 'string',
      sortable: true,
    });

    // Check properties inside `item.data`
    if (firstItem.data && typeof firstItem.data === 'object') {
      for (const [propKey, value] of Object.entries(firstItem.data)) {
        let inferredType: 'string' | 'number' | 'date' | 'boolean' | 'badge' = 'string';

        if (typeof value === 'number') {
          inferredType = 'number';
        } else if (typeof value === 'boolean') {
          inferredType = 'boolean';
        } else if (typeof value === 'string') {
          const dateTest = new Date(value);
          if (!isNaN(dateTest.getTime()) && value.length >= 8 && (value.includes('-') || value.includes('/'))) {
            inferredType = 'date';
          }
        }

        generated.push({
          key: `data.${propKey}`,
          label: this.capitalize(propKey),
          type: inferredType,
          sortable: true,
          align: inferredType === 'number' ? 'right' : inferredType === 'boolean' ? 'center' : 'left',
        });
      }
    }

    return generated;
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1').trim();
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

    const initialDir: 'asc' | 'desc' = col.sortStart || this.defaultSortDirection || 'asc';
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

    const sortTree = (items: LeOption[]): LeOption[] => {
      const sorted = [...items].sort((a, b) => {
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

      return sorted.map(item => {
        if (Array.isArray(item.children) && item.children.length > 0) {
          return {
            ...item,
            children: sortTree(item.children),
          };
        }
        return item;
      });
    };

    return sortTree(this.parsedOptions);
  }

  private renderHeaderCell(col: LeColumn, colIndex: number) {
    const isSorted = this.sortColumnKey === col.key && !!this.sortDirection;
    const isRightAligned = col.align === 'right' || (col.type === 'number' && !col.align);
    const alignClass = `align-${col.align || (col.type === 'number' ? 'right' : 'left')}`;
    const isColOdd = colIndex % 2 !== 0;

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
      <div
        class={{
          'le-list-th': true,
          'sortable': !!col.sortable,
          'sorted': isSorted,
          'col-odd': isColOdd,
          'col-even': !isColOdd,
          [alignClass]: true,
        }}
        onClick={() => this.handleSort(col)}
        part="header-cell"
        role="columnheader"
      >
        <div class={`le-list-th-content icon-${iconPos}`}>
          {iconPos === 'start' && sortIconElement}
          <span>{headerLabel}</span>
          {iconPos === 'end' && sortIconElement}
        </div>
      </div>
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
              {iconName.length < 4 && !iconName.includes('-') && !iconName.includes('/') ? (
                <span>{iconName}</span>
              ) : (
                <le-icon name={iconName} />
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

  private getChildItems(item: LeOption): LeOption[] {
    if (Array.isArray(item.children)) {
      return item.children;
    }
    return [];
  }

  private isItemOpen(item: LeOption, id: string): boolean {
    if (typeof this.openState[id] === 'boolean') {
      return this.openState[id];
    }
    return !!item.open;
  }

  private handleToggleRow = (e: MouseEvent, item: LeOption, id: string) => {
    e.stopPropagation();
    const nextState = !this.isItemOpen(item, id);
    this.openState = {
      ...this.openState,
      [id]: nextState,
    };
    this.leItemToggle.emit({
      item,
      open: nextState,
      originalEvent: e,
    });
  };

  private getGridTemplate(visibleColumns: LeColumn[]): string {
    if (visibleColumns.length === 0) return '1fr';
    return visibleColumns
      .map(col => {
        if (col.width) return col.width;
        if (col.key === 'label' || col.key === 'name') {
          return '1.5fr';
        }
        return '1fr';
      })
      .join(' ');
  }

  private hasHierarchy(): boolean {
    return this.parsedOptions.some(item => this.getChildItems(item).length > 0);
  }

  private renderRowItem(
    item: LeOption,
    depth = 0,
    path = '',
    isVisible = true,
    isHierarchical = false
  ): any {
    const visibleColumns = this.parsedColumns.filter(c => !c.hidden);
    const id = String(item.id ?? item.value ?? path);
    const children = this.getChildItems(item);
    const hasChildren = children.length > 0;
    const isOpen = this.isItemOpen(item, id);

    let isOdd = false;
    if (isVisible) {
      this.renderedRowCount++;
      isOdd = this.renderedRowCount % 2 !== 0;
    }

    return (
      <div class="le-list-row-item" key={id} role="none">
        <div
          class={{
            'le-list-tr': true,
            'le-list-row-main': true,
            'row-odd': isVisible ? isOdd : false,
            'row-even': isVisible ? !isOdd : false,
            'has-children': hasChildren,
            'is-open': isOpen,
          }}
          role="row"
        >
          {visibleColumns.map((col, colIndex) => {
            const isFirstCol = colIndex === 0;
            const isColOdd = colIndex % 2 !== 0;
            const alignClass = `align-${col.align || (col.type === 'number' ? 'right' : 'left')}`;
            const indentCalc = `calc(var(--le-list-item-padding-x) + ${depth} * var(--le-list-item-indent))`;

            return (
              <div
                class={{
                  'le-list-td': true,
                  [alignClass]: true,
                  'is-first-cell': isFirstCol && isHierarchical,
                  'col-odd': isColOdd,
                  'col-even': !isColOdd,
                }}
                role="cell"
              >
                {isFirstCol &&
                  isHierarchical &&
                  (hasChildren ? (
                    <span
                      class="le-list-row-toggle"
                      style={{ paddingLeft: indentCalc }}
                      onClick={(e) => this.handleToggleRow(e, item, id)}
                      role="button"
                      tabIndex={-1}
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                      aria-expanded={isOpen ? 'true' : 'false'}
                    >
                      <le-icon name="chevron-down" class={{ 'le-list-chevron': true, 'open': isOpen }} aria-hidden="true" />
                    </span>
                  ) : (
                    <span
                      class="le-list-toggle-spacer"
                      style={{ paddingLeft: indentCalc }}
                      aria-hidden="true"
                    />
                  ))}
                {this.renderCellValue(col, item)}
              </div>
            );
          })}
        </div>

        {hasChildren && (
          <le-collapse closed={!isOpen} noFading={true}>
            <div class="le-list-row-children" role="rowgroup">
              {children.map((child, childIdx) =>
                this.renderRowItem(child, depth + 1, `${id}.${childIdx}`, isVisible && isOpen, isHierarchical)
              )}
            </div>
          </le-collapse>
        )}
      </div>
    );
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

  private handleColumnReorder(detail: any) {
    if (!detail || !Array.isArray(detail.items)) return;

    const newOrderKeys = detail.items.map((item: LeOption) => item.value || item.id);

    const colMap = new Map(this.parsedColumns.map(c => [c.key, c]));
    const reorderedCols: LeColumn[] = [];

    for (const key of newOrderKeys) {
      if (key && colMap.has(key)) {
        reorderedCols.push(colMap.get(key)!);
        colMap.delete(key);
      }
    }

    for (const col of colMap.values()) {
      reorderedCols.push(col);
    }

    this.parsedColumns = reorderedCols;

    const draggedKey = detail.draggedId || (detail.item ? detail.item.value || detail.item.id : undefined);
    const draggedCol = this.parsedColumns.find(c => c.key === draggedKey);
    const targetCol = detail.targetId ? this.parsedColumns.find(c => c.key === detail.targetId) : undefined;

    if (draggedCol) {
      this.leColumnOrderChange.emit({
        columns: [...this.parsedColumns],
        draggedColumn: draggedCol,
        targetColumn: targetCol,
      });
    }
  }

  private renderEmptyState() {
    const hasSlot = this.slotPresence['empty'];
    const hasEmptyProps = !!(this.emptyLabel || this.emptyTitle || this.emptyMessage || this.emptyIcon);

    if (hasSlot) {
      return (
        <div class="le-list-empty-cell">
          <slot name="empty" />
        </div>
      );
    }

    if (hasEmptyProps) {
      return (
        <div class="le-list-empty-cell">
          <slot name="empty" />
          <le-empty icon={this.emptyIcon} label={this.emptyLabel || this.emptyTitle} message={this.emptyMessage} />
        </div>
      );
    }

    // Always render <slot name="empty" /> in hidden container if unused
    return (
      <div style={{ display: 'none' }}>
        <slot name="empty" />
      </div>
    );
  }

  render() {
    const visibleColumns = this.parsedColumns.filter(c => !c.hidden);
    const displayOptions = this.getSortedOptions();
    this.renderedRowCount = 0;

    const gridTemplate = this.getGridTemplate(visibleColumns);

    const isColumnToggleEnabled = this.columnVisibilityToggle || this.allowColumnToggle;
    const isColumnReorderEnabled = this.columnReorder || this.allowColumnReorder;

    const rowSep = this.rowSeparators || 'zebra';
    const colSep = this.columnSeparators || 'none';
    const isGridiron = rowSep === 'zebra' && colSep === 'zebra';

    const headerRow = (
      <div class="le-list-thead" part="header" role="rowgroup">
        <div class="le-list-tr" role="row">
          {visibleColumns.map((col, colIndex) => this.renderHeaderCell(col, colIndex))}
        </div>
      </div>
    );

    const isHierarchical = this.hasHierarchy();

    return (
      <Host>
        {/* Hidden slot for declarative child options */}
        <div style={{ display: 'none' }}>
          <slot />
        </div>

        <div class="le-list-table-container">
          <div class="le-list-table-scroll">
            <div
              class={{
                'le-list-table': true,
                'has-hierarchy': isHierarchical,
                [`row-sep-${rowSep}`]: true,
                [`col-sep-${colSep}`]: true,
                'is-gridiron': isGridiron,
              }}
              role="table"
              style={{ '--le-list-grid-template': gridTemplate }}
            >
              {isColumnToggleEnabled || isColumnReorderEnabled ? (
                <le-context-menu
                  items={this.getColumnContextMenuItems()}
                  reorder={isColumnReorderEnabled ? 'siblings' : 'none'}
                  onLeContextMenuSelect={(e) => this.handleColumnVisibilityToggle(e.detail.item)}
                  onLeContextMenuReorder={(e) => this.handleColumnReorder(e.detail)}
                >
                  {headerRow}
                </le-context-menu>
              ) : (
                headerRow
              )}
              <div class="le-list-tbody" role="rowgroup">
                {displayOptions.length === 0
                  ? this.renderEmptyState()
                  : displayOptions.map((item, rowIndex) => this.renderRowItem(item, 0, String(rowIndex), true, isHierarchical))}
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

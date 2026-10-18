import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import type { LeOption } from '../../types/options';
import type {
  LeColumn,
  LeListItemReorderDetail,
  LeListReorderMode,
  LeListAction,
  LeActionContext,
  LeListActionStateDetail,
  LeListCardConfig,
  LeListCardRow,
  LeListLayout,
} from '../../types/list';
import { dispatchActionState, subscribeTriggerAction } from '../../utils/action-bus';
import type { LeOverflowMenuItemSelectDetail } from '../le-overflow-menu/le-overflow-menu';
import { buildDeclarativeOptionsFromChildren, isEditableTarget, observeNamedSlotPresence, parseOptionInput } from '../../utils/utils';
import {
  findNodeInTree,
  getNodeDepth,
  getOutdentAncestors,
  getSubtreeDepth,
  isDescendantOf,
  reorderDeclarativeDomNodes,
  reorderTreeItem,
} from '../../utils/tree';

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
  @Prop({ mutable: true }) data: LeOption[] | string = [];

  /**
   * Column configuration for the list table view.
   * Can be an array of `LeColumn` objects or a JSON string.
   * If omitted, columns will be automatically generated from data item properties.
   */
  @Prop({ mutable: true }) columns: LeColumn[] | string = [];

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

  /**
   * Whether to disable row highlighting on hover.
   * Defaults to false (row hover highlighting is enabled by default).
   */
  @Prop({ reflect: true }) disableRowHover: boolean = false;

  /**
   * Whether to disable keyboard navigation.
   * Defaults to false.
   */
  @Prop({ reflect: true }) disableKeyboardNavigation: boolean = false;

  /**
   * Selection mode for rows: false / 'none' (disabled), true / 'single', or 'multiple'.
   * Defaults to false.
   */
  @Prop({ reflect: true }) selection: boolean | 'single' | 'multiple' | 'none' = false;

  /**
   * Whether to display chevron-right icon at the end of rows that have actions or links.
   * Defaults to false.
   */
  @Prop({ reflect: true }) showActionChevron: boolean = false;

  /**
   * Alias for showActionChevron.
   */
  @Prop({ reflect: true }) actionChevron: boolean = false;

  /**
   * Actions available for the list items and external components.
   * Can be an array of `LeListAction` objects or a JSON string.
   */
  @Prop({ mutable: true }) actions: LeListAction[] | string = [];

  /**
   * Whether to enable right-click context menu on item rows with their available actions.
   * Defaults to false.
   */
  @Prop({ reflect: true }) itemContextMenu: boolean = false;

  /**
   * Enables manual drag-and-drop reordering of list row items.
   * - 'none': Disabled (default)
   * - 'siblings': Can only reorder within current parent/root siblings
   * - 'nested': Can reorder across hierarchical levels (inside/outside parents)
   * Note: Can also be passed as boolean (true -> 'nested', false -> 'none').
   */
  @Prop({ reflect: true, mutable: true }) reorder: LeListReorderMode | boolean = 'none';

  /**
   * Whether to show the drag handle icon (`reorder-horizontal`) at the end of reorderable rows.
   * Default: false.
   */
  @Prop({ reflect: true }) showReorderHandle: boolean = false;

  /**
   * Configurable position target ratios for top (before), middle (inside), and bottom (after) drop zones.
   * Default: { top: 0.35, middle: 0.3, bottom: 0.35 }.
   */
  @Prop() reorderRatios: { top: number; middle: number; bottom: number } = {
    top: 0.35,
    middle: 0.3,
    bottom: 0.35,
  };

  /**
   * Maximum allowed nesting depth for drag-and-drop reordering.
   * When hovering over items at or deeper than this depth, children cannot be added (items split 50/50).
   */
  @Prop({ reflect: true }) maxReorderDepth?: number;

  /**
   * Delay in ms before automatically expanding a hovered collapsed item during drag-and-drop.
   */
  @Prop() reorderExpandDelay: number = 500;

  /**
   * Layout of the list: 'table' (default), 'cards', or 'auto' to switch to cards
   * when the list is narrower than `cardBreakpoint`.
   */
  @Prop({ reflect: true }) layout: LeListLayout = 'table';

  /**
   * Width in pixels below which the 'auto' layout shows cards.
   */
  @Prop() cardBreakpoint: number = 600;

  /**
   * Card layout configuration: lines of column keys, or a custom render function.
   * Can be a `LeListCardConfig` object or a JSON string. Without it, a card shows
   * the label as the title and the description below.
   */
  @Prop() card?: LeListCardConfig | string;

  /**
   * Animates switching between the table and cards: values marked with `data-le-field`
   * move from their cell to their place in the card and back.
   */
  @Prop() layoutTransition: boolean = false;

  @State() parsedOptions: LeOption[] = [];
  @State() private isCardLayout: boolean = false;
  @State() private isAnimatingLayout: boolean = false;
  @State() parsedColumns: LeColumn[] = [];
  @State() parsedActions: LeListAction[] = [];
  @State() contextMenuItemActions: LeOption[] = [];
  @State() sortColumnKey: string | undefined;
  @State() sortDirection: 'asc' | 'desc' | undefined;
  @State() focusedRowId?: string;
  @State() selectedRowIds: string[] = [];
  @State() private isSelecting: boolean = false;
  @State() private slotPresence: Record<string, boolean> = {};
  @State() private openState: Record<string, boolean> = {};

  @State() private userReorderedItems?: LeOption[];
  @State() private activeDragId?: string;
  @State() private dropTargetId?: string;
  @State() private dropPosition?: 'before' | 'inside' | 'after';
  @State() private isDraggingActive: boolean = false;
  @State() private ghostX: number = 0;
  @State() private ghostY: number = 0;
  @State() private isDeclarativeMode: boolean = false;

  private contextMenuTargetItem?: LeOption;
  private rowContextMenuRef?: HTMLElement;
  private unsubscribeTriggerAction?: () => void;
  private visualFocusActive: boolean = false;
  private dragSelectionStartId?: string;
  private pendingDragId?: string;
  private pendingDragItem?: LeOption;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private dragItemRect?: DOMRect;
  private dragJustEnded: boolean = false;
  private outdentBaselineX?: number;
  private outdentTargetId?: string;
  private overrideDropDepth?: number;
  private autoExpandTimer?: any;
  private hoveredExpandId?: string;
  private resizeObserver?: ResizeObserver;
  private hostWidth: number = 0;
  private renderWaiters: Array<() => void> = [];
  private layoutAnimations: Animation[] = [];
  private layoutRunId: number = 0;

  /**
   * Emitted when row selection changes.
   */
  @Event() leSelectionChange!: EventEmitter<{
    selectedIds: string[];
    selectedItems: LeOption[];
    isMultiple: boolean;
  }>;

  /**
   * Emitted when a row action or link is executed.
   */
  @Event() leAction!: EventEmitter<{ action?: string; item: LeOption; id: string; originalEvent?: Event }>;

  /**
   * Emitted when available actions or selection state changes on the list.
   */
  @Event() leActionStateChange!: EventEmitter<LeListActionStateDetail>;

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

  /**
   * Fired when list row items are reordered via drag and drop.
   */
  @Event() leItemReorder!: EventEmitter<LeListItemReorderDetail>;

  /**
   * Alias for `leItemReorder`.
   */
  @Event() leReorder!: EventEmitter<LeListItemReorderDetail>;

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

  @Watch('actions')
  handleActionsChange() {
    this.parseActions();
    this.emitActionState();
  }

  async componentWillLoad() {
    await this.loadDataAndColumns();
    this.isCardLayout = this.shouldUseCards();
  }

  componentDidLoad() {
    if (!this.el.hasAttribute('tabindex')) {
      this.el.setAttribute('tabindex', '0');
    }
  }

  componentDidRender() {
    const waiters = this.renderWaiters;
    this.renderWaiters = [];
    waiters.forEach(resolve => resolve());
  }

  @Watch('layout')
  @Watch('cardBreakpoint')
  handleLayoutChange() {
    this.updateLayout();
  }

  private shouldUseCards(): boolean {
    if (this.layout === 'cards') return true;
    if (this.layout === 'auto') return this.hostWidth > 0 && this.hostWidth < this.cardBreakpoint;
    return false;
  }

  private updateLayout(animate = true) {
    const useCards = this.shouldUseCards();
    if (useCards === this.isCardLayout) return;
    if (!animate) {
      this.isCardLayout = useCards;
      return;
    }
    void this.runLayoutTransition(() => {
      this.isCardLayout = useCards;
    });
  }

  private handleResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    const isFirstMeasure = this.hostWidth === 0;
    this.hostWidth = entry.contentRect.width;
    // The initial layout appears without animation
    this.updateLayout(!isFirstMeasure);
  };

  private waitForRender(): Promise<void> {
    return new Promise(resolve => this.renderWaiters.push(resolve));
  }

  /**
   * Applies a layout update with a FLIP animation: values marked with `data-le-field` move
   * from their old position (table cell or card slot) to the new one.
   *
   * Rules that keep it compatible with other animated components:
   * - only the marked element is animated, never rows, so transforms do not stack;
   * - plain text can be scaled, elements holding components only move — `le-visibility`,
   *   `le-toolbar` and `le-popover` measure with getBoundingClientRect(), and a scaled
   *   ancestor would distort their sizes;
   * - transforms are added on top of the element's own (`composite: 'add'`) and opacity is
   *   left to components, so CSS transitions like `le-visibility`'s keep working;
   * - a new switch cancels the running animation and starts from where values are now.
   */
  private async runLayoutTransition(update: () => void) {
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canAnimate = typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.animate === 'function';

    if (!this.layoutTransition || reducedMotion || !canAnimate) {
      update();
      return;
    }

    // Measure before cancelling, so an interrupted animation continues from the current spot
    const before = this.measureLayoutFields();
    this.layoutAnimations.forEach(animation => animation.cancel());
    this.layoutAnimations = [];
    const runId = ++this.layoutRunId;

    const rendered = this.waitForRender();
    this.isAnimatingLayout = true;
    update();
    await rendered;

    // A newer switch started while this one waited for the render: it animates instead
    if (runId !== this.layoutRunId) return;

    const after = this.measureLayoutFields();
    const timing = this.getLayoutAnimationTiming();
    const animations: Animation[] = [];

    after.forEach(({ el, rect, fontSize }, key) => {
      const previous = before.get(key);
      if (!previous) return;
      const from = previous.rect;

      const dx = from.left + from.width / 2 - (rect.left + rect.width / 2);
      const dy = from.top + from.height / 2 - (rect.top + rect.height / 2);
      // Text scales uniformly by the font size change: its box ratio differs between a wrapping
      // cell and a single card line, and a non-uniform scale would stretch the glyphs
      const scale = previous.fontSize && fontSize ? previous.fontSize / fontSize : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.01) return;

      const translate = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
      const transform = Math.abs(scale - 1) >= 0.01 ? `${translate} scale(${+scale.toFixed(3)})` : translate;
      animations.push(el.animate([{ transform }, { transform: 'none' }], { ...timing, composite: 'add' }));
    });

    this.layoutAnimations = animations;
    try {
      await Promise.all(animations.map(animation => animation.finished));
    } catch {
      // Cancelled by a newer switch, which takes over
      return;
    }
    if (runId === this.layoutRunId) {
      this.layoutAnimations = [];
      this.isAnimatingLayout = false;
    }
  }

  /**
   * Positions of visible `data-le-field` values, keyed by row id and field.
   * Values in collapsed groups and outside the viewport are skipped.
   */
  private measureLayoutFields(): Map<string, { el: HTMLElement; rect: DOMRect; fontSize?: number }> {
    const fields = new Map<string, { el: HTMLElement; rect: DOMRect; fontSize?: number }>();
    const root = this.el.shadowRoot;
    if (!root) return fields;
    const viewportHeight = window.innerHeight;

    root.querySelectorAll<HTMLElement>('.le-list-row-main[data-row-id]').forEach(row => {
      if (row.closest('le-collapse[data-open="false"]')) return;
      row.querySelectorAll<HTMLElement>('[data-le-field]').forEach(el => {
        if (el.closest('.le-list-row-main') !== row) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.top + rect.height < 0 || rect.top > viewportHeight) return;
        // Only plain text is scaled; elements holding components just move
        const fontSize = el.children.length === 0 ? Number.parseFloat(getComputedStyle(el).fontSize) || undefined : undefined;
        fields.set(`${row.dataset.rowId}\u0000${el.dataset.leField}`, { el, rect, fontSize });
      });
    });
    return fields;
  }

  private getLayoutAnimationTiming(): KeyframeAnimationOptions {
    const styles = getComputedStyle(this.el);
    const durationValue = styles.getPropertyValue('--le-transition-normal').trim();
    const parsed = Number.parseFloat(durationValue);
    const duration = Number.isFinite(parsed) ? (durationValue.endsWith('ms') ? parsed : parsed * 1000) : 250;
    const easing = styles.getPropertyValue('--le-easing-standard').trim() || 'ease-in-out';
    return { duration, easing };
  }

  private handleHostClick = () => {
    if (document.activeElement !== this.el) {
      this.el.focus();
    }
  };

  private getVisibleFlatRows(): Array<{
    item: LeOption;
    id: string;
    depth: number;
    hasChildren: boolean;
    isOpen: boolean;
    parentId?: string;
  }> {
    const rows: Array<{
      item: LeOption;
      id: string;
      depth: number;
      hasChildren: boolean;
      isOpen: boolean;
      parentId?: string;
    }> = [];
    const displayOptions = this.getSortedOptions();

    const traverse = (items: LeOption[], depth: number, parentPath: string, parentId?: string) => {
      items.forEach((item, index) => {
        const path = parentPath ? `${parentPath}.${index}` : String(index);
        const id = String(item.id ?? item.value ?? path);
        const children = this.getChildItems(item);
        const hasChildren = children.length > 0;
        const isOpen = this.isItemOpen(item, id);

        rows.push({
          item,
          id,
          depth,
          hasChildren,
          isOpen,
          parentId,
        });

        if (hasChildren && isOpen) {
          traverse(children, depth + 1, id, id);
        }
      });
    };

    traverse(displayOptions, 0, '');
    return rows;
  }

  private scrollToFocusedRow() {
    requestAnimationFrame(() => {
      const rowEl = this.el.shadowRoot?.querySelector(`[data-row-id="${this.focusedRowId}"]`) as HTMLElement | null;
      if (rowEl) {
        rowEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }

  private isSelectionEnabled(): boolean {
    return this.selection === true || this.selection === 'single' || this.selection === 'multiple';
  }

  private hasActions(): boolean {
    return this.parsedOptions.some(item => this.checkItemHasAction(item));
  }

  private checkItemHasAction(item: LeOption): boolean {
    if (item.action || (item as any).actions?.length || item.href) return true;
    const children = this.getChildItems(item);
    return children.some(c => this.checkItemHasAction(c));
  }

  private canNavigateRows(): boolean {
    if (this.disableKeyboardNavigation) return false;
    return this.isSelectionEnabled() || this.hasHierarchy() || this.hasActions();
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.canNavigateRows() || isEditableTarget(event.target)) {
      return;
    }

    const isNavKey = [
      'ArrowDown',
      'ArrowUp',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
      ' ',
    ].includes(event.key);
    if (!isNavKey && !((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')) return;

    const visibleRows = this.getVisibleFlatRows();
    if (visibleRows.length === 0) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && this.selection === 'multiple') {
      event.preventDefault();
      this.selectedRowIds = visibleRows.map(r => r.id);
      this.emitSelectionChange();
      return;
    }

    if (!this.visualFocusActive || !this.focusedRowId) {
      event.preventDefault();
      this.visualFocusActive = true;

      const targetRow = this.focusedRowId
        ? (visibleRows.find(r => r.id === this.focusedRowId) || (event.key === 'ArrowUp' ? visibleRows[visibleRows.length - 1] : visibleRows[0]))
        : (event.key === 'ArrowUp' ? visibleRows[visibleRows.length - 1] : visibleRows[0]);

      this.focusedRowId = targetRow.id;
      if (this.isSelectionEnabled() && this.selectedRowIds.length === 0) {
        this.selectedRowIds = [targetRow.id];
        this.dragSelectionStartId = targetRow.id;
        this.emitSelectionChange();
      }
      this.scrollToFocusedRow();
      return;
    }

    const currentIndex = visibleRows.findIndex(r => r.id === this.focusedRowId);
    const currentRow = currentIndex >= 0 ? visibleRows[currentIndex] : undefined;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % visibleRows.length : 0;
        const targetId = visibleRows[nextIndex].id;
        this.focusedRowId = targetId;
        this.scrollToFocusedRow();

        if (this.selection === 'multiple' && event.shiftKey) {
          const anchorId = this.dragSelectionStartId || (currentIndex >= 0 ? visibleRows[currentIndex].id : targetId);
          if (!this.dragSelectionStartId) this.dragSelectionStartId = anchorId;
          this.selectRange(anchorId, targetId);
        } else if (this.isSelectionEnabled()) {
          this.dragSelectionStartId = targetId;
          this.selectedRowIds = [targetId];
          this.emitSelectionChange();
        }
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex =
          currentIndex >= 0
            ? (currentIndex - 1 + visibleRows.length) % visibleRows.length
            : visibleRows.length - 1;
        const targetId = visibleRows[prevIndex].id;
        this.focusedRowId = targetId;
        this.scrollToFocusedRow();

        if (this.selection === 'multiple' && event.shiftKey) {
          const anchorId = this.dragSelectionStartId || (currentIndex >= 0 ? visibleRows[currentIndex].id : targetId);
          if (!this.dragSelectionStartId) this.dragSelectionStartId = anchorId;
          this.selectRange(anchorId, targetId);
        } else if (this.isSelectionEnabled()) {
          this.dragSelectionStartId = targetId;
          this.selectedRowIds = [targetId];
          this.emitSelectionChange();
        }
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        if (!currentRow) return;

        if (currentRow.hasChildren && !currentRow.isOpen) {
          this.toggleRowOpen(currentRow.item, currentRow.id, true, event);
        } else if (currentRow.hasChildren && currentRow.isOpen) {
          const nextIndex = currentIndex + 1;
          if (nextIndex < visibleRows.length && visibleRows[nextIndex].parentId === currentRow.id) {
            this.focusedRowId = visibleRows[nextIndex].id;
            this.scrollToFocusedRow();
          }
        }
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        if (!currentRow) return;

        if (currentRow.hasChildren && currentRow.isOpen) {
          this.toggleRowOpen(currentRow.item, currentRow.id, false, event);
        } else if (currentRow.depth > 0 && currentRow.parentId) {
          this.focusedRowId = currentRow.parentId;
          this.scrollToFocusedRow();
        }
        break;
      }

      case 'Home': {
        event.preventDefault();
        const targetId = visibleRows[0].id;
        this.focusedRowId = targetId;
        this.scrollToFocusedRow();
        if (this.isSelectionEnabled() && !event.shiftKey) {
          this.dragSelectionStartId = targetId;
          this.selectedRowIds = [targetId];
          this.emitSelectionChange();
        }
        break;
      }

      case 'End': {
        event.preventDefault();
        const targetId = visibleRows[visibleRows.length - 1].id;
        this.focusedRowId = targetId;
        this.scrollToFocusedRow();
        if (this.isSelectionEnabled() && !event.shiftKey) {
          this.dragSelectionStartId = targetId;
          this.selectedRowIds = [targetId];
          this.emitSelectionChange();
        }
        break;
      }

      case 'Enter': {
        if (!currentRow) return;
        if (currentRow.item.action || currentRow.item.href) {
          event.preventDefault();
          this.executeItemAction(currentRow.item, currentRow.id, event);
        } else if (currentRow.hasChildren) {
          event.preventDefault();
          this.toggleRowOpen(currentRow.item, currentRow.id, !currentRow.isOpen, event);
        }
        break;
      }

      case ' ': {
        if (currentRow && currentRow.hasChildren) {
          event.preventDefault();
          this.toggleRowOpen(currentRow.item, currentRow.id, !currentRow.isOpen, event);
        }
        break;
      }
    }
  }

  private getSelectedItems(): LeOption[] {
    const visibleRows = this.getVisibleFlatRows();
    const selectedSet = new Set(this.selectedRowIds);
    return visibleRows.filter(r => selectedSet.has(r.id)).map(r => r.item);
  }

  private emitSelectionChange() {
    const selectedItems = this.getSelectedItems();

    this.leSelectionChange.emit({
      selectedIds: [...this.selectedRowIds],
      selectedItems,
      isMultiple: this.selection === 'multiple',
    });

    this.emitActionState();
  }

  private selectRange(fromId: string, toId: string) {
    const visibleRows = this.getVisibleFlatRows();
    const fromIdx = visibleRows.findIndex(r => r.id === fromId);
    const toIdx = visibleRows.findIndex(r => r.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const rangeIds = visibleRows.slice(start, end + 1).map(r => r.id);

    this.selectedRowIds = rangeIds;
    this.emitSelectionChange();
  }

  private attachDragListeners() {
    window.addEventListener('pointerup', this.handleWindowPointerUp, { once: true });
    window.addEventListener('pointercancel', this.handleWindowPointerUp, { once: true });
  }

  private handleWindowPointerUp = () => {
    this.isSelecting = false;
  };

  /**
   * Programmatically set the reorder mode ('none', 'siblings', 'nested', or boolean).
   */
  @Method()
  async setReorder(mode: LeListReorderMode | boolean) {
    this.reorder = mode;
  }

  /**
   * Programmatically enable reordering.
   */
  @Method()
  async enableReorder(mode: LeListReorderMode = 'nested') {
    this.reorder = mode;
  }

  /**
   * Programmatically disable reordering.
   */
  @Method()
  async disableReorder() {
    this.reorder = 'none';
  }

  /**
   * Programmatically move an item relative to another item in the list tree.
   * Accepts item ID, value, or label for both dragged and target items.
   */
  @Method()
  async moveItem(
    draggedQuery: string,
    targetQuery: string,
    position: 'before' | 'inside' | 'after' = 'after',
  ): Promise<{ success: boolean; detail?: LeListItemReorderDetail }> {
    const items = [...this.getEffectiveOptions()];
    const draggedNode = findNodeInTree(items, draggedQuery);
    const targetNode = findNodeInTree(items, targetQuery);

    if (!draggedNode || !targetNode) {
      console.warn(`[le-list] moveItem: item not found ("${draggedQuery}" or "${targetQuery}")`);
      return { success: false };
    }

    const draggedId = String(draggedNode.item.id ?? draggedNode.item.value ?? '');
    const targetId = String(targetNode.item.id ?? targetNode.item.value ?? '');

    if (this.maxReorderDepth !== undefined) {
      const draggedSubtreeDepth = getSubtreeDepth(draggedNode.item);
      const targetDepth = getNodeDepth(items, targetId);
      const finalDepth = position === 'inside' ? targetDepth + 1 : targetDepth;
      if (finalDepth + draggedSubtreeDepth > this.maxReorderDepth) {
        console.warn(
          `[le-list] moveItem: cannot move item with subtree depth ${draggedSubtreeDepth} to depth ${finalDepth} (maxReorderDepth is ${this.maxReorderDepth})`,
        );
        return { success: false };
      }
    }

    const reorderResult = reorderTreeItem(
      items,
      draggedId,
      targetId,
      position,
      (id, open) => {
        this.openState = { ...this.openState, [id]: open };
      },
    );

    if (!reorderResult.success || !reorderResult.newItems) {
      return { success: false };
    }

    this.userReorderedItems = reorderResult.newItems;
    this.data = reorderResult.newItems;
    this.parsedOptions = reorderResult.newItems;

    if (this.isDeclarativeMode) {
      reorderDeclarativeDomNodes(
        reorderResult.draggedItem,
        reorderResult.targetItem,
        position,
      );
    }

    const detail: LeListItemReorderDetail = {
      item: reorderResult.draggedItem!,
      draggedId,
      targetItem: reorderResult.targetItem,
      targetId,
      position,
      oldParentId: reorderResult.oldParentId,
      newParentId: reorderResult.newParentId,
      items: reorderResult.newItems,
    };

    this.leItemReorder.emit(detail);
    this.leReorder.emit(detail);

    return { success: true, detail };
  }

  private findItemById(id: string): LeOption | undefined {
    const visibleRows = this.getVisibleFlatRows();
    const row = visibleRows.find(r => r.id === id || String(r.item.id ?? r.item.value ?? '') === id);
    if (row) return row.item;

    if (Array.isArray(this.data)) {
      const found = this.data.find((item: any) => String(item.id ?? item.value ?? '') === id);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Programmatically set the currently selected row IDs.
   */
  @Method()
  async setSelectedRows(ids: string[]): Promise<void> {
    this.selectedRowIds = [...ids];
    this.emitSelectionChange();
  }

  /**
   * Programmatically execute an action on target items or current selection.
   */
  @Method()
  async executeAction(
    actionId: string,
    itemOrId?: string | LeOption | LeOption[],
    event?: Event,
  ): Promise<boolean> {
    const selItems = this.getSelectedItems();
    let targetItem: LeOption | undefined;

    if (typeof itemOrId === 'string') {
      targetItem = this.findItemById(itemOrId);
    } else if (itemOrId) {
      targetItem = Array.isArray(itemOrId) ? itemOrId[0] : itemOrId;
    } else if (selItems.length > 0) {
      targetItem = selItems[0];
    }

    let action: LeListAction | undefined;
    if (targetItem) {
      const itemActions = this.getResolvedItemActions(targetItem, selItems);
      action = itemActions.find(a => a.id === actionId);
    }
    if (!action) {
      action = this.parsedActions.find(a => a.id === actionId);
    }

    if (!action) {
      console.warn(`[le-list] Action "${actionId}" not found.`);
      return false;
    }

    if (this.isActionDisabled(action, targetItem)) {
      return false;
    }

    // OS-like targeting: an explicit array is used as is; a single row that belongs to the
    // current selection (or no row at all) acts on the whole selection; any other row acts alone.
    const targetInSelection = !!targetItem && selItems.includes(targetItem);
    const allTargets = Array.isArray(itemOrId)
      ? itemOrId
      : !itemOrId || targetInSelection
        ? selItems
        : targetItem
          ? [targetItem]
          : [];

    const targetId = targetItem ? String(targetItem.id ?? targetItem.value ?? '') : '';

    this.leAction.emit({
      action: actionId,
      item: targetItem || (allTargets[0] ?? ({} as LeOption)),
      id: targetId,
      originalEvent: event,
    });

    if (action.handler) {
      const ctx: LeActionContext = {
        item: targetItem,
        selectedItems: allTargets,
        selectedIds: allTargets.map(t => String(t.id ?? t.value ?? '')),
        list: this.el,
        event,
        count: allTargets.length,
      };
      await action.handler(targetItem || allTargets[0] || ({} as LeOption), ctx);
    }
    return true;
  }

  /**
   * Retrieve currently available actions, optionally filtered to target item or current selection.
   */
  @Method()
  async getAvailableActions(target?: string | LeOption | boolean): Promise<LeListAction[]> {
    let targetItem: LeOption | undefined;
    if (typeof target === 'string') {
      targetItem = this.findItemById(target);
    } else if (target && typeof target === 'object') {
      targetItem = target;
    } else if (target === true) {
      const sel = this.getSelectedItems();
      targetItem = sel[0];
    }

    if (targetItem) {
      const sel = this.getSelectedItems();
      return this.getResolvedItemActions(targetItem, sel);
    }

    // Otherwise, resolve across list actions and selection
    const sel = this.getSelectedItems();
    if (sel.length > 0) {
      return this.getResolvedItemActions(sel[0], sel);
    }

    const count = this.selectedRowIds.length;
    return this.parsedActions
      .filter(act => !this.isActionHidden(act))
      .map(act => ({
        ...act,
        disabled: this.isActionDisabled(act),
        label: this.resolveActionLabel(act, count),
      }));
  }

  /**
   * Programmatically attach this list to an external toolbar by ID or element reference.
   */
  @Method()
  async attachToToolbar(toolbarIdOrEl: string | HTMLElement): Promise<void> {
    const toolbar = typeof toolbarIdOrEl === 'string'
      ? document.getElementById(toolbarIdOrEl) as any
      : toolbarIdOrEl as any;
    if (toolbar && typeof toolbar.attachList === 'function' && this.el.id) {
      await toolbar.attachList(this.el.id);
    }
  }

  /**
   * Programmatically detach this list from an external toolbar by ID or element reference.
   */
  @Method()
  async detachFromToolbar(toolbarIdOrEl: string | HTMLElement): Promise<void> {
    const toolbar = typeof toolbarIdOrEl === 'string'
      ? document.getElementById(toolbarIdOrEl) as any
      : toolbarIdOrEl as any;
    if (toolbar && typeof toolbar.detachList === 'function' && this.el.id) {
      await toolbar.detachList(this.el.id);
    }
  }

  private parseActions() {
    if (Array.isArray(this.actions)) {
      this.parsedActions = this.actions;
      return;
    }
    if (typeof this.actions === 'string' && this.actions.trim() !== '') {
      try {
        const parsed = JSON.parse(this.actions);
        if (Array.isArray(parsed)) {
          this.parsedActions = parsed;
          return;
        }
      } catch (err) {
        console.warn('[le-list] Failed to parse actions JSON string:', err);
      }
    }
    this.parsedActions = [];
  }

  private resolveActionLabel(action: LeListAction, count: number): string {
    if (count > 1 && action.labelMultiple) {
      if (typeof action.labelMultiple === 'function') {
        return action.labelMultiple(count);
      }
      if (typeof action.labelMultiple === 'string') {
        return action.labelMultiple.replace('{count}', String(count));
      }
      return `${action.label} (${count})`;
    }
    return action.label;
  }

  private isActionDisabled(action: LeListAction, item?: LeOption): boolean {
    if (item?.disabled) return true;

    const count = this.selectedRowIds.length;
    const mode = action.selectionMode;

    if (mode === 'single' && count !== 1) {
      return true;
    }
    if (mode === 'multiple' && count <= 1) {
      return true;
    }
    if (mode === 'both' && count < 1) {
      return true;
    }
    if (mode === 'none' && count !== 0) {
      return true;
    }

    if (typeof action.disabled === 'function') {
      const baseItem = item || (this.getSelectedItems()[0] ?? ({} as LeOption));
      const ctx: LeActionContext = {
        item: baseItem,
        selectedItems: this.getSelectedItems(),
        selectedIds: this.selectedRowIds,
        list: this.el,
        count,
      };
      const hybridItem = Object.assign(Object.create(baseItem), ctx);
      return action.disabled(hybridItem, ctx);
    }

    return !!action.disabled;
  }

  private isActionHidden(action: LeListAction, item?: LeOption): boolean {
    if (typeof action.hidden === 'function') {
      const count = this.selectedRowIds.length;
      const baseItem = item || (this.getSelectedItems()[0] ?? ({} as LeOption));
      const ctx: LeActionContext = {
        item: baseItem,
        selectedItems: this.getSelectedItems(),
        selectedIds: this.selectedRowIds,
        list: this.el,
        count,
      };
      const hybridItem = Object.assign(Object.create(baseItem), ctx);
      return action.hidden(hybridItem, ctx);
    }
    return !!action.hidden;
  }

  private getResolvedItemActions(item?: LeOption, _selectedItems: LeOption[] = []): LeListAction[] {
    const itemActionsRaw = item && Array.isArray((item as any).actions) ? (item as any).actions : [];

    // 1. Item-level actions FIRST
    const itemActions: LeListAction[] = [];
    for (const raw of itemActionsRaw) {
      if (typeof raw === 'string') {
        const found = this.parsedActions.find(a => a.id === raw);
        if (found) itemActions.push(found);
      } else if (raw && typeof raw === 'object' && raw.id) {
        const base = this.parsedActions.find(a => a.id === raw.id) || {};
        itemActions.push({ ...base, ...raw });
      }
    }

    // 2. List-level actions SECOND (excluding any overridden by item-level)
    const itemActionIds = new Set(itemActions.map(a => a.id));
    const listActions: LeListAction[] = this.parsedActions.filter(a => !itemActionIds.has(a.id));

    const combined: LeListAction[] = [...itemActions];

    // If both exist, add separator before first list-level action
    if (itemActions.length > 0 && listActions.length > 0) {
      const firstList = listActions[0];
      const withSep: LeListAction = {
        ...firstList,
        separator: firstList.separator ?? 'before',
      };
      combined.push(withSep, ...listActions.slice(1));
    } else {
      combined.push(...listActions);
    }

    const count = this.selectedRowIds.length;
    // Filter hidden and resolve labels and disabled state
    const visibleActions = combined.filter(act => !this.isActionHidden(act, item));

    return visibleActions.map((act, index) => {
      let sep = act.separator;
      if (index === 0 && (sep === 'before' || sep === true)) {
        sep = undefined;
      } else if (index === visibleActions.length - 1 && sep === 'after') {
        sep = undefined;
      }
      return {
        ...act,
        label: this.resolveActionLabel(act, count),
        disabled: this.isActionDisabled(act, item),
        separator: sep,
      };
    });
  }

  private emitActionState() {
    if (!this.el) return;
    const listId = this.el.id || '';
    const selItems = this.getSelectedItems();
    const count = selItems.length;

    const actionsMap: Record<string, LeListAction> = {};
    for (const act of this.parsedActions) {
      actionsMap[act.id] = act;
    }
    for (const item of selItems) {
      if (Array.isArray((item as any).actions)) {
        for (const act of (item as any).actions) {
          if (typeof act === 'object' && act.id) {
            actionsMap[act.id] = act as LeListAction;
          }
        }
      }
    }

    const actionStates: LeListActionStateDetail['actions'] = {};
    for (const [id, act] of Object.entries(actionsMap)) {
      const disabled = this.isActionDisabled(act, selItems[0]);
      const hidden = this.isActionHidden(act, selItems[0]);
      const label = this.resolveActionLabel(act, count);
      actionStates[id] = {
        action: act,
        enabled: !disabled && !hidden,
        hidden,
        label,
      };
    }

    const detail: LeListActionStateDetail = {
      listId,
      selectedCount: count,
      selectedItems: selItems,
      selectedIds: [...this.selectedRowIds],
      actions: actionStates,
    };

    this.leActionStateChange.emit(detail);
    dispatchActionState(this.el, detail);
  }

  private get activeReorderMode(): LeListReorderMode {
    // Drag-and-drop reordering is not supported in the card layout yet
    if (this.isCardLayout) {
      return 'none';
    }
    const val: any = this.reorder;
    if (typeof val === 'boolean') {
      return val ? 'nested' : 'none';
    }
    if (val === 'siblings' || val === 'nested') {
      return val;
    }
    if (val === '' || val === true || val === 'true') {
      return 'nested';
    }
    return 'none';
  }

  private getEffectiveOptions(): LeOption[] {
    if (this.userReorderedItems) {
      return this.userReorderedItems;
    }
    return this.parsedOptions;
  }

  private handleRowPointerDown = (e: PointerEvent, item: LeOption, id: string) => {
    if (e.button !== 0) return;

    // Toggles and action controls handle their own clicks: no selection change or drag start
    if ((e.target as HTMLElement).closest('.le-list-row-toggle, .le-list-actions-cell, .le-list-actions-overflow')) {
      return;
    }

    if (this.activeReorderMode !== 'none' && !item.disabled) {
      this.pendingDragId = id;
      this.pendingDragItem = item;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      const targetEl = (e.currentTarget as HTMLElement).closest('.le-list-row-main') as HTMLElement;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
        this.dragItemRect = rect;
      } else {
        this.dragOffsetX = 12;
        this.dragOffsetY = 12;
      }

      window.addEventListener('pointermove', this.handleGlobalPointerMove);
      window.addEventListener('pointerup', this.handleGlobalPointerUp);
      window.addEventListener('pointercancel', this.handleGlobalPointerUp);
    }

    if (!this.canNavigateRows()) return;

    // Prevent browser native text selection (especially on Shift+Click)
    if (e.shiftKey || this.isSelectionEnabled()) {
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
    }

    if (document.activeElement !== this.el) {
      this.el.focus();
    }

    this.focusedRowId = id;
    this.visualFocusActive = false;

    if (!this.isSelectionEnabled()) {
      return;
    }

    const isMultiple = this.selection === 'multiple';
    const isSingle = this.selection === true || this.selection === 'single';

    if (isMultiple) {
      if (e.shiftKey && this.selectedRowIds.length > 0) {
        const anchorId = this.dragSelectionStartId || this.selectedRowIds[0];
        this.selectRange(anchorId, id);
      } else if (e.ctrlKey || e.metaKey) {
        const next = new Set(this.selectedRowIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        this.selectedRowIds = Array.from(next);
        this.dragSelectionStartId = id;
        this.emitSelectionChange();
      } else {
        this.isSelecting = true;
        this.dragSelectionStartId = id;
        this.selectedRowIds = [id];
        this.emitSelectionChange();
        this.attachDragListeners();
      }
    } else if (isSingle) {
      this.isSelecting = true;
      this.dragSelectionStartId = id;
      this.selectedRowIds = [id];
      this.emitSelectionChange();
      this.attachDragListeners();
    }
  };

  private handleGlobalPointerMove = (e: PointerEvent) => {
    if (!this.pendingDragId || !this.pendingDragItem) return;

    if (!this.isDraggingActive) {
      const dist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
      if (dist < 4) return;

      this.isDraggingActive = true;
      this.activeDragId = this.pendingDragId;
      this.isSelecting = false;
      this.dragSelectionStartId = undefined;
    }

    this.ghostX = e.clientX - this.dragOffsetX;
    this.ghostY = e.clientY - this.dragOffsetY;

    let targetEl: HTMLElement | null = null;

    if (this.el.shadowRoot && typeof (this.el.shadowRoot as any).elementFromPoint === 'function') {
      const shadowTarget = (this.el.shadowRoot as any).elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (shadowTarget) {
        targetEl = shadowTarget.closest('.le-list-row-main') as HTMLElement;
      }
    }

    if (!targetEl) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elements) {
        const itemEl = el.closest('.le-list-row-main') as HTMLElement;
        if (itemEl && this.el.shadowRoot?.contains(itemEl)) {
          targetEl = itemEl;
          break;
        }
      }
    }

    if (!targetEl) {
      this.dropTargetId = undefined;
      this.dropPosition = undefined;
      this.clearAutoExpandTimer();
      return;
    }

    const targetId = targetEl.getAttribute('data-row-id');
    const targetParentId = targetEl.getAttribute('data-parent-id') || undefined;

    if (!targetId) {
      this.dropTargetId = undefined;
      this.dropPosition = undefined;
      this.clearAutoExpandTimer();
      return;
    }

    const items = this.getEffectiveOptions();
    if (isDescendantOf(items, this.activeDragId!, targetId)) {
      this.dropTargetId = undefined;
      this.dropPosition = undefined;
      this.clearAutoExpandTimer();
      return;
    }

    const mode = this.activeReorderMode;
    const targetRect = targetEl.getBoundingClientRect();
    const relY = e.clientY - targetRect.top;
    const ratio = relY / targetRect.height;

    if (mode === 'siblings') {
      const draggedNode = findNodeInTree(items, this.activeDragId!);
      if (draggedNode && draggedNode.parentId !== targetParentId) {
        this.dropTargetId = undefined;
        this.dropPosition = undefined;
        this.clearAutoExpandTimer();
        return;
      }
      this.dropTargetId = targetId;
      this.dropPosition = ratio < 0.5 ? 'before' : 'after';
      this.clearAutoExpandTimer();
      return;
    }

    if (mode === 'nested') {
      const ratios = this.reorderRatios || { top: 0.35, middle: 0.3, bottom: 0.35 };
      const topLimit = Math.max(0.05, Math.min(0.45, ratios.top));
      const bottomLimit = 1 - Math.max(0.05, Math.min(0.45, ratios.bottom));

      const draggedNode = findNodeInTree(items, this.activeDragId!);
      const draggedSubtreeDepth = draggedNode ? getSubtreeDepth(draggedNode.item) : 0;
      const targetDepth = getNodeDepth(items, targetId);
      const cannotNestInside = this.maxReorderDepth !== undefined && (targetDepth + draggedSubtreeDepth >= this.maxReorderDepth);
      const canPlaceAtTargetDepth = this.maxReorderDepth === undefined || (targetDepth + draggedSubtreeDepth <= this.maxReorderDepth);

      const isSelfTarget = targetId === this.activeDragId;

      if (isSelfTarget) {
        const outdentThreshold = cannotNestInside ? 0.5 : bottomLimit;
        if (ratio > outdentThreshold) {
          const rawOutdentChain = getOutdentAncestors(items, targetId);
          const outdentChain = rawOutdentChain.filter(
            node => this.maxReorderDepth === undefined || node.depth + draggedSubtreeDepth <= this.maxReorderDepth,
          );
          if (outdentChain.length > 0) {
            if (this.outdentTargetId !== targetId || this.outdentBaselineX === undefined) {
              this.outdentBaselineX = e.clientX;
              this.outdentTargetId = targetId;
            }
            const deltaX = e.clientX - this.outdentBaselineX;
            const steps = deltaX < 0 ? Math.floor(Math.abs(deltaX) / 24) : 0;
            const chainIndex = Math.min(steps, outdentChain.length - 1);
            const selected = outdentChain[chainIndex];
            this.dropTargetId = selected.id;
            this.dropPosition = 'after';
            this.overrideDropDepth = selected.depth;
            this.clearAutoExpandTimer();
            return;
          }
        }
        this.dropTargetId = undefined;
        this.dropPosition = undefined;
        this.outdentBaselineX = undefined;
        this.outdentTargetId = undefined;
        this.overrideDropDepth = undefined;
        this.clearAutoExpandTimer();
        return;
      }

      // If cannot nest inside (because targetDepth + 1 + draggedSubtreeDepth > maxReorderDepth), disable 'inside' and split 50/50
      if (cannotNestInside) {
        this.clearAutoExpandTimer();
        let finalTargetId: string | undefined = undefined;
        let pos: 'before' | 'inside' | 'after' | undefined = undefined;

        if (ratio < 0.5) {
          const prevItem = this.getPreviousVisibleItem(items, targetId);
          const prevAncestors = prevItem ? getOutdentAncestors(items, prevItem.id!) : [];
          const topChain: Array<{ id: string; depth: number; pos: 'before' | 'after' }> = [];
          if (canPlaceAtTargetDepth) {
            topChain.push({ id: targetId, depth: targetDepth, pos: 'before' });
          }
          if (prevAncestors.length > 1) {
            for (let i = prevAncestors.length - 2; i >= 0; i--) {
              if (this.maxReorderDepth === undefined || prevAncestors[i].depth + draggedSubtreeDepth <= this.maxReorderDepth) {
                topChain.push({ id: prevAncestors[i].id, depth: prevAncestors[i].depth, pos: 'after' });
              }
            }
          }

          if (topChain.length > 0) {
            if (topChain.length > 1) {
              if (this.outdentTargetId !== `top-${targetId}` || this.outdentBaselineX === undefined) {
                this.outdentBaselineX = e.clientX;
                this.outdentTargetId = `top-${targetId}`;
              }
              const deltaX = e.clientX - this.outdentBaselineX;
              const steps = deltaX > 0 ? Math.floor(deltaX / 24) : 0;
              const chainIndex = Math.min(steps, topChain.length - 1);
              const selected = topChain[chainIndex];

              finalTargetId = selected.id;
              pos = selected.pos;
              this.overrideDropDepth = selected.depth;
            } else {
              finalTargetId = topChain[0].id;
              pos = topChain[0].pos;
              this.overrideDropDepth = canPlaceAtTargetDepth ? undefined : topChain[0].depth;
              this.outdentBaselineX = undefined;
              this.outdentTargetId = undefined;
            }
          }
        } else {
          const rawOutdentChain = getOutdentAncestors(items, targetId);
          const outdentChain = rawOutdentChain.filter(
            node => this.maxReorderDepth === undefined || node.depth + draggedSubtreeDepth <= this.maxReorderDepth,
          );
          if (outdentChain.length > 0) {
            if (outdentChain.length > 1) {
              if (this.outdentTargetId !== targetId || this.outdentBaselineX === undefined) {
                this.outdentBaselineX = e.clientX;
                this.outdentTargetId = targetId;
              }
              const deltaX = e.clientX - this.outdentBaselineX;
              const steps = deltaX < 0 ? Math.floor(Math.abs(deltaX) / 24) : 0;
              const chainIndex = Math.min(steps, outdentChain.length - 1);
              const selected = outdentChain[chainIndex];

              finalTargetId = selected.id;
              pos = 'after';
              this.overrideDropDepth = selected.depth;
            } else {
              finalTargetId = outdentChain[0].id;
              pos = 'after';
              this.overrideDropDepth = canPlaceAtTargetDepth ? undefined : outdentChain[0].depth;
              this.outdentBaselineX = undefined;
              this.outdentTargetId = undefined;
            }
          }
        }

        this.dropTargetId = finalTargetId;
        this.dropPosition = pos;
        return;
      }

      const targetNode = findNodeInTree(items, targetId);
      const children = targetNode && Array.isArray(targetNode.item.children) ? targetNode.item.children : [];
      const hasChildren = children.length > 0;
      const firstChild = hasChildren ? children[0] : undefined;
      const isOpen = targetNode && this.isItemOpen(targetNode.item, targetId);

      let finalTargetId: string | undefined = targetId;
      let pos: 'before' | 'inside' | 'after' | undefined = 'inside';

      if (ratio < topLimit) {
        const prevItem = this.getPreviousVisibleItem(items, targetId);
        const prevAncestors = prevItem ? getOutdentAncestors(items, prevItem.id!) : [];
        const topChain: Array<{ id: string; depth: number; pos: 'before' | 'after' }> = [
          { id: targetId, depth: targetDepth, pos: 'before' },
        ];
        if (prevAncestors.length > 1) {
          for (let i = prevAncestors.length - 2; i >= 0; i--) {
            if (this.maxReorderDepth === undefined || prevAncestors[i].depth + draggedSubtreeDepth <= this.maxReorderDepth) {
              topChain.push({ id: prevAncestors[i].id, depth: prevAncestors[i].depth, pos: 'after' });
            }
          }
        }

        if (topChain.length > 1) {
          if (this.outdentTargetId !== `top-${targetId}` || this.outdentBaselineX === undefined) {
            this.outdentBaselineX = e.clientX;
            this.outdentTargetId = `top-${targetId}`;
          }
          const deltaX = e.clientX - this.outdentBaselineX;
          const steps = deltaX > 0 ? Math.floor(deltaX / 24) : 0;
          const chainIndex = Math.min(steps, topChain.length - 1);
          const selected = topChain[chainIndex];

          finalTargetId = selected.id;
          pos = selected.pos;
          this.overrideDropDepth = selected.depth;
        } else {
          pos = 'before';
          this.outdentBaselineX = undefined;
          this.outdentTargetId = undefined;
          this.overrideDropDepth = undefined;
        }
      } else if (hasChildren) {
        if (isOpen) {
          if (firstChild && firstChild.id && (this.maxReorderDepth === undefined || targetDepth + 1 + draggedSubtreeDepth <= this.maxReorderDepth)) {
            finalTargetId = firstChild.id;
            pos = 'before';
          } else {
            pos = 'inside';
          }
          this.outdentBaselineX = undefined;
          this.outdentTargetId = undefined;
          this.overrideDropDepth = undefined;
        } else {
          if (ratio > bottomLimit) {
            const rawOutdentChain = getOutdentAncestors(items, targetId);
            const outdentChain = rawOutdentChain.filter(
              node => this.maxReorderDepth === undefined || node.depth + draggedSubtreeDepth <= this.maxReorderDepth,
            );
            if (outdentChain.length > 1) {
              if (this.outdentTargetId !== targetId || this.outdentBaselineX === undefined) {
                this.outdentBaselineX = e.clientX;
                this.outdentTargetId = targetId;
              }
              const deltaX = e.clientX - this.outdentBaselineX;
              const steps = deltaX < 0 ? Math.floor(Math.abs(deltaX) / 24) : 0;
              const chainIndex = Math.min(steps, outdentChain.length - 1);
              const selected = outdentChain[chainIndex];

              finalTargetId = selected.id;
              pos = 'after';
              this.overrideDropDepth = selected.depth;
            } else {
              if (firstChild && firstChild.id && (this.maxReorderDepth === undefined || targetDepth + 1 + draggedSubtreeDepth <= this.maxReorderDepth)) {
                finalTargetId = firstChild.id;
                pos = 'before';
              } else {
                pos = 'inside';
              }
              this.outdentBaselineX = undefined;
              this.outdentTargetId = undefined;
              this.overrideDropDepth = undefined;
            }
            if (this.hoveredExpandId !== targetId) {
              this.clearAutoExpandTimer();
              this.hoveredExpandId = targetId;
              this.autoExpandTimer = setTimeout(() => {
                if (targetNode) {
                  this.toggleRowOpen(targetNode.item, targetId, true);
                }
              }, this.reorderExpandDelay);
            }
          } else {
            pos = 'inside';
            this.outdentBaselineX = undefined;
            this.outdentTargetId = undefined;
            this.overrideDropDepth = undefined;
            if (this.hoveredExpandId !== targetId) {
              this.clearAutoExpandTimer();
              this.hoveredExpandId = targetId;
              this.autoExpandTimer = setTimeout(() => {
                if (targetNode) {
                  this.toggleRowOpen(targetNode.item, targetId, true);
                }
              }, this.reorderExpandDelay);
            }
          }
        }
      } else {
        if (ratio > bottomLimit) {
          const rawOutdentChain = getOutdentAncestors(items, targetId);
          const outdentChain = rawOutdentChain.filter(
            node => this.maxReorderDepth === undefined || node.depth + draggedSubtreeDepth <= this.maxReorderDepth,
          );
          if (outdentChain.length > 1) {
            if (this.outdentTargetId !== targetId || this.outdentBaselineX === undefined) {
              this.outdentBaselineX = e.clientX;
              this.outdentTargetId = targetId;
            }
            const deltaX = e.clientX - this.outdentBaselineX;
            const steps = deltaX < 0 ? Math.floor(Math.abs(deltaX) / 24) : 0;
            const chainIndex = Math.min(steps, outdentChain.length - 1);
            const selected = outdentChain[chainIndex];

            finalTargetId = selected.id;
            pos = 'after';
            this.overrideDropDepth = selected.depth;
          } else if (outdentChain.length === 1) {
            finalTargetId = outdentChain[0].id;
            pos = 'after';
            this.overrideDropDepth = undefined;
            this.outdentBaselineX = undefined;
            this.outdentTargetId = undefined;
          } else {
            pos = 'inside';
            this.outdentBaselineX = undefined;
            this.outdentTargetId = undefined;
            this.overrideDropDepth = undefined;
          }
        } else {
          pos = 'inside';
          this.outdentBaselineX = undefined;
          this.outdentTargetId = undefined;
          this.overrideDropDepth = undefined;
          if (this.hoveredExpandId !== targetId) {
            this.clearAutoExpandTimer();
            this.hoveredExpandId = targetId;
            this.autoExpandTimer = setTimeout(() => {
              if (targetNode) {
                this.toggleRowOpen(targetNode.item, targetId, true);
              }
            }, this.reorderExpandDelay);
          }
        }
      }

      if (pos !== 'inside' && ratio < topLimit) {
        this.clearAutoExpandTimer();
      }

      this.dropTargetId = finalTargetId;
      this.dropPosition = pos;
    }
  };

  private clearAutoExpandTimer() {
    if (this.autoExpandTimer) {
      clearTimeout(this.autoExpandTimer);
      this.autoExpandTimer = undefined;
    }
    this.hoveredExpandId = undefined;
  }

  private handleGlobalPointerUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', this.handleGlobalPointerMove);
    window.removeEventListener('pointerup', this.handleGlobalPointerUp);
    window.removeEventListener('pointercancel', this.handleGlobalPointerUp);
    this.clearAutoExpandTimer();

    if (this.isDraggingActive && this.activeDragId && this.dropTargetId && this.dropPosition) {
      this.dragJustEnded = true;
      setTimeout(() => {
        this.dragJustEnded = false;
      }, 100);

      const items = [...this.getEffectiveOptions()];
      const reorderResult = reorderTreeItem(
        items,
        this.activeDragId,
        this.dropTargetId,
        this.dropPosition,
        (id, open) => {
          this.openState = { ...this.openState, [id]: open };
        },
      );

      if (reorderResult.success && reorderResult.newItems) {
        this.userReorderedItems = reorderResult.newItems;
        this.data = reorderResult.newItems;
        this.parsedOptions = reorderResult.newItems;

        if (this.isDeclarativeMode) {
          reorderDeclarativeDomNodes(
            reorderResult.draggedItem,
            reorderResult.targetItem,
            this.dropPosition,
          );
        }

        const detail: LeListItemReorderDetail = {
          item: reorderResult.draggedItem!,
          draggedId: this.activeDragId,
          targetItem: reorderResult.targetItem,
          targetId: this.dropTargetId,
          position: this.dropPosition,
          oldParentId: reorderResult.oldParentId,
          newParentId: reorderResult.newParentId,
          items: reorderResult.newItems,
          originalEvent: e,
        };

        this.leItemReorder.emit(detail);
        this.leReorder.emit(detail);
      }
    }

    this.isDraggingActive = false;
    this.pendingDragId = undefined;
    this.pendingDragItem = undefined;
    this.activeDragId = undefined;
    this.dropTargetId = undefined;
    this.dropPosition = undefined;
    this.outdentBaselineX = undefined;
    this.outdentTargetId = undefined;
    this.overrideDropDepth = undefined;
    this.isSelecting = false;
    this.dragSelectionStartId = undefined;
  };

  private getPreviousVisibleItem(items: LeOption[], targetId: string): LeOption | undefined {
    const list: LeOption[] = [];
    const traverse = (nodes: LeOption[], parentPath: string) => {
      nodes.forEach((node, index) => {
        const path = parentPath ? `${parentPath}.${index}` : String(index);
        const id = String(node.id ?? node.value ?? path);
        list.push({ ...node, id });
        if (
          Array.isArray(node.children) &&
          node.children.length > 0 &&
          this.isItemOpen(node, id)
        ) {
          traverse(node.children, id);
        }
      });
    };
    traverse(items, '');
    const idx = list.findIndex(item => item.id === targetId);
    return idx > 0 ? list[idx - 1] : undefined;
  }

  private handleRowPointerEnter = (_e: PointerEvent, _item: LeOption, id: string) => {
    if (this.isDraggingActive || !this.isSelecting) return;

    this.focusedRowId = id;

    const isMultiple = this.selection === 'multiple';
    const isSingle = this.selection === true || this.selection === 'single';

    if (isMultiple && this.dragSelectionStartId) {
      this.selectRange(this.dragSelectionStartId, id);
    } else if (isSingle) {
      this.selectedRowIds = [id];
      this.emitSelectionChange();
    }
  };

  private executeItemAction(item: LeOption, id: string, event?: Event) {
    if (item.disabled) return;

    if (item.action) {
      this.leAction.emit({
        action: item.action,
        item,
        id,
        originalEvent: event,
      });
    }

    if (item.href) {
      if (item.target === '_blank') {
        window.open(item.href, '_blank');
      } else if (item.target) {
        window.open(item.href, item.target);
      } else {
        window.location.href = item.href;
      }
    }
  }

  private handleRowClick = (e: MouseEvent, item: LeOption, id: string) => {
    if (item.disabled) return;
    if (this.dragJustEnded) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!this.canNavigateRows()) return;

    if (item.action || item.href) {
      this.executeItemAction(item, id, e);
    }
  };

  private handleRowContextMenu = (e: MouseEvent, item: LeOption, id: string) => {
    if (!this.itemContextMenu) return;
    if (item.disabled) return;

    e.preventDefault();
    e.stopPropagation();

    // OS-style behavior:
    // If clicked row is NOT in selection, select it exclusively.
    // If it IS already in selection, preserve the multi-selection.
    if (!this.selectedRowIds.includes(id)) {
      this.selectedRowIds = [id];
      this.focusedRowId = id;
      this.emitSelectionChange();
    }

    const selItems = this.getSelectedItems();
    const actions = this.getResolvedItemActions(item, selItems);
    if (!actions || actions.length === 0) return;

    const count = this.selectedRowIds.length;
    this.contextMenuItemActions = actions.map((act, index) => ({
      id: act.id,
      label: this.resolveActionLabel(act, count),
      iconStart: act.icon,
      color: act.color,
      disabled: this.isActionDisabled(act, item),
      separator:
        index === 0 && (act.separator === 'before' || act.separator === true)
          ? undefined
          : index === actions.length - 1 && act.separator === 'after'
          ? undefined
          : act.separator,
    }));
    this.contextMenuTargetItem = item;

    if (this.rowContextMenuRef) {
      (this.rowContextMenuRef as any).items = this.contextMenuItemActions;
      void (this.rowContextMenuRef as any).show(e.clientX, e.clientY, e);
    }
  };

  connectedCallback() {
    this.setupChildrenObserver();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.el);
    }
    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['empty'],
      presence => {
        this.slotPresence = { ...presence };
      },
    );
    this.unsubscribeTriggerAction = subscribeTriggerAction(this.el, detail => {
      if (detail.listIds && detail.listIds.length > 0) {
        if (!this.el.id || !detail.listIds.includes(this.el.id)) {
          return;
        }
      }
      void this.executeAction(detail.action);
    });
  }

  disconnectedCallback() {
    this.childrenObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.layoutAnimations.forEach(animation => animation.cancel());
    this.layoutAnimations = [];
    this.disconnectSlotObserver?.();
    this.unsubscribeTriggerAction?.();
    window.removeEventListener('pointermove', this.handleGlobalPointerMove);
    window.removeEventListener('pointerup', this.handleGlobalPointerUp);
    window.removeEventListener('pointercancel', this.handleGlobalPointerUp);
    this.clearAutoExpandTimer();

    dispatchActionState(this.el, {
      listId: this.el.id || '',
      selectedCount: 0,
      selectedItems: [],
      selectedIds: [],
      actions: {},
      unloaded: true,
    });
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
    this.userReorderedItems = undefined;
    const rawDataOptions = parseOptionInput(this.data, 'le-list', 'data');

    if (rawDataOptions.length > 0) {
      this.isDeclarativeMode = false;
      this.parsedOptions = rawDataOptions;
    } else {
      const declarative = await buildDeclarativeOptionsFromChildren(this.el, 'le-list');
      this.isDeclarativeMode = declarative.isDeclarativeMode;
      this.parsedOptions = declarative.options;
    }

    // Initialize selected rows from items if selection enabled and selectedRowIds is empty
    if (this.isSelectionEnabled() && this.selectedRowIds.length === 0) {
      const initialSelected: string[] = [];
      const collectSelected = (items: LeOption[], path: string) => {
        items.forEach((item, index) => {
          const itemPath = path ? `${path}.${index}` : String(index);
          const id = String(item.id ?? item.value ?? itemPath);
          if (item.selected) {
            initialSelected.push(id);
          }
          if (Array.isArray(item.children)) {
            collectSelected(item.children, id);
          }
        });
      };
      collectSelected(this.parsedOptions, '');
      if (initialSelected.length > 0) {
        this.selectedRowIds = this.selection === 'multiple' ? initialSelected : [initialSelected[0]];
      }
    }

    await this.loadColumns();
    this.parseActions();
    this.emitActionState();
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
    const baseOptions = this.getEffectiveOptions();
    if (!this.sortColumnKey || !this.sortDirection) {
      return baseOptions;
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

    return sortTree(baseOptions);
  }

  private renderHeaderCell(col: LeColumn, colIndex: number) {
    const isSorted = this.sortColumnKey === col.key && !!this.sortDirection;
    const isRightAligned = col.align === 'right' || (col.type === 'number' && !col.align);
    const alignClass = `align-${col.align || (col.type === 'number' || col.type === 'actions' ? 'right' : 'left')}`;
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

    const keyStr = col.key || col.id || '';
    const headerLabel = col.label || (col as any).name || (keyStr ? this.capitalize(keyStr.replace('data.', '')) : '');

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
    const colKey = col.key || col.id || '';
    const rawVal = colKey ? this.getItemValue(item, colKey) : undefined;

    if (col.render) {
      const rendered = col.render(rawVal, item, col, this.el);
      if (typeof rendered === 'string' && rendered.includes('<')) {
        return <span class="le-list-cell-custom" innerHTML={rendered} />;
      }
      return rendered;
    }

    if (col.format) {
      return col.format(rawVal, item);
    }

    if (col.type === 'actions') {
      return this.renderActionsCell(col, item);
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
    const isLabelColumn = this.isLabelColumn(col);

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
            <span class="le-list-cell-label" data-le-field={colKey}>{String(rawVal)}</span>
            {item.description && (
              <span class="le-list-cell-description" data-le-field="description">{item.description}</span>
            )}
          </div>
        </div>
      );
    }

    return String(rawVal);
  }

  private isLabelColumn(col: LeColumn): boolean {
    return col.key === 'label' || col.key === 'name';
  }

  /**
   * Table cell content. Values get a `data-le-field` wrapper so they can move to their card
   * position in layout transitions; the default label cell marks its own label and description.
   */
  private renderCellContent(col: LeColumn, item: LeOption) {
    const content = this.renderCellValue(col, item);
    const hasDefaultLabelMarkup = this.isLabelColumn(col) && !col.render && !col.format;
    if (col.type === 'actions' || hasDefaultLabelMarkup) {
      return content;
    }
    return (
      <span class="le-list-field" data-le-field={col.key || col.id || ''}>
        {content}
      </span>
    );
  }

  private getCardConfig(): LeListCardConfig {
    if (typeof this.card === 'string') {
      if (this.card.trim() === '') return {};
      try {
        return JSON.parse(this.card);
      } catch (err) {
        console.warn('[le-list] Failed to parse card JSON string:', err);
        return {};
      }
    }
    return this.card || {};
  }

  /**
   * A single value in a card, rendered like its table cell. Returns null for empty values.
   */
  private renderCardField(key: string, item: LeOption) {
    const col = this.parsedColumns.find(c => (c.key || c.id) === key);
    const rawVal = this.getItemValue(item, key);
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return null;
    }

    let content: any;
    if (!col || (this.isLabelColumn(col) && !col.render && !col.format)) {
      content = String(rawVal);
    } else {
      content = this.renderCellValue(col, item);
    }

    return (
      <span class="le-list-field" data-le-field={key}>
        {content}
      </span>
    );
  }

  private renderCardSlot(keys: string | string[] | undefined, item: LeOption, separator: string) {
    const fields = (Array.isArray(keys) ? keys : keys ? [keys] : [])
      .map(key => this.renderCardField(key, item))
      .filter(Boolean);

    return fields.flatMap((field, index) =>
      index === 0 ? [field] : [<span class="le-list-card-separator">{separator}</span>, field],
    );
  }

  private getCardTitleLines(rows: LeListCardRow[]): boolean[] {
    if (rows.some(row => row.size)) {
      return rows.map(row => row.size === 'title');
    }

    const primaryKey = this.parsedColumns.find(c => c.primary)?.key;
    const hasKey = (slot: string | string[] | undefined, key: string) =>
      Array.isArray(slot) ? slot.includes(key) : slot === key;
    const primaryIndex = primaryKey ? rows.findIndex(row => hasKey(row.start, primaryKey) || hasKey(row.end, primaryKey)) : -1;
    const titleIndex = primaryIndex >= 0 ? primaryIndex : rows.length <= 2 ? 0 : 1;

    return rows.map((_, index) => index === titleIndex);
  }

  private renderCardBody(item: LeOption) {
    const config = this.getCardConfig();

    if (config.render) {
      const rendered = config.render(item, {
        value: (key: string) => this.renderCardField(key, item),
        list: this.el,
      });
      if (typeof rendered === 'string') {
        return <div class="le-list-card-custom" innerHTML={rendered} />;
      }
      return <div class="le-list-card-custom">{rendered}</div>;
    }

    const rows: LeListCardRow[] = config.rows?.length
      ? config.rows
      : [{ start: 'label', size: 'title' }, { start: 'description' }];
    const separator = config.separator ?? ' · ';
    const titleLines = this.getCardTitleLines(rows);

    return rows.map((row, index) => {
      const start = this.renderCardSlot(row.start, item, separator);
      const end = this.renderCardSlot(row.end, item, separator);
      if (start.length === 0 && end.length === 0) return null;

      return (
        <div class={{ 'le-list-card-line': true, 'is-title': titleLines[index] }}>
          <div class="le-list-card-start">{start}</div>
          {end.length > 0 && <div class="le-list-card-end">{end}</div>}
        </div>
      );
    });
  }

  private renderCard(item: LeOption, id: string, isHierarchical: boolean, hasChildren: boolean, isOpen: boolean, hasAnyActions: boolean) {
    const actionsCol =
      this.getCardConfig().actions !== false ? this.parsedColumns.find(c => c.type === 'actions' && !c.hidden) : undefined;
    const hasActionChevron = this.showActionChevron || this.actionChevron;

    return (
      <div class="le-list-card" role="cell">
        {isHierarchical &&
          (hasChildren ? (
            <span
              class="le-list-row-toggle"
              onClick={(e) => this.handleToggleRow(e, item, id)}
              role="button"
              tabIndex={-1}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              aria-expanded={isOpen ? 'true' : 'false'}
            >
              <le-icon name="chevron-down" class={{ 'le-list-chevron': true, 'open': isOpen }} aria-hidden="true" />
            </span>
          ) : (
            <span class="le-list-toggle-spacer" aria-hidden="true" />
          ))}
        <div class="le-list-card-body">{this.renderCardBody(item)}</div>
        {actionsCol && (
          <div class="le-list-card-actions">{this.renderActionsCell({ ...actionsCol, maxVisibleActions: 0 }, item)}</div>
        )}
        {hasActionChevron && hasAnyActions && (
          <span class="le-list-row-action-chevron" aria-hidden="true">
            <le-icon name="chevron-right" />
          </span>
        )}
      </div>
    );
  }

  private renderActionsCell(col: LeColumn, item: LeOption) {
    const actions = this.getResolvedItemActions(item);
    if (!actions || actions.length === 0) return null;

    const maxVisible = col.maxVisibleActions !== undefined ? col.maxVisibleActions : 3;

    if (maxVisible === 0) {
      return (
        <div class="le-list-actions-cell" onClick={e => e.stopPropagation()}>
          {this.renderActionsOverflowMenu(actions, item)}
        </div>
      );
    }

    const visibleActions = actions.slice(0, maxVisible);
    const overflowActions = actions.slice(maxVisible);

    return (
      <div class="le-list-actions-cell" onClick={e => e.stopPropagation()}>
        {visibleActions.map(action => {
          const disabled = this.isActionDisabled(action, item);
          return (
            <le-button
              variant="clear"
              color={action.color as any}
              disabled={disabled}
              title={action.label}
              aria-label={action.label}
              iconOnly={action.icon}
              onClick={(e: any) => {
                e.stopPropagation();
                if (!disabled) {
                  void this.executeAction(action.id, item, e);
                }
              }}
            >
              {!action.icon && action.label}
            </le-button>
          );
        })}
        {overflowActions.length > 0 && this.renderActionsOverflowMenu(overflowActions, item)}
      </div>
    );
  }

  private renderActionsOverflowMenu(actions: LeListAction[], item: LeOption) {
    const menuItems: LeOption[] = actions.map((act, index) => ({
      id: act.id,
      label: act.label,
      iconStart: act.icon,
      color: act.color,
      disabled: this.isActionDisabled(act, item),
      separator:
        index === 0 && (act.separator === 'before' || act.separator === true)
          ? undefined
          : index === actions.length - 1 && act.separator === 'after'
          ? undefined
          : act.separator,
    }));

    return (
      <le-overflow-menu
        class="le-list-actions-overflow"
        items={menuItems}
        position="bottom"
        align="end"
        icon="ellipsis-horizontal"
        triggerAriaLabel="More actions"
        onClick={(e: MouseEvent) => e.stopPropagation()}
        onLeOverflowMenuItemSelect={(e: CustomEvent<LeOverflowMenuItemSelectDetail>) => {
          void this.executeAction(e.detail.id, item, e.detail.originalEvent);
        }}
      />
    );
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

  private toggleRowOpen = (item: LeOption, id: string, open: boolean, event?: Event) => {
    this.openState = {
      ...this.openState,
      [id]: open,
    };
    this.leItemToggle.emit({
      item,
      open,
      originalEvent: event instanceof MouseEvent ? event : undefined,
    });
  };

  private handleToggleRow = (e: MouseEvent, item: LeOption, id: string) => {
    e.stopPropagation();
    this.toggleRowOpen(item, id, !this.isItemOpen(item, id), e);
  };

  private getGridTemplate(visibleColumns: LeColumn[]): string {
    const hasActionCol = this.showActionChevron || this.actionChevron;
    const hasReorderCol = this.showReorderHandle && this.activeReorderMode !== 'none';
    if (visibleColumns.length === 0) {
      const extra: string[] = ['1fr'];
      if (hasReorderCol) extra.push('calc(var(--le-list-toggle-size) + var(--le-list-item-padding-x) * 2)');
      if (hasActionCol) extra.push('calc(var(--le-list-toggle-size) + var(--le-list-item-padding-x) * 2)');
      return extra.join(' ');
    }
    const cols = visibleColumns.map(col => {
      if (col.width) return col.width;
      if (col.key === 'label' || col.key === 'name') {
        return '1.5fr';
      }
      return '1fr';
    });
    if (hasReorderCol) {
      cols.push('calc(var(--le-list-toggle-size) + var(--le-list-item-padding-x) * 2)');
    }
    if (hasActionCol) {
      cols.push('calc(var(--le-list-toggle-size) + var(--le-list-item-padding-x) * 2)');
    }
    return cols.join(' ');
  }

  private hasHierarchy(): boolean {
    return this.getEffectiveOptions().some(item => this.getChildItems(item).length > 0);
  }

  private getSelectionPosition(id: string): { isFirst: boolean; isLast: boolean; isMiddle: boolean; isSingle: boolean } | undefined {
    if (!this.isSelectionEnabled() || !this.selectedRowIds.includes(id)) return undefined;
    const visibleRows = this.getVisibleFlatRows();
    const selectedIdSet = new Set(this.selectedRowIds);
    const idx = visibleRows.findIndex(r => r.id === id);
    if (idx < 0) return undefined;

    const prevSelected = idx > 0 && selectedIdSet.has(visibleRows[idx - 1].id);
    const nextSelected = idx < visibleRows.length - 1 && selectedIdSet.has(visibleRows[idx + 1].id);

    return {
      isFirst: !prevSelected && nextSelected,
      isLast: prevSelected && !nextSelected,
      isMiddle: prevSelected && nextSelected,
      isSingle: !prevSelected && !nextSelected,
    };
  }

  private renderRowItem(
    item: LeOption,
    depth = 0,
    path = '',
    isVisible = true,
    isHierarchical = false,
  ): any {
    const id = String(item.id ?? item.value ?? path);
    const children = this.getChildItems(item);
    const hasChildren = children.length > 0;
    const isOpen = this.isItemOpen(item, id);
    const isFocused = !this.isDraggingActive && this.canNavigateRows() && this.visualFocusActive && this.focusedRowId === id;
    const isSelected = !this.isDraggingActive && this.isSelectionEnabled() && this.selectedRowIds.includes(id);
    const selPos = isSelected ? this.getSelectionPosition(id) : undefined;
    const hasAction = !item.disabled && !!(item.action || item.href);
    const hasAnyActions = !item.disabled && (hasAction || (Array.isArray(item.actions) && item.actions.length > 0));

    const isDropTarget = this.isDraggingActive && this.dropTargetId === id;
    const activeDropDepth =
      isDropTarget && this.overrideDropDepth !== undefined
        ? this.overrideDropDepth
        : depth;
    const dropLinePaddingLeft = isHierarchical
      ? `calc(var(--le-list-item-padding-x) + ${activeDropDepth} * var(--le-list-item-indent) + var(--le-list-toggle-size))`
      : `calc(var(--le-list-item-padding-x) + ${activeDropDepth} * var(--le-list-item-indent))`;
    const isDraggedNode = this.isDraggingActive && this.activeDragId === id;

    let isOdd = false;
    if (isVisible) {
      this.renderedRowCount++;
      isOdd = this.renderedRowCount % 2 !== 0;
    }

    return (
      <div class="le-list-row-item" key={id} role="none">
        {isDropTarget && this.dropPosition === 'before' && (
          <div class="reorder-drop-line line-before" style={{ left: dropLinePaddingLeft }} />
        )}
        <div
          class={{
            'le-list-tr': true,
            'le-list-row-main': true,
            'row-odd': isVisible ? isOdd : false,
            'row-even': isVisible ? !isOdd : false,
            'has-children': hasChildren,
            'is-open': isOpen,
            'is-focused': isFocused,
            'is-selected': isSelected,
            'selected-single': !!selPos?.isSingle,
            'selected-start': !!selPos?.isFirst,
            'selected-middle': !!selPos?.isMiddle,
            'selected-end': !!selPos?.isLast,
            'is-selected-single': !!selPos?.isSingle,
            'is-selected-start': !!selPos?.isFirst,
            'is-selected-middle': !!selPos?.isMiddle,
            'is-selected-end': !!selPos?.isLast,
            'has-action': hasAction,
            'reorder-target-inside': isDropTarget && this.dropPosition === 'inside',
            'is-dragged-row': isDraggedNode,
            'is-dragged-item': isDraggedNode,
          }}
          data-row-id={id}
          data-parent-id={path.includes('.') ? path.substring(0, path.lastIndexOf('.')) : ''}
          data-depth={String(depth)}
          role="row"
          aria-selected={this.isSelectionEnabled() ? (isSelected ? 'true' : 'false') : undefined}
          onPointerDown={(e) => this.handleRowPointerDown(e, item, id)}
          onPointerEnter={(e) => this.handleRowPointerEnter(e, item, id)}
          onClick={(e) => this.handleRowClick(e, item, id)}
          onContextMenu={(e) => this.handleRowContextMenu(e, item, id)}
        >
          {this.isCardLayout
            ? this.renderCard(item, id, isHierarchical, hasChildren, isOpen, hasAnyActions)
            : this.renderTableCells(item, id, depth, isHierarchical, hasChildren, isOpen, hasAnyActions)}
        </div>

        {isDropTarget && this.dropPosition === 'after' && (
          <div class="reorder-drop-line line-after" style={{ left: dropLinePaddingLeft }} />
        )}

        {hasChildren && (
          <le-collapse closed={!isOpen} noFading={true}>
            <div class="le-list-row-children" role="rowgroup">
              {children.map((child, childIdx) =>
                this.renderRowItem(child, depth + 1, `${id}.${childIdx}`, isVisible && isOpen, isHierarchical),
              )}
            </div>
          </le-collapse>
        )}
      </div>
    );
  }

  private renderTableCells(
    item: LeOption,
    id: string,
    depth: number,
    isHierarchical: boolean,
    hasChildren: boolean,
    isOpen: boolean,
    hasAnyActions: boolean,
  ) {
    const visibleColumns = this.parsedColumns.filter(c => !c.hidden);
    const hasActionCol = this.showActionChevron || this.actionChevron;
    const hasReorderCol = this.showReorderHandle && this.activeReorderMode !== 'none';
    const reorderColIsOdd = visibleColumns.length % 2 !== 0;
    const actionColIsOdd = (visibleColumns.length + (hasReorderCol ? 1 : 0)) % 2 !== 0;

    return [
      ...visibleColumns.map((col, colIndex) => {
        const isFirstCol = colIndex === 0;
        const isColOdd = colIndex % 2 !== 0;
        const alignClass = `align-${col.align || (col.type === 'number' || col.type === 'actions' ? 'right' : 'left')}`;
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
            role={col.primary ? 'rowheader' : 'cell'}
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
                <span class="le-list-toggle-spacer" style={{ paddingLeft: indentCalc }} aria-hidden="true" />
              ))}
            {this.renderCellContent(col, item)}
          </div>
        );
      }),
      hasReorderCol && (
        <div
          class={{
            'le-list-td': true,
            'le-list-td-reorder': true,
            'align-center': true,
            'col-odd': reorderColIsOdd,
            'col-even': !reorderColIsOdd,
          }}
          role="cell"
        >
          <span class="le-list-reorder-handle" aria-hidden="true">
            <le-icon name="reorder-horizontal" />
          </span>
        </div>
      ),
      hasActionCol && (
        <div
          class={{
            'le-list-td': true,
            'le-list-td-action': true,
            'align-center': true,
            'col-odd': actionColIsOdd,
            'col-even': !actionColIsOdd,
          }}
          role="cell"
        >
          {hasAnyActions && (
            <span class="le-list-row-action-chevron" aria-hidden="true">
              <le-icon name="chevron-right" />
            </span>
          )}
        </div>
      ),
    ];
  }

  private getColumnContextMenuItems(): LeOption[] {
    const visibleCount = this.parsedColumns.filter(c => !c.hidden).length;

    return this.parsedColumns.map(col => {
      const isHidden = !!col.hidden;
      const isNonToggleable = col.toggleable === false;
      const isLastRemainingVisible = !isHidden && visibleCount <= 1;
      const colKey = col.key || col.id || '';

      return {
        id: colKey,
        value: colKey,
        label: col.label || col.name || (colKey ? this.capitalize(colKey.replace('data.', '')) : ''),
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
    const hasActionCol = this.showActionChevron || this.actionChevron;
    const hasReorderCol = this.showReorderHandle && this.activeReorderMode !== 'none';
    const reorderColIndex = visibleColumns.length;
    const reorderColIsOdd = reorderColIndex % 2 !== 0;
    const actionColIndex = visibleColumns.length + (hasReorderCol ? 1 : 0);
    const actionColIsOdd = actionColIndex % 2 !== 0;

    const headerRow = (
      <div class="le-list-thead" part="header" role="rowgroup">
        <div class="le-list-tr" role="row">
          {visibleColumns.map((col, colIndex) => this.renderHeaderCell(col, colIndex))}
          {hasReorderCol && (
            <div
              class={{
                'le-list-th': true,
                'le-list-th-reorder': true,
                'col-odd': reorderColIsOdd,
                'col-even': !reorderColIsOdd,
              }}
              role="columnheader"
              aria-hidden="true"
            />
          )}
          {hasActionCol && (
            <div
              class={{
                'le-list-th': true,
                'le-list-th-action': true,
                'col-odd': actionColIsOdd,
                'col-even': !actionColIsOdd,
              }}
              role="columnheader"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    );

    const isHierarchical = this.hasHierarchy();

    return (
      <Host onClick={this.handleHostClick}>
        {/* Hidden slot for declarative child options */}
        <div style={{ display: 'none' }}>
          <slot />
        </div>

        <div
          class={{
            'le-list-table-container': true,
            'is-cards': this.isCardLayout,
            'is-animating-layout': this.isAnimatingLayout,
          }}
        >
          <div class="le-list-table-scroll">
            <div
              class={{
                'le-list-table': true,
                'has-hierarchy': isHierarchical,
                'has-row-hover': !this.disableRowHover,
                'is-selecting': this.isSelecting,
                'is-reorderable': this.activeReorderMode !== 'none',
                'is-dragging': this.isDraggingActive,
                // Separators are a table concern; cards have their own borders
                [`row-sep-${rowSep}`]: !this.isCardLayout,
                [`col-sep-${colSep}`]: !this.isCardLayout,
                'is-gridiron': isGridiron && !this.isCardLayout,
                'is-cards': this.isCardLayout,
              }}
              role="table"
              style={{ '--le-list-grid-template': gridTemplate }}
            >
              {this.isCardLayout ? null : isColumnToggleEnabled || isColumnReorderEnabled ? (
                <le-context-menu
                  items={this.getColumnContextMenuItems()}
                  reorder={isColumnReorderEnabled ? 'siblings' : 'none'}
                  showReorderHandle={isColumnReorderEnabled}
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
              {this.itemContextMenu && (
                <le-context-menu
                  ref={el => (this.rowContextMenuRef = el as any)}
                  items={this.contextMenuItemActions}
                  onLeContextMenuSelect={(e: CustomEvent) => {
                    void this.executeAction(e.detail.id, this.contextMenuTargetItem, e.detail.originalEvent);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {this.isDraggingActive && this.pendingDragItem && (
          <div
            class="le-list-tr reorder-ghost"
            style={{
              transform: `translate3d(${this.ghostX}px, ${this.ghostY}px, 0)`,
              width: `${this.dragItemRect?.width ?? 400}px`,
              gridTemplateColumns: gridTemplate,
            }}
          >
            {visibleColumns.map((col, colIndex) => {
              const isFirstCol = colIndex === 0;
              const alignClass = `align-${col.align || (col.type === 'number' || col.type === 'actions' ? 'right' : 'left')}`;
              const draggedNode = findNodeInTree(displayOptions, this.activeDragId || this.pendingDragId || '');
              const draggedDepth = draggedNode ? getNodeDepth(displayOptions, String(draggedNode.item.id ?? draggedNode.item.value ?? '')) : 0;
              const hasChildren = this.pendingDragItem && Array.isArray(this.pendingDragItem.children) && this.pendingDragItem.children.length > 0;
              const indentCalc = `calc(var(--le-list-item-padding-x) + ${draggedDepth} * var(--le-list-item-indent))`;

              return (
                <div
                  class={{
                    'le-list-td': true,
                    [alignClass]: true,
                    'is-first-cell': isFirstCol && isHierarchical,
                  }}
                >
                  {isFirstCol &&
                    isHierarchical &&
                    (hasChildren ? (
                      <span class="le-list-row-toggle" style={{ paddingLeft: indentCalc }}>
                        <le-icon
                          name="chevron-down"
                          class={{ 'le-list-chevron': true, 'open': !!this.pendingDragItem?.open }}
                          aria-hidden="true"
                        />
                      </span>
                    ) : (
                      <span class="le-list-toggle-spacer" style={{ paddingLeft: indentCalc }} aria-hidden="true" />
                    ))}
                  {this.renderCellValue(col, this.pendingDragItem!)}
                </div>
              );
            })}
            {hasReorderCol && (
              <div class="le-list-td le-list-td-reorder align-center">
                <span class="le-list-reorder-handle">
                  <le-icon name="reorder-horizontal" />
                </span>
              </div>
            )}
            {hasActionCol && (
              <div class="le-list-td le-list-td-action align-center">
                <span class="le-list-row-action-chevron">
                  <le-icon name="chevron-right" />
                </span>
              </div>
            )}
          </div>
        )}
      </Host>
    );
  }
}

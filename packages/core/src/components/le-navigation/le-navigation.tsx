import {
  Build,
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  Watch,
  h,
  Host,
  Listen,
} from '@stencil/core';
import { LeOption } from '../../types/options';
import {
  buildDeclarativeOptionsFromChildren,
  classnames,
  generateId,
  getOptionElement,
  parseOptionInput,
} from '../../utils/utils';
import { LeBarOverflowChangeDetail } from '../le-bar/le-bar';

export interface LeNavigationItemSelectDetail {
  item: LeOption;
  id: string;
  action?: string;
  href?: string;
  target?: string;
  originalEvent: MouseEvent | KeyboardEvent;
}

export interface LeNavigationItemToggleDetail {
  item: LeOption;
  id: string;
  open: boolean;
  originalEvent: MouseEvent | KeyboardEvent;
}

export type LeNavigationReorderMode = 'none' | 'siblings' | 'nested';

export interface LeNavigationItemReorderDetail {
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

interface VerticalListRenderOptions {
  depth: number;
  pathPrefix: string;
  parentId?: string;
  leadingToggleAncestors?: number;
  autoOpenIds?: Set<string>;
  searchable?: boolean;
  searchQuery?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  submenuId?: string;
  submenuRoot?: string;
  closePopover?: () => void;
}

interface RenderedNavItem {
  id: string;
  item: LeOption;
  depth: number;
  parentId?: string;
  submenuRoot: string;
  hasChildren: boolean;
  open: boolean;
  disabled: boolean;
  autoActivatable: boolean;
}

type LeNavigationActivationMode = 'manual' | 'automatic';

/**
 * Navigation component with vertical (tree) and horizontal (menu) layouts.
 *
 * - Accepts items as `LeOption[]` or a JSON string.
 * - Supports hierarchical items via `children`.
 * - Supports persisted expansion via `open` on items.
 *
 * @slot hamburger-trigger - Custom trigger contents for the hamburger button
 * @slot more-trigger - Custom trigger contents for the "More" button
 *
 * @cmsEditable true
 * @cmsCategory Navigation
 */
@Component({
  tag: 'le-navigation',
  styleUrl: 'le-navigation.css',
  shadow: true,
})
export class LeNavigation {
  @Element() el!: HTMLElement;

  /**
   * Navigation items.
   * Can be passed as an array or JSON string (same pattern as le-select).
   */
  @Prop({ mutable: true }) items: LeOption[] | string = [];

  /**
   * Layout orientation.
   */
  @Prop({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'horizontal';

  /**
   * Horizontal wrapping behavior.
   * If false, overflow behavior depends on `overflowMode`.
   */
  @Prop({ reflect: true }) wrap: boolean = false;

  /**
   * Overflow behavior for horizontal, non-wrapping menus.
   * - more: moves overflow items into a "More" popover
   * - hamburger: turns the whole nav into a hamburger popover
   */
  @Prop({ reflect: true }) overflowMode: 'more' | 'hamburger' = 'more';

  /**
   * Minimum number of visible top-level items required to use the "More" overflow.
   * If fewer would be visible, the navigation falls back to hamburger.
   */
  @Prop() minVisibleItemsForMore: number = 2;

  /**
   * Alignment of the menu items within the navigation bar.
   */
  @Prop({ reflect: true }) align: 'start' | 'end' | 'center' | 'space-between' = 'start';

  /**
   * Active url for automatic selection.
   */
  @Prop() activeUrl: string = '';

  /**
   * Enables a search input for the vertical navigation.
   */
  @Prop() searchable: boolean = false;

  /**
   * Placeholder text for the search input.
   */
  @Prop() searchPlaceholder: string = 'Search...';

  /**
   * Text shown when no items match the filter.
   */
  @Prop() emptyText: string = 'No results found';

  /**
   * Whether submenu popovers should include a filter input.
   */
  @Prop() submenuSearchable: boolean = false;

  /**
   * Whether keyboard focus only highlights, or also activates immediately.
   */
  @Prop({ reflect: true }) activationMode: LeNavigationActivationMode = 'manual';

  /**
   * Automatically scroll the active item into view when the active URL changes
   * or on initial load.
   *
   * - Initial load: instant (no animation)
   * - Subsequent `activeUrl` changes: smooth
   *
   * Only applies to `vertical` orientation.
   */
  @Prop() autoScroll: boolean = false;

  /**
   * Enables manual drag-and-drop reordering of navigation items.
   * - 'none': Disabled (default)
   * - 'siblings': Can only reorder within current parent/root siblings
   * - 'nested': Can reorder across hierarchical levels (inside/outside parents)
   * Note: Can also be passed as boolean (true -> 'nested', false -> 'none').
   */
  @Prop({ reflect: true, mutable: true }) reorder: LeNavigationReorderMode | boolean = 'none';

  /**
   * Configurable position target ratios for top (before), middle (inside), and bottom (after) drop zones.
   * Default: { top: 0.3, middle: 0.4, bottom: 0.3 } (30% before / 40% inside / 30% after).
   */
  @Prop() reorderRatios: { top: number; middle: number; bottom: number } = {
    top: 0.35,
    middle: 0.3,
    bottom: 0.35,
  };

  /**
   * Delay in ms before automatically expanding a hovered collapsed item during drag-and-drop.
   */
  @Prop() reorderExpandDelay: number = 500;

  /**
   * Fired when a navigation item is activated.
   *
   * This event is cancelable. Call `event.preventDefault()` to prevent
   * default browser navigation and implement custom routing.
   */
  @Event({ cancelable: true }) leNavItemSelect!: EventEmitter<LeNavigationItemSelectDetail>;

  /**
   * Fired when a tree branch is toggled.
   */
  @Event() leNavItemToggle!: EventEmitter<LeNavigationItemToggleDetail>;

  /**
   * Fired when navigation items are reordered via drag and drop.
   */
  @Event() leNavItemReorder!: EventEmitter<LeNavigationItemReorderDetail>;

  /**
   * Alias for `leNavItemReorder`.
   */
  @Event() leReorder!: EventEmitter<LeNavigationItemReorderDetail>;

  @State() private searchQuery: string = '';
  @State() private openState: Record<string, boolean> = {};
  /** IDs of items currently in overflow (from le-bar) */
  @State() private overflowIds: string[] = [];
  /** Whether hamburger mode is active (from le-bar) */
  @State() private hamburgerActive: boolean = false;
  @State() private submenuQueries: Record<string, string> = {};
  /** Whether the overflow popover is open */
  @State() private overflowPopoverOpen: boolean = false;
  @State() private declarativeItems: LeOption[] = [];
  @State() private isDeclarativeMode: boolean = false;
  @State() private userReorderedItems?: LeOption[];
  /** ID of the currently focused navigation item */
  @State() private focusedItemId?: string;
  @State() private openSubmenuId?: string;
  @State() private showFocusRing: boolean = false;
  @State() private visualFocusActive: boolean = false;

  @State() private activeDragId?: string;
  @State() private dropTargetId?: string;
  @State() private dropPosition?: 'before' | 'inside' | 'after';
  @State() private ghostX: number = 0;
  @State() private ghostY: number = 0;
  @State() private isDraggingActive: boolean = false;

  private pendingDragId?: string;
  private pendingDragItem?: LeOption;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private dragItemRect?: DOMRect;
  private autoExpandTimer?: any;
  private hoveredExpandId?: string;
  private draggedPaddingLeft?: string;
  private draggedPaddingRight?: string;
  private draggedHasToggle: boolean = false;
  private draggedHasToggleSpacer: boolean = false;
  private draggedToggleIsOpen: boolean = false;
  private dragJustEnded: boolean = false;

  /** Position of the toggle arrow for items with children: 'start' | 'end' */
  @Prop({ reflect: true }) togglePosition: 'start' | 'end' = 'start';

  private popoverRefs: Map<string, HTMLLePopoverElement> = new Map();

  private instanceId: string = generateId('le-nav');

  private mutationObserver?: MutationObserver;

  private pendingAutoActivationId?: string;

  private pendingFocusSyncFrame?: number;
  private pendingScrollBehavior?: ScrollBehavior;
  private initialScrollObserver?: IntersectionObserver;
  private pendingInitialScrollFrame?: number;

  private renderLabel(label: string | HTMLCollection) {
    if (typeof HTMLCollection !== 'undefined' && label instanceof HTMLCollection) {
      const div = document.createElement('div');
      Array.from(label).forEach(n => div.appendChild(n.cloneNode(true)));
      label = div.innerHTML;
    }
    if (typeof label === 'string' && label.includes('<')) {
      return <span innerHTML={label}></span>;
    }
    return label;
  }

  private renderIcon(icon: string) {
    if (icon.includes('<')) {
      return <span class="nav-icon-inner" innerHTML={icon}></span>;
    }
    if (icon.length > 2) {
      return <le-icon name={icon}></le-icon>;
    }
    return icon;
  }

  private isItemSelected(item: LeOption): boolean {
    return !!(item.selected || (this.activeUrl && item.href === this.activeUrl));
  }

  private partFromOptionPart(
    base: string,
    part?: string,
    state?: { selected?: boolean; disabled?: boolean },
  ): string {
    const tokens = new Set<string>([base]);
    const selected = !!state?.selected;
    const disabled = !!state?.disabled;

    tokens.add(selected ? `${base}-selected` : `${base}-unselected`);
    if (disabled) tokens.add(`${base}-disabled`);

    const raw = (part ?? '').trim();
    if (!raw) return Array.from(tokens).join(' ');

    const customTokens = raw
      .split(/\s+/)
      .map(t => t.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean);

    if (customTokens.length === 0) return Array.from(tokens).join(' ');

    customTokens.forEach(t => {
      const customBase = `${base}-${t}`;
      tokens.add(customBase);
      tokens.add(selected ? `${customBase}-selected` : `${customBase}-unselected`);
      if (disabled) tokens.add(`${customBase}-disabled`);
    });

    return Array.from(tokens).join(' ');
  }

  @Watch('items')
  @Watch('orientation')
  @Watch('wrap')
  @Watch('overflowMode')
  handleLayoutInputsChange() {
    this.overflowIds = [];
    this.hamburgerActive = false;
    this.focusedItemId = undefined;
    this.openSubmenuId = undefined;
    this.showFocusRing = false;
    this.visualFocusActive = false;
  }

  @Watch('activeUrl')
  handleActiveUrlChange() {
    if (this.autoScroll) {
      this.pendingScrollBehavior = 'smooth';
    }
  }

  @Listen('slotchange')
  handleSlotChange() {
    this.buildDeclarativeItems();
  }

  componentWillLoad() {
    this.buildDeclarativeItems();
  }

  componentDidLoad() {
    if (!this.autoScroll || !Build.isBrowser || this.orientation !== 'vertical') {
      return;
    }

    // componentDidLoad fires before the outer scroll container (e.g. le-side-panel)
    // has finished its layout. A plain rAF is too early — the panel may still have
    // width/height 0. IntersectionObserver fires exactly once when this element
    // first intersects the viewport, at which point layout is guaranteed complete.
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for environments without IntersectionObserver (e.g. jsdom).
      this.tryInitialActiveScroll(16);
      return;
    }

    this.initialScrollObserver = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          this.initialScrollObserver?.disconnect();
          this.initialScrollObserver = undefined;
          this.tryInitialActiveScroll(16);
        }
      },
      { threshold: 0 },
    );

    this.initialScrollObserver.observe(this.el);
  }

  connectedCallback() {
    this.mutationObserver = new MutationObserver(() => {
      this.buildDeclarativeItems();
    });
    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: true,
    });
  }

  disconnectedCallback() {
    this.mutationObserver?.disconnect();
    this.initialScrollObserver?.disconnect();
    this.initialScrollObserver = undefined;
    if (this.pendingInitialScrollFrame !== undefined) {
      cancelAnimationFrame(this.pendingInitialScrollFrame);
      this.pendingInitialScrollFrame = undefined;
    }
    if (this.pendingFocusSyncFrame !== undefined) {
      cancelAnimationFrame(this.pendingFocusSyncFrame);
      this.pendingFocusSyncFrame = undefined;
    }
  }

  componentDidRender() {
    const currentId = this.focusedItemId;
    const currentItem = currentId ? this.getRenderedNavItemById(currentId) : undefined;
    const currentElement = currentId ? this.getNavElementById(currentId) : undefined;
    if (currentItem && currentElement && this.isElementVisible(currentElement)) {
      // Focus sync is satisfied; still check for pending scroll below.
    } else {
      const fallbackId = this.getFirstVisibleItemId();
      if (fallbackId && fallbackId !== this.focusedItemId) {
        if (this.pendingFocusSyncFrame !== undefined) {
          cancelAnimationFrame(this.pendingFocusSyncFrame);
        }
        // Defer fallback focus update to post-render frame to avoid
        // mutating @State during the current render lifecycle.
        this.pendingFocusSyncFrame = requestAnimationFrame(() => {
          this.pendingFocusSyncFrame = undefined;
          if (this.focusedItemId !== fallbackId) {
            this.focusedItemId = fallbackId;
          }
        });
      }
    }

    if (this.pendingScrollBehavior !== undefined && this.orientation === 'vertical') {
      const behavior = this.pendingScrollBehavior;
      this.pendingScrollBehavior = undefined;
      requestAnimationFrame(() => {
        this.scrollActiveItemIntoView(behavior);
      });
    }
  }

  private tryInitialActiveScroll(attemptsLeft: number) {
    if (!Build.isBrowser || attemptsLeft <= 0) {
      return;
    }

    const scrolled = this.scrollActiveItemIntoView('instant');
    if (scrolled) {
      return;
    }

    this.pendingInitialScrollFrame = requestAnimationFrame(() => {
      this.pendingInitialScrollFrame = undefined;
      this.tryInitialActiveScroll(attemptsLeft - 1);
    });
  }

  private scrollActiveItemIntoView(behavior: ScrollBehavior): boolean {
    if (!Build.isBrowser) {
      return false;
    }

    const items = this.getRenderedNavItems();
    const activeItem = items.find(item => this.isItemSelected(item.item));
    if (!activeItem) {
      return false;
    }

    const element = this.getNavElementById(activeItem.id);
    if (!element) {
      return false;
    }

    const scrollContainer = this.findScrollableAncestorInComposedTree(element);

    if (!scrollContainer) {
      element.scrollIntoView({ behavior, block: 'nearest' });
      return true;
    }

    const elementRect = element.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    if (elementRect.height <= 0 || containerRect.height <= 0) {
      return false;
    }

    const topDiff = elementRect.top - containerRect.top;
    const bottomDiff = elementRect.bottom - containerRect.bottom;

    if (topDiff >= 0 && bottomDiff <= 0) {
      return true;
    }

    // The container can be identified correctly but still not be scroll-ready
    // during early layout (e.g. equal client/scroll heights while sizing settles).
    const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    if (maxScrollTop <= 0) {
      return false;
    }

    const adjustment = topDiff < 0 ? topDiff : bottomDiff;
    scrollContainer.scrollTo({
      top: scrollContainer.scrollTop + adjustment,
      behavior,
    });

    return true;
  }

  private findScrollableAncestorInComposedTree(startElement: Element): HTMLElement | null {
    let current: Element | null = startElement;

    while (current) {
      const assignedSlotEl: HTMLSlotElement | null = (current as HTMLElement).assignedSlot ?? null;
      if (assignedSlotEl) {
        current = assignedSlotEl;
        continue;
      }

      if (current instanceof HTMLElement) {
        const style = getComputedStyle(current);
        const overflowY = style.overflowY;

        if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
          return current;
        }
      }

      const parentEl: Element | null = current.parentElement;
      if (parentEl) {
        current = parentEl;
        continue;
      }

      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host;
        continue;
      }

      break;
    }

    return null;
  }

  private async buildDeclarativeItems() {
    const { isDeclarativeMode, options } = await buildDeclarativeOptionsFromChildren(
      this.el,
      'le-navigation',
    );

    this.isDeclarativeMode = isDeclarativeMode;
    this.declarativeItems = options;
  }

  private get parsedItems(): LeOption[] {
    if (this.userReorderedItems) {
      return this.ensureItemIds(this.userReorderedItems);
    }
    const items = this.isDeclarativeMode
      ? this.declarativeItems
      : parseOptionInput(this.items, 'le-navigation', 'items');
    return this.ensureItemIds(items);
  }

  private ensureItemIds(items: LeOption[], prefix = ''): LeOption[] {
    items.forEach((item, index) => {
      const path = prefix ? `${prefix}.${index}` : String(index);
      if (!item.id) {
        item.id = `${this.instanceId}:${path}`;
      }
      if (Array.isArray(item.children)) {
        this.ensureItemIds(item.children, path);
      }
    });
    return items;
  }

  private getItemId(item: LeOption, path: string): string {
    return item.id ?? `${this.instanceId}:${path}`;
  }

  private getChildItems(item: LeOption): LeOption[] {
    return Array.isArray(item.children) ? item.children : [];
  }

  private appendRenderedVerticalItems(
    target: RenderedNavItem[],
    items: LeOption[],
    {
      depth,
      pathPrefix,
      parentId,
      submenuId,
      submenuRoot,
      searchQuery,
    }: Pick<
      VerticalListRenderOptions,
      'depth' | 'pathPrefix' | 'parentId' | 'submenuId' | 'submenuRoot' | 'searchQuery'
    >,
  ) {
    const query = searchQuery ?? '';
    const autoOpenIds = new Set<string>();
    const filtered = query ? this.filterTree(items, query, pathPrefix, autoOpenIds) : items;
    const resolvedSubmenuRoot = submenuRoot ?? submenuId ?? '';

    filtered.forEach((item, index) => {
      const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
      const id = this.getItemId(item, path);
      const children = this.getChildItems(item);
      const hasChildren = children.length > 0;
      const open = hasChildren && (this.isOpen(item, id) || autoOpenIds.has(id));

      target.push({
        id,
        item,
        depth,
        parentId,
        submenuRoot: resolvedSubmenuRoot,
        hasChildren,
        open,
        disabled: !!item.disabled,
        autoActivatable: !!(item.href || item.action || !hasChildren),
      });

      if (!hasChildren || !open) return;

      this.appendRenderedVerticalItems(target, children, {
        depth: depth + 1,
        pathPrefix: path,
        parentId: id,
        submenuId,
        submenuRoot: resolvedSubmenuRoot,
        searchQuery,
      });
    });
  }

  private getRenderedNavItems(): RenderedNavItem[] {
    const rendered: RenderedNavItem[] = [];
    const items = this.parsedItems;

    if (this.orientation === 'horizontal') {
      items.forEach((item, index) => {
        const id = this.getItemId(item, String(index));
        const children = this.getChildItems(item);
        const hasChildren = children.length > 0;
        const open = hasChildren && this.openSubmenuId === id;

        rendered.push({
          id,
          item,
          depth: 0,
          submenuRoot: '',
          hasChildren,
          open,
          disabled: !!item.disabled,
          autoActivatable: !!(item.href || item.action || !hasChildren),
        });

        if (!open) return;

        this.appendRenderedVerticalItems(rendered, children, {
          depth: 0,
          pathPrefix: String(index),
          parentId: id,
          submenuId: id,
          submenuRoot: id,
          searchQuery: this.submenuQueries[id] ?? '',
        });
      });

      return rendered;
    }

    this.appendRenderedVerticalItems(rendered, items, {
      depth: 0,
      pathPrefix: '',
      searchQuery: this.searchQuery,
    });

    return rendered;
  }

  private getRenderedNavItemById(id: string): RenderedNavItem | undefined {
    return this.getRenderedNavItems().find(item => item.id === id);
  }

  private getNavElementById(id: string): HTMLElement | undefined {
    const matches = Array.from(
      this.el.shadowRoot?.querySelectorAll<HTMLElement>('[data-nav-id]') ?? [],
    ).filter(element => element.dataset.navId === id);

    return matches.find(element => this.isElementVisible(element)) ?? matches[0];
  }

  private isElementVisible(element: HTMLElement): boolean {
    return (
      (typeof element.getClientRects === 'function' ? element.getClientRects().length > 0 : true) &&
      getComputedStyle(element).visibility !== 'hidden'
    );
  }

  private isElementDisabled(element: HTMLElement): boolean {
    return element.getAttribute('aria-disabled') === 'true' || element.hasAttribute('disabled');
  }

  private getVisibleNavItems(): RenderedNavItem[] {
    return this.getRenderedNavItems();
  }

  private getFirstVisibleItemId(): string | undefined {
    return this.getVisibleNavItems().find(item => !item.disabled)?.id;
  }

  private getTopLevelHorizontalItems(): RenderedNavItem[] {
    return this.getVisibleNavItems().filter(item => {
      return item.submenuRoot === '' && item.depth === 0;
    });
  }

  private getLinearGroupForItem(item: RenderedNavItem): RenderedNavItem[] {
    const { submenuRoot, depth } = item;

    if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
      return this.getTopLevelHorizontalItems();
    }

    return this.getVisibleNavItems().filter(candidate => {
      return candidate.submenuRoot === submenuRoot;
    });
  }

  private findAdjacentEnabledElement(
    elements: RenderedNavItem[],
    currentId: string,
    direction: 1 | -1,
  ): RenderedNavItem | undefined {
    if (elements.length === 0) return undefined;

    let index = elements.findIndex(element => element.id === currentId);
    if (index < 0) {
      index = direction > 0 ? -1 : 0;
    }

    for (let step = 0; step < elements.length; step++) {
      index = (index + direction + elements.length) % elements.length;
      const candidate = elements[index];
      if (!candidate.disabled) {
        return candidate;
      }
    }

    return undefined;
  }

  private getFirstEnabledElement(elements: RenderedNavItem[]): RenderedNavItem | undefined {
    return elements.find(element => !element.disabled);
  }

  private getLastEnabledElement(elements: RenderedNavItem[]): RenderedNavItem | undefined {
    return [...elements].reverse().find(element => !element.disabled);
  }

  private getFirstChildItem(parentId: string, submenuRoot: string): RenderedNavItem | undefined {
    return this.getVisibleNavItems().find(element => {
      return (
        (element.parentId ?? '') === parentId &&
        element.submenuRoot === submenuRoot &&
        !element.disabled
      );
    });
  }

  private getParentItem(item: RenderedNavItem): RenderedNavItem | undefined {
    const parentId = item.parentId ?? '';
    if (!parentId) return undefined;
    return this.getRenderedNavItemById(parentId);
  }

  private setFocusedItem(
    id: string | undefined,
    shouldFocus: boolean,
    shouldAutoActivate: boolean,
  ) {
    if (!id) return;

    this.focusedItemId = id;

    requestAnimationFrame(() => {
      const element = this.getNavElementById(id);
      if (!element) return;

      if (shouldFocus) {
        element.focus();
      }

      if (shouldAutoActivate) {
        this.maybeAutoActivate(element);
      }
    });
  }

  private maybeAutoActivate(element: HTMLElement) {
    if (this.activationMode !== 'automatic' || this.isElementDisabled(element)) {
      return;
    }

    if (element.dataset.autoActivatable !== 'true') {
      return;
    }

    const nextId = element.dataset.navId;
    if (!nextId || nextId === this.pendingAutoActivationId) {
      return;
    }

    this.pendingAutoActivationId = nextId;
    element.click();
    this.pendingAutoActivationId = undefined;
  }

  private emitItemSelect(event: MouseEvent | KeyboardEvent, item: LeOption, id: string) {
    return this.leNavItemSelect.emit({
      item,
      id,
      action: item.action,
      href: item.href,
      target: item.target,
      originalEvent: event,
    });
  }

  private activateItem(
    event: MouseEvent | KeyboardEvent,
    item: LeOption,
    id: string,
    options?: { closePopover?: () => void; toggleStructural?: boolean },
  ) {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const emitted = this.emitItemSelect(event, item, id);
    if (emitted.defaultPrevented) {
      event.preventDefault();
    }

    const hasChildren = this.getChildItems(item).length > 0;
    if (options?.toggleStructural && !item.href && !item.action && hasChildren) {
      this.toggleItemOpen(item, id, event);
      return;
    }

    if (options?.closePopover) {
      options.closePopover();
    }

    // Fire click on the original <le-item> element so that native onclick
    // attributes and addEventListener handlers work as expected.
    getOptionElement(item)?.click();
  }

  private toggleItemOpen(
    item: LeOption,
    id: string,
    event: MouseEvent | KeyboardEvent,
    open?: boolean,
  ) {
    if (item.disabled) return;

    const next = typeof open === 'boolean' ? open : !this.isOpen(item, id);
    this.setOpen(id, next);

    this.leNavItemToggle.emit({
      item,
      id,
      open: next,
      originalEvent: event,
    });
  }

  private openHorizontalSubmenu(id: string) {
    this.openSubmenuId = id;
  }

  private closeHorizontalSubmenu(id?: string) {
    if (!id || this.openSubmenuId === id) {
      this.openSubmenuId = undefined;
    }
  }

  @Method()
  async focusFirstItem() {
    const id = this.focusedItemId ?? this.getFirstVisibleItemId();
    if (id) {
      this.setFocusedItem(id, true, false);
    }
  }

  @Method()
  async focusActiveItem() {
    await this.focusFirstItem();
  }

  /**
   * Programmatically set the reorder mode ('none', 'siblings', 'nested', or boolean).
   */
  @Method()
  async setReorder(mode: LeNavigationReorderMode | boolean) {
    this.reorder = mode;
  }

  /**
   * Programmatically enable reordering.
   */
  @Method()
  async enableReorder(mode: LeNavigationReorderMode = 'nested') {
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
   * Programmatically move an item relative to another item in the navigation tree.
   * Accepts item ID, value, or label for both dragged and target items.
   */
  @Method()
  async moveItem(
    draggedQuery: string,
    targetQuery: string,
    position: 'before' | 'inside' | 'after' = 'after',
  ): Promise<{ success: boolean; detail?: LeNavigationItemReorderDetail }> {
    const items = [...this.parsedItems];
    const draggedNode = this.findNodeInTree(items, draggedQuery);
    const targetNode = this.findNodeInTree(items, targetQuery);

    if (!draggedNode || !targetNode) {
      console.warn(`[le-navigation] moveItem: item not found ("${draggedQuery}" or "${targetQuery}")`);
      return { success: false };
    }

    const draggedId = draggedNode.item.id!;
    const targetId = targetNode.item.id!;

    const reorderResult = this.reorderTreeItem(items, draggedId, targetId, position);
    if (!reorderResult.success || !reorderResult.newItems) {
      return { success: false };
    }

    this.userReorderedItems = reorderResult.newItems;
    this.items = reorderResult.newItems;

    if (this.isDeclarativeMode) {
      this.declarativeItems = reorderResult.newItems;
      this.reorderDeclarativeDomNodes(
        reorderResult.draggedItem,
        reorderResult.targetItem,
        position,
      );
    }

    const detail: LeNavigationItemReorderDetail = {
      item: reorderResult.draggedItem!,
      draggedId,
      targetItem: reorderResult.targetItem,
      targetId,
      position,
      oldParentId: reorderResult.oldParentId,
      newParentId: reorderResult.newParentId,
      items: reorderResult.newItems,
    };

    this.leNavItemReorder.emit(detail);
    this.leReorder.emit(detail);

    return { success: true, detail };
  }

  private get activeReorderMode(): LeNavigationReorderMode {
    if (this.orientation === 'horizontal') return 'none';
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

  private handlePointerDownItem = (e: PointerEvent, item: LeOption, id: string) => {
    if (this.activeReorderMode === 'none' || item.disabled) return;
    if (this.isToggleClick(e as any)) return;
    if (e.button !== 0) return;

    this.pendingDragId = id;
    this.pendingDragItem = item;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    const targetEl = (e.currentTarget as HTMLElement).closest('.nav-item') as HTMLElement;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const style = window.getComputedStyle(targetEl);
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.dragItemRect = rect;
      this.draggedPaddingLeft = targetEl.style.paddingLeft || style.paddingLeft;
      this.draggedPaddingRight = targetEl.style.paddingRight || style.paddingRight;
      this.draggedHasToggle = !!targetEl.querySelector('.nav-toggle');
      this.draggedHasToggleSpacer = !!targetEl.querySelector('.nav-toggle-spacer');
      this.draggedToggleIsOpen = !!targetEl.querySelector('.nav-chevron.open');
    } else {
      this.dragOffsetX = 12;
      this.dragOffsetY = 12;
      this.draggedPaddingLeft = undefined;
      this.draggedPaddingRight = undefined;
      this.draggedHasToggle = false;
      this.draggedHasToggleSpacer = false;
      this.draggedToggleIsOpen = false;
    }

    window.addEventListener('pointermove', this.handleGlobalPointerMove);
    window.addEventListener('pointerup', this.handleGlobalPointerUp);
    window.addEventListener('pointercancel', this.handleGlobalPointerUp);
  };

  private handleGlobalPointerMove = (e: PointerEvent) => {
    if (!this.pendingDragId || !this.pendingDragItem) return;

    if (!this.isDraggingActive) {
      const dist = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
      if (dist < 4) return;

      this.isDraggingActive = true;
      this.activeDragId = this.pendingDragId;
    }

    this.ghostX = e.clientX - this.dragOffsetX;
    this.ghostY = e.clientY - this.dragOffsetY;

    let targetEl: HTMLElement | null = null;

    if (this.el.shadowRoot && typeof (this.el.shadowRoot as any).elementFromPoint === 'function') {
      const shadowTarget = (this.el.shadowRoot as any).elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (shadowTarget) {
        targetEl = shadowTarget.closest('.nav-item') as HTMLElement;
      }
    }

    if (!targetEl) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elements) {
        const itemEl = el.closest('.nav-item') as HTMLElement;
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

    const targetId = targetEl.getAttribute('data-nav-id');
    const targetParentId = targetEl.getAttribute('data-parent-id') || undefined;

    if (!targetId || targetId === this.activeDragId) {
      this.dropTargetId = undefined;
      this.dropPosition = undefined;
      this.clearAutoExpandTimer();
      return;
    }

    const items = this.parsedItems;
    if (this.isDescendantOf(items, this.activeDragId!, targetId)) {
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
      const draggedNode = this.findNodeInTree(items, this.activeDragId!);
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

      const targetNode = this.findNodeInTree(items, targetId);
      const children = targetNode && Array.isArray(targetNode.item.children) ? targetNode.item.children : [];
      const hasChildren = children.length > 0;
      const firstChild = hasChildren ? children[0] : undefined;
      const isOpen = targetNode && (this.isOpen(targetNode.item, targetId) || (this.openSubmenuId === targetId));

      let finalTargetId = targetId;
      let pos: 'before' | 'inside' | 'after' = 'inside';

      if (ratio < topLimit) {
        pos = 'before';
      } else if (hasChildren) {
        if (isOpen) {
          if (firstChild && firstChild.id) {
            finalTargetId = firstChild.id;
            pos = 'before';
          } else {
            pos = 'inside';
          }
        } else {
          if (ratio > bottomLimit) {
            if (firstChild && firstChild.id) {
              finalTargetId = firstChild.id;
              pos = 'before';
            } else {
              pos = 'inside';
            }
            if (this.hoveredExpandId !== targetId) {
              this.clearAutoExpandTimer();
              this.hoveredExpandId = targetId;
              this.autoExpandTimer = setTimeout(() => {
                this.setOpen(targetId, true);
              }, this.reorderExpandDelay);
            }
          } else {
            pos = 'inside';
            if (this.hoveredExpandId !== targetId) {
              this.clearAutoExpandTimer();
              this.hoveredExpandId = targetId;
              this.autoExpandTimer = setTimeout(() => {
                this.setOpen(targetId, true);
              }, this.reorderExpandDelay);
            }
          }
        }
      } else {
        if (ratio > bottomLimit) {
          pos = 'after';
        } else {
          pos = 'inside';
        }
        this.clearAutoExpandTimer();
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

      const items = [...this.parsedItems];
      const reorderResult = this.reorderTreeItem(
        items,
        this.activeDragId,
        this.dropTargetId,
        this.dropPosition,
      );

      if (reorderResult.success && reorderResult.newItems) {
        this.userReorderedItems = reorderResult.newItems;
        this.items = reorderResult.newItems;

        if (this.isDeclarativeMode) {
          this.declarativeItems = reorderResult.newItems;
          this.reorderDeclarativeDomNodes(
            reorderResult.draggedItem,
            reorderResult.targetItem,
            this.dropPosition,
          );
        }

        const detail: LeNavigationItemReorderDetail = {
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

        this.leNavItemReorder.emit(detail);
        this.leReorder.emit(detail);
      }
    }

    this.isDraggingActive = false;
    this.pendingDragId = undefined;
    this.pendingDragItem = undefined;
    this.activeDragId = undefined;
    this.dropTargetId = undefined;
    this.dropPosition = undefined;
  };

  private findNodeInTree(
    items: LeOption[],
    id: string,
    parentId?: string,
  ): { item: LeOption; parentList: LeOption[]; index: number; parentId?: string } | undefined {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id === id || item.value === id || item.label === id) {
        return { item, parentList: items, index: i, parentId };
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        const res = this.findNodeInTree(item.children, id, item.id);
        if (res) return res;
      }
    }
    return undefined;
  }

  private isDescendantOf(items: LeOption[], ancestorId: string, targetId: string): boolean {
    const ancestor = this.findNodeInTree(items, ancestorId);
    if (!ancestor || !Array.isArray(ancestor.item.children)) return false;
    return !!this.findNodeInTree(ancestor.item.children, targetId);
  }

  private reorderTreeItem(
    items: LeOption[],
    draggedId: string,
    targetId: string,
    position: 'before' | 'inside' | 'after',
  ) {
    const cloned: LeOption[] = JSON.parse(JSON.stringify(items));
    const draggedNode = this.findNodeInTree(cloned, draggedId);
    const targetNode = this.findNodeInTree(cloned, targetId);

    if (!draggedNode || !targetNode) {
      return { success: false };
    }

    const oldParentId = draggedNode.parentId;
    const itemToMove = draggedNode.parentList.splice(draggedNode.index, 1)[0];

    if (position === 'inside') {
      const updatedTarget = this.findNodeInTree(cloned, targetId)!;
      if (!Array.isArray(updatedTarget.item.children)) {
        updatedTarget.item.children = [];
      }
      updatedTarget.item.children.unshift(itemToMove);
      updatedTarget.item.open = true;
      this.setOpen(targetId, true);
      return {
        success: true,
        newItems: cloned,
        draggedItem: itemToMove,
        targetItem: targetNode.item,
        oldParentId,
        newParentId: targetId,
      };
    }

    const updatedTarget = this.findNodeInTree(cloned, targetId)!;
    const insertIdx = position === 'before' ? updatedTarget.index : updatedTarget.index + 1;
    updatedTarget.parentList.splice(insertIdx, 0, itemToMove);

    return {
      success: true,
      newItems: cloned,
      draggedItem: draggedNode.item,
      targetItem: targetNode.item,
      oldParentId,
      newParentId: updatedTarget.parentId,
    };
  }

  private reorderDeclarativeDomNodes(
    draggedItem?: LeOption,
    targetItem?: LeOption,
    position?: 'before' | 'inside' | 'after',
  ) {
    if (!draggedItem || !targetItem || !position) return;
    const draggedEl = getOptionElement(draggedItem);
    const targetEl = getOptionElement(targetItem);

    if (!draggedEl || !targetEl || !targetEl.parentNode) return;

    const parent = targetEl.parentNode;
    if (position === 'inside') {
      const firstChild = targetEl.firstElementChild;
      if (firstChild) {
        targetEl.insertBefore(draggedEl, firstChild);
      } else {
        targetEl.appendChild(draggedEl);
      }
      targetEl.setAttribute('open', '');
    } else if (position === 'before') {
      parent.insertBefore(draggedEl, targetEl);
    } else if (position === 'after') {
      parent.insertBefore(draggedEl, targetEl.nextSibling);
    }
  }

  private isOpen(item: LeOption, id: string): boolean {
    const fromState = this.openState[id];
    if (typeof fromState === 'boolean') return fromState;
    return !!item.open;
  }

  private setOpen(id: string, open: boolean) {
    if (this.openState[id] === open) return;
    this.openState = {
      ...this.openState,
      [id]: open,
    };
  }

  private matchesQuery(option: LeOption, query: string): boolean {
    if (!query) return true;

    const q = query.toLowerCase();
    return (
      option.label.toLowerCase().includes(q) ||
      (option.description?.toLowerCase().includes(q) ?? false)
    );
  }

  private filterTree(
    items: LeOption[],
    query: string,
    pathPrefix: string,
    autoOpen: Set<string>,
  ): LeOption[] {
    if (!query) return items;

    const result: LeOption[] = [];

    items.forEach((item, index) => {
      const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
      const id = this.getItemId(item, path);

      const children = this.getChildItems(item);
      const filteredChildren = this.filterTree(children, query, path, autoOpen);
      const selfMatch = this.matchesQuery(item, query);
      const childMatch = filteredChildren.length > 0;

      if (selfMatch || childMatch) {
        if (childMatch) {
          autoOpen.add(id);
        }

        if (childMatch && filteredChildren !== children) {
          result.push({
            ...item,
            children: filteredChildren,
          });
        } else {
          result.push(item);
        }
      }
    });

    return result;
  }

  private handleItemSelect = (
    event: MouseEvent,
    item: LeOption,
    id: string,
    closePopover?: () => void,
  ) => {
    this.activateItem(event, item, id, {
      closePopover,
      toggleStructural: true,
    });
  };

  private handleToggle = (event: MouseEvent, item: LeOption, id: string) => {
    event.preventDefault();
    event.stopPropagation();

    this.toggleItemOpen(item, id, event);
  };

  private handleInteractiveFocus = (id: string) => {
    if (this.focusedItemId === id) return;
    this.focusedItemId = id;
  };

  private handleMouseEnterItem(id: string) {
    const item = this.getRenderedNavItemById(id);
    if (!item || item.disabled) return;
    this.showFocusRing = false;
    this.visualFocusActive = true;
    this.setFocusedItem(id, true, false);
  }

  private containsElement(container: HTMLElement, node: Node | null): boolean {
    let current = node;
    while (current) {
      if (current === container) return true;
      if (current instanceof ShadowRoot) {
        current = current.host;
      } else {
        current = current.parentNode || (current.getRootNode?.() as ShadowRoot)?.host || null;
      }
    }
    return false;
  }

  @Listen('focusout')
  handleFocusOut(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as Node | null;
    if (!relatedTarget || !this.containsElement(this.el, relatedTarget)) {
      this.showFocusRing = false;
      this.visualFocusActive = false;
    }
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof globalThis.Element)) return false;
    return !!target.closest('input, textarea, [contenteditable="true"]');
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (this.isEditableTarget(event.target)) {
      return;
    }

    const isNavKey = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
      event.key,
    );

    if (isNavKey) {
      if (!this.visualFocusActive) {
        event.preventDefault();
        this.visualFocusActive = true;
        this.showFocusRing = true;

        const currentId = this.focusedItemId ?? this.getFirstVisibleItemId();
        let startItem: RenderedNavItem | undefined;

        if (currentId) {
          const currentItemData = this.getRenderedNavItemById(currentId);
          if (currentItemData) {
            const group = this.getLinearGroupForItem(currentItemData);
            if (event.key === 'ArrowUp') {
              startItem = this.getLastEnabledElement(group);
            } else {
              startItem = this.getFirstEnabledElement(group);
            }
          }
        }

        if (startItem?.id) {
          this.setFocusedItem(startItem.id, true, false);
        }
        return;
      }
      this.showFocusRing = true;
    }

    const interactiveTarget = event.composedPath().find(target => {
      return target instanceof HTMLElement && target.hasAttribute('data-nav-id');
    }) as HTMLElement | undefined;

    const currentElement =
      interactiveTarget ??
      (this.focusedItemId ? this.getNavElementById(this.focusedItemId) : undefined);
    if (!currentElement) return;

    const currentId = currentElement.dataset.navId;
    if (!currentId) return;

    const currentItemData = this.getRenderedNavItemById(currentId);
    if (!currentItemData) return;

    const currentItem = currentItemData.item;
    const group = this.getLinearGroupForItem(currentItemData);
    const submenuRoot = currentItemData.submenuRoot;
    const depth = currentItemData.depth;
    const hasChildren = currentItemData.hasChildren;
    const isOpen = currentItemData.open;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot && hasChildren) {
          this.openHorizontalSubmenu(currentId);
          requestAnimationFrame(() => {
            const firstChild = this.getFirstChildItem(currentId, currentId);
            if (firstChild?.id) {
              this.setFocusedItem(firstChild.id, true, true);
            }
          });
          return;
        }

        const next = this.findAdjacentEnabledElement(group, currentId, 1);
        if (next?.id) {
          this.setFocusedItem(next.id, true, true);
        }
        return;
      }

      case 'ArrowUp': {
        event.preventDefault();

        if (
          this.orientation === 'horizontal' &&
          depth === 0 &&
          !submenuRoot &&
          hasChildren &&
          this.openSubmenuId === currentId
        ) {
          this.closeHorizontalSubmenu(currentId);
          this.setFocusedItem(currentId, true, false);
          return;
        }

        const previous = this.findAdjacentEnabledElement(group, currentId, -1);
        if (previous?.id) {
          this.setFocusedItem(previous.id, true, true);
        }
        return;
      }

      case 'ArrowRight': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
          this.closeHorizontalSubmenu();
          const next = this.findAdjacentEnabledElement(
            this.getTopLevelHorizontalItems(),
            currentId,
            1,
          );
          if (next?.id) {
            this.setFocusedItem(next.id, true, true);
          }
          return;
        }

        if (hasChildren && !isOpen) {
          this.toggleItemOpen(currentItem, currentId, event, true);
          requestAnimationFrame(() => {
            const firstChild = this.getFirstChildItem(currentId, submenuRoot);
            if (firstChild?.id) {
              this.setFocusedItem(firstChild.id, true, true);
            }
          });
          return;
        }

        if (hasChildren && isOpen) {
          const firstChild = this.getFirstChildItem(currentId, submenuRoot);
          if (firstChild?.id) {
            this.setFocusedItem(firstChild.id, true, true);
          }
        }
        return;
      }

      case 'ArrowLeft': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
          this.closeHorizontalSubmenu();
          const previous = this.findAdjacentEnabledElement(
            this.getTopLevelHorizontalItems(),
            currentId,
            -1,
          );
          if (previous?.id) {
            this.setFocusedItem(previous.id, true, true);
          }
          return;
        }

        if (hasChildren && isOpen) {
          this.toggleItemOpen(currentItem, currentId, event, false);
          this.setFocusedItem(currentId, true, false);
          return;
        }

        const parentItem = this.getParentItem(currentItemData);
        if (parentItem?.id) {
          if (this.orientation === 'horizontal' && submenuRoot) {
            this.closeHorizontalSubmenu(submenuRoot);
          }
          this.setFocusedItem(parentItem.id, true, false);
        }
        return;
      }

      case 'Home': {
        event.preventDefault();
        const first = this.getFirstEnabledElement(group);
        if (first?.id) {
          this.setFocusedItem(first.id, true, true);
        }
        return;
      }

      case 'End': {
        event.preventDefault();
        const last = this.getLastEnabledElement(group);
        if (last?.id) {
          this.setFocusedItem(last.id, true, true);
        }
        return;
      }

      case 'Enter':
      case ' ': {
        event.preventDefault();
        currentElement.click();
        return;
      }

      case 'Escape': {
        const parentItem = this.getParentItem(currentItemData);
        if (this.orientation === 'horizontal' && submenuRoot && parentItem?.id) {
          event.preventDefault();
          this.closeHorizontalSubmenu(submenuRoot);
          this.setFocusedItem(parentItem.id, true, false);
        }
        return;
      }

      default:
        return;
    }
  }

  private handleSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.searchQuery = target.value;
  };

  private handleSubmenuSearchInput = (submenuId: string, e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    if (this.submenuQueries[submenuId] === value) return;

    this.submenuQueries = {
      ...this.submenuQueries,
      [submenuId]: value,
    };

    requestAnimationFrame(() => this.popoverRefs.get(submenuId)?.updatePosition());
  };

  private handleBarOverflowChange = (e: CustomEvent<LeBarOverflowChangeDetail>) => {
    this.overflowIds = e.detail.overflowingIds || [];
    this.hamburgerActive = e.detail.hamburgerActive || false;
  };

  private openOverflowPopover = () => {
    this.overflowPopoverOpen = true;
  };

  private closeOverflowPopover = () => {
    this.overflowPopoverOpen = false;
  };

  private renderVerticalList(
    items: LeOption[],
    {
      depth,
      pathPrefix,
      parentId,
      leadingToggleAncestors,
      autoOpenIds,
      searchable,
      searchQuery,
      searchPlaceholder,
      emptyText,
      submenuId,
      submenuRoot,
      closePopover,
    }: VerticalListRenderOptions,
  ) {
    const query = searchQuery ?? '';
    const openFromSearch = autoOpenIds ?? new Set<string>();
    const filtered = query ? this.filterTree(items, query, pathPrefix, openFromSearch) : items;
    const ancestorLeadingSlots = leadingToggleAncestors ?? 0;
    const hasCheckableItems = filtered.some(item => item.checked !== undefined);
    const topLevelEndToggles = depth === 0 && this.togglePosition === 'end';
    const useLeadingToggleSlot = !topLevelEndToggles;
    const firstEnabledId = filtered.find(item => !item.disabled)
      ? this.getItemId(
          filtered.find(item => !item.disabled) as LeOption,
          pathPrefix
            ? `${pathPrefix}.${filtered.findIndex(item => !item.disabled)}`
            : String(filtered.findIndex(item => !item.disabled)),
        )
      : undefined;

    return (
      <div
        class={classnames('nav-vertical', {
          'is-submenu': !!submenuId,
          'is-reorderable': this.activeReorderMode !== 'none',
          'is-dragging': this.isDraggingActive,
        })}
      >
        {searchable && (
          <div class="nav-search">
            <le-string-input
              mode="default"
              class="nav-search-input"
              placeholder={searchPlaceholder ?? 'Search...'}
              value={query}
              onLeInput={(e: Event) =>
                submenuId ? this.handleSubmenuSearchInput(submenuId, e) : this.handleSearchInput(e)
              }
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div class="nav-empty">{emptyText ?? this.emptyText}</div>
        ) : (
          <ul class="nav-list" role="tree">
            {filtered.map((item, index) => {
              const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
              const id = this.getItemId(item, path);
              const children = this.getChildItems(item);
              const hasChildren = children.length > 0;
              const open = hasChildren && (this.isOpen(item, id) || openFromSearch.has(id));
              const paddingLeft = `calc(var(--le-nav-item-padding-x) + ${this.togglePosition === 'end' ? Math.max(depth - 1, 0) : depth} * var(--le-nav-item-indent))`;
              const dropLinePaddingLeft = `calc(${this.togglePosition === 'end' ? Math.max(depth, 0) : depth + 1} * var(--le-nav-item-indent)`;
              const selected = this.isItemSelected(item);
              const itemPart = this.partFromOptionPart('item', item.part, {
                selected,
                disabled: item.disabled,
              });
              const isFocused = this.focusedItemId === id;
              const autoActivatable = !!(item.href || item.action || !hasChildren);
              const isDefaultTabStop =
                !this.focusedItemId && !submenuId && depth === 0 && id === firstEnabledId;
              const TagType = item.href && !item.disabled ? 'a' : 'button';
              const attrs =
                TagType === 'a'
                  ? { href: item.href, target: item.target, role: 'treeitem' }
                  : { type: 'button', role: 'treeitem' };

              const isDropTarget = this.isDraggingActive && this.dropTargetId === id;
              const isDraggedNode = this.isDraggingActive && this.activeDragId === id;

              // Single interactive control for the whole item row
              return (
                <li
                  class={classnames('nav-node', {
                    'disabled': item.disabled,
                    selected,
                    open,
                    'has-children': hasChildren,
                    'is-dragged-node': isDraggedNode,
                    [`color-${item.color}`]: !!item.color,
                  })}
                  key={id}
                  role="none"
                >
                  {isDropTarget && this.dropPosition === 'before' && (
                    <div class="reorder-drop-line line-before" style={{ left: dropLinePaddingLeft }} />
                  )}
                  <TagType
                    class={classnames(
                      'nav-item',
                      {
                        'disabled': item.disabled,
                        'focused': isFocused && this.showFocusRing,
                        'has-children': hasChildren,
                        'selected': selected,
                        'reorder-target-inside': isDropTarget && this.dropPosition === 'inside',
                        'is-dragged-item': isDraggedNode,
                      },
                      item.className,
                    )}
                    onMouseEnter={() => this.handleMouseEnterItem(id)}
                    onPointerDown={(e: PointerEvent) => this.handlePointerDownItem(e, item, id)}
                    onDragStart={(e: Event) => e.preventDefault()}
                    part={itemPart}
                    data-nav-id={id}
                    data-parent-id={parentId ?? ''}
                    data-depth={String(depth)}
                    data-has-children={hasChildren ? 'true' : 'false'}
                    data-open={open ? 'true' : 'false'}
                    data-submenu-root={submenuRoot ?? submenuId ?? ''}
                    data-auto-activatable={autoActivatable ? 'true' : 'false'}
                    aria-disabled={item.disabled ? 'true' : undefined}
                    aria-expanded={hasChildren ? (open ? 'true' : 'false') : undefined}
                    tabIndex={item.disabled ? -1 : isFocused ? 0 : isDefaultTabStop ? 0 : -1}
                    style={{
                      paddingLeft,
                    }}
                    {...attrs}
                    onFocus={() => this.handleInteractiveFocus(id)}
                    onClick={(e: MouseEvent) => {
                      if (item.disabled) return;
                      if (this.dragJustEnded) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      // If has children and click is on arrow, toggle children, else activate
                      if (hasChildren && this.isToggleClick(e)) {
                        this.handleToggle(e, item, id);
                      } else {
                        this.handleItemSelect(e, item, id, closePopover);
                      }
                    }}
                  >
                    {useLeadingToggleSlot && hasChildren && (
                      <span
                        class={classnames('nav-toggle', { open })}
                        aria-label={open ? 'Collapse' : 'Expand'}
                        aria-expanded={open ? 'true' : 'false'}
                        tabIndex={-1}
                        onClick={e => {
                          // Only handle toggle, don't bubble to button
                          e.stopPropagation();
                          this.handleToggle(e as any, item, id);
                        }}
                      >
                        <le-icon
                          name="chevron-down"
                          class={classnames('nav-chevron', { open })}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    {useLeadingToggleSlot && !hasChildren && (
                      <span class="nav-toggle-spacer" aria-hidden="true" />
                    )}
                    {hasCheckableItems &&
                      (item.checked ? (
                        <le-icon name="check" class="nav-check-icon" aria-hidden="true" />
                      ) : (
                        <span class="nav-check-spacer" aria-hidden="true" />
                      ))}
                    {item.iconStart && (
                      <span class="nav-icon" aria-hidden="true">
                        {this.renderIcon(item.iconStart)}
                      </span>
                    )}
                    <span class="nav-text">
                      <span class="nav-label">{this.renderLabel(item.label)}</span>
                      {item.description && <span class="nav-description">{item.description}</span>}
                    </span>
                    {item.iconEnd && (
                      <span class="nav-icon nav-icon-end" aria-hidden="true">
                        {this.renderIcon(item.iconEnd)}
                      </span>
                    )}
                    {topLevelEndToggles && hasChildren && (
                      <span
                        class={classnames('nav-toggle', { open })}
                        aria-label={open ? 'Collapse' : 'Expand'}
                        aria-expanded={open ? 'true' : 'false'}
                        tabIndex={-1}
                        onClick={e => {
                          e.stopPropagation();
                          this.handleToggle(e as any, item, id);
                        }}
                      >
                        <le-icon
                          name="chevron-down"
                          class={classnames('nav-chevron', { open, end: true })}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </TagType>
                  {isDropTarget && this.dropPosition === 'after' && (
                    <div class="reorder-drop-line line-after" style={{ left: dropLinePaddingLeft }} />
                  )}
                  {hasChildren && (
                    <le-collapse class="nav-children" closed={!open} noFading={true} role="group">
                      {this.renderVerticalList(children, {
                        depth: depth + 1,
                        pathPrefix: path,
                        parentId: id,
                        leadingToggleAncestors:
                          ancestorLeadingSlots + (useLeadingToggleSlot ? 1 : 0),
                        autoOpenIds: openFromSearch,
                        submenuId,
                        submenuRoot: submenuRoot ?? submenuId,
                        closePopover,
                      })}
                    </le-collapse>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
  /**
   * Returns true if the click event was on the toggle arrow, based on position.
   */
  private isToggleClick(e: MouseEvent): boolean {
    // The toggle arrow is a span.nav-toggle inside the button
    const path = e.composedPath() as HTMLElement[];
    return path.some(el => el instanceof HTMLElement && el.classList.contains('nav-toggle'));
  }

  private renderHorizontalItem(item: LeOption, index: number) {
    const id = this.getItemId(item, String(index));
    const children = this.getChildItems(item);
    const hasChildren = children.length > 0;
    const hasCheckableItems = this.parsedItems.some(opt => opt.checked !== undefined);
    const selected = this.isItemSelected(item);
    const itemPart = this.partFromOptionPart('item', item.part, {
      selected,
      disabled: item.disabled,
    });
    const isFocused = this.focusedItemId === id;
    const firstEnabledTopLevel = this.parsedItems.find(option => !option.disabled);
    const firstEnabledTopLevelId = firstEnabledTopLevel
      ? this.getItemId(firstEnabledTopLevel, String(this.parsedItems.indexOf(firstEnabledTopLevel)))
      : undefined;
    const isDefaultTabStop = !this.focusedItemId && id === firstEnabledTopLevelId && !item.disabled;

    if (!hasChildren) {
      const TagType = item.href && !item.disabled ? 'a' : 'button';
      const attrs =
        TagType === 'a'
          ? { href: item.href, target: item.target, role: 'menuitem' }
          : { type: 'button', role: 'menuitem' };

      return (
        <div class="h-item" data-bar-id={id}>
          <TagType
            class={classnames(
              'h-link',
              {
                disabled: item.disabled,
                focused: isFocused && this.showFocusRing,
                selected,
                [`color-${item.color}`]: !!item.color,
              },
              item.className,
            )}
            onMouseEnter={() => this.handleMouseEnterItem(id)}
            part={itemPart}
            {...attrs}
            data-nav-id={id}
            data-parent-id=""
            data-depth="0"
            data-has-children="false"
            data-open="false"
            data-submenu-root=""
            data-auto-activatable="true"
            aria-disabled={item.disabled ? 'true' : undefined}
            tabIndex={item.disabled ? -1 : isFocused ? 0 : isDefaultTabStop ? 0 : -1}
            onFocus={() => this.handleInteractiveFocus(id)}
            onClick={(e: MouseEvent) => this.handleItemSelect(e, item, id)}
          >
            {hasCheckableItems &&
              (item.checked ? (
                <le-icon name="check" class="nav-check-icon" aria-hidden="true" />
              ) : (
                <span class="nav-check-spacer" aria-hidden="true" />
              ))}
            {item.iconStart && (
              <span class="nav-icon" aria-hidden="true">
                {this.renderIcon(item.iconStart)}
              </span>
            )}
            <span class="h-label">{this.renderLabel(item.label)}</span>
            {item.iconEnd && (
              <span class="nav-icon nav-icon-end" aria-hidden="true">
                {this.renderIcon(item.iconEnd)}
              </span>
            )}
          </TagType>
        </div>
      );
    }

    const submenuId = id;
    const submenuOpen = this.openSubmenuId === submenuId;

    return (
      <div class="h-item" data-bar-id={id}>
        <le-popover
          ref={el => {
            if (el) this.popoverRefs.set(submenuId, el);
          }}
          mode="default"
          offset={8}
          showClose={false}
          closeOnClickOutside={true}
          closeOnEscape={true}
          position="bottom"
          align="start"
          minWidth="240px"
          open={submenuOpen}
          onLePopoverClose={() => this.closeHorizontalSubmenu(submenuId)}
        >
          <div
            slot="trigger"
            class={classnames('h-trigger', {
              disabled: item.disabled,
              selected,
              [`color-${item.color}`]: !!item.color,
            })}
            part={itemPart}
          >
            {item.href ? (
              <a
                href={item.href}
                target={item.target}
                class={classnames(
                  'h-link',
                  {
                    disabled: item.disabled,
                    focused: isFocused && this.showFocusRing,
                    selected,
                    [`color-${item.color}`]: !!item.color,
                  },
                  item.className,
                )}
                onMouseEnter={() => this.handleMouseEnterItem(id)}
                part={itemPart}
                role="menuitem"
                data-nav-id={id}
                data-parent-id=""
                data-depth="0"
                data-has-children="true"
                data-open={submenuOpen ? 'true' : 'false'}
                data-submenu-root=""
                data-auto-activatable="true"
                aria-disabled={item.disabled ? 'true' : undefined}
                aria-expanded={submenuOpen ? 'true' : 'false'}
                tabIndex={item.disabled ? -1 : isFocused ? 0 : isDefaultTabStop ? 0 : -1}
                onFocus={() => this.handleInteractiveFocus(id)}
                onClick={(e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (item.disabled) return;

                  if (item.action) {
                    this.handleItemSelect(e, item, id);
                    return;
                  }

                  if (submenuOpen) {
                    this.closeHorizontalSubmenu(submenuId);
                  } else {
                    this.openHorizontalSubmenu(submenuId);
                  }
                }}
              >
                {hasCheckableItems &&
                  (item.checked ? (
                    <le-icon name="check" class="nav-check-icon" aria-hidden="true" />
                  ) : (
                    <span class="nav-check-spacer" aria-hidden="true" />
                  ))}
                {item.iconStart && (
                  <span class="nav-icon" aria-hidden="true">
                    {this.renderIcon(item.iconStart)}
                  </span>
                )}
                <span class="h-label">{this.renderLabel(item.label)}</span>
                <span class="nav-chevron" aria-hidden="true">
                  <le-icon name="chevron-down" />
                </span>
              </a>
            ) : (
              <button
                type="button"
                class={classnames(
                  'h-link',
                  {
                    disabled: item.disabled,
                    focused: isFocused && this.showFocusRing,
                    selected,
                    [`color-${item.color}`]: !!item.color,
                  },
                  item.className,
                )}
                onMouseEnter={() => this.handleMouseEnterItem(id)}
                role="menuitem"
                data-nav-id={id}
                data-parent-id=""
                data-depth="0"
                data-has-children="true"
                data-open={submenuOpen ? 'true' : 'false'}
                data-submenu-root=""
                data-auto-activatable={item.action ? 'true' : 'false'}
                aria-expanded={submenuOpen ? 'true' : 'false'}
                aria-disabled={item.disabled ? 'true' : undefined}
                tabIndex={item.disabled ? -1 : isFocused ? 0 : isDefaultTabStop ? 0 : -1}
                onFocus={() => this.handleInteractiveFocus(id)}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  if (item.disabled) return;

                  if (item.action) {
                    this.handleItemSelect(e, item, id);
                    return;
                  }

                  if (submenuOpen) {
                    this.closeHorizontalSubmenu(submenuId);
                  } else {
                    this.openHorizontalSubmenu(submenuId);
                  }
                }}
              >
                {hasCheckableItems &&
                  (item.checked ? (
                    <le-icon name="check" class="nav-check-icon" aria-hidden="true" />
                  ) : (
                    <span class="nav-check-spacer" aria-hidden="true" />
                  ))}
                {item.iconStart && (
                  <span class="nav-icon" aria-hidden="true">
                    {this.renderIcon(item.iconStart)}
                  </span>
                )}
                <span class="h-label">{this.renderLabel(item.label)}</span>
                <span class="nav-chevron" aria-hidden="true">
                  <le-icon name="chevron-down" />
                </span>
              </button>
            )}
          </div>

          <div class="popover-menu">
            {this.renderVerticalList(children, {
              depth: 0,
              pathPrefix: String(index),
              searchable: this.submenuSearchable,
              searchQuery: this.submenuQueries[submenuId] ?? '',
              searchPlaceholder: this.searchPlaceholder,
              emptyText: this.emptyText,
              submenuId,
              submenuRoot: submenuId,
              closePopover: () => this.closeHorizontalSubmenu(submenuId),
            })}
          </div>
        </le-popover>
      </div>
    );
  }

  private getOverflowMode(): 'more' | 'scroll' | 'hamburger' | 'wrap' {
    if (this.wrap) return 'wrap';
    return this.overflowMode;
  }

  private getBarAlignment(): 'start' | 'end' | 'center' | 'stretch' {
    if (this.align === 'space-between') return 'stretch';
    return this.align;
  }

  private renderOverflowPopover() {
    const items = this.parsedItems;
    const overflowSet = new Set(this.overflowIds || []);

    let itemsToShow: LeOption[];

    if (this.hamburgerActive) {
      itemsToShow = items;
    } else {
      itemsToShow = items.filter((item, index) => {
        const id = this.getItemId(item, String(index));
        return overflowSet.has(id);
      });
    }

    if (itemsToShow.length === 0) return null;

    const isHamburger = this.hamburgerActive;

    return (
      <le-popover
        mode="default"
        offset={8}
        open={this.overflowPopoverOpen}
        showClose={false}
        closeOnClickOutside={true}
        closeOnEscape={true}
        position="bottom"
        align="end"
        minWidth="260px"
        onLePopoverClose={this.closeOverflowPopover}
      >
        <button
          slot="trigger"
          type="button"
          class="overflow-trigger"
          part={isHamburger ? 'hamburger-trigger' : 'more-trigger'}
          aria-label={isHamburger ? 'Open menu' : 'More'}
          onClick={this.openOverflowPopover}
        >
          <slot name={isHamburger ? 'hamburger-trigger' : 'more-trigger'}>
            <le-icon name={isHamburger ? 'hamburger' : 'ellipsis-horizontal'} />
          </slot>
        </button>
        <div class="popover-menu">
          {this.renderVerticalList(itemsToShow, {
            depth: 0,
            pathPrefix: '',
            closePopover: this.closeOverflowPopover,
          })}
        </div>
      </le-popover>
    );
  }

  private renderHorizontal() {
    const items = this.parsedItems;
    const overflowMode = this.getOverflowMode();
    const showOverflowButton = (this.overflowIds?.length ?? 0) > 0 || this.hamburgerActive;

    return (
      <div class="nav-horizontal-wrapper">
        <le-bar
          class={classnames('nav-bar', {
            'align-end': this.align === 'end',
            'align-center': this.align === 'center',
            'align-space-between': this.align === 'space-between',
          })}
          overflow={overflowMode}
          alignItems={this.getBarAlignment()}
          disablePopover={true}
          minVisibleItems={this.minVisibleItemsForMore}
          onLeBarOverflowChange={this.handleBarOverflowChange}
        >
          {items.map((item, index) => this.renderHorizontalItem(item, index))}
        </le-bar>

        {showOverflowButton && this.renderOverflowPopover()}
      </div>
    );
  }

  render() {
    const items = this.parsedItems;

    if (this.orientation === 'horizontal') {
      return (
        <Host>
          <le-component component="le-navigation">
            {this.renderHorizontal()}
            <div style={{ display: 'none' }}>
              <slot></slot>
            </div>
          </le-component>
        </Host>
      );
    }

    return (
      <Host>
        <le-component component="le-navigation">
          <div class="nav-vertical-wrapper">
            {this.renderVerticalList(items, {
              depth: 0,
              pathPrefix: '',
              leadingToggleAncestors: 0,
              searchable: this.searchable,
              searchQuery: this.searchQuery,
              searchPlaceholder: this.searchPlaceholder,
              emptyText: this.emptyText,
            })}
            <div style={{ display: 'none' }}>
              <slot></slot>
            </div>
            {this.isDraggingActive && this.pendingDragItem && (
              <div
                class={classnames('nav-item', 'reorder-ghost', {
                  'has-children': this.getChildItems(this.pendingDragItem).length > 0,
                  [`color-${this.pendingDragItem.color}`]: !!this.pendingDragItem.color,
                })}
                style={{
                  transform: `translate3d(${this.ghostX}px, ${this.ghostY}px, 0)`,
                  width: `${this.dragItemRect?.width ?? 220}px`,
                  paddingLeft: this.draggedPaddingLeft || 'var(--le-nav-item-padding-x)',
                  paddingRight: this.draggedPaddingRight || 'var(--le-nav-item-padding-x)',
                }}
              >
                {this.draggedHasToggle && this.togglePosition !== 'end' && (
                  <span class="nav-toggle" aria-hidden="true">
                    <le-icon
                      name="chevron-down"
                      class={classnames('nav-chevron', { open: this.draggedToggleIsOpen })}
                      aria-hidden="true"
                    />
                  </span>
                )}
                {this.draggedHasToggleSpacer && this.togglePosition !== 'end' && (
                  <span class="nav-toggle-spacer" aria-hidden="true" />
                )}
                {this.pendingDragItem.iconStart && (
                  <span class="nav-icon" aria-hidden="true">
                    {this.renderIcon(this.pendingDragItem.iconStart)}
                  </span>
                )}
                <span class="nav-text">
                  <span class="nav-label">{this.renderLabel(this.pendingDragItem.label)}</span>
                  {this.pendingDragItem.description && (
                    <span class="nav-description">{this.pendingDragItem.description}</span>
                  )}
                </span>
                {this.pendingDragItem.iconEnd && (
                  <span class="nav-icon nav-icon-end" aria-hidden="true">
                    {this.renderIcon(this.pendingDragItem.iconEnd)}
                  </span>
                )}
                {this.draggedHasToggle && this.togglePosition === 'end' && (
                  <span class="nav-toggle" aria-hidden="true">
                    <le-icon
                      name="chevron-down"
                      class={classnames('nav-chevron', { open: this.draggedToggleIsOpen, end: true })}
                      aria-hidden="true"
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        </le-component>
      </Host>
    );
  }
}

import {
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

interface VerticalListRenderOptions {
  depth: number;
  pathPrefix: string;
  parentId?: string;
  autoOpenIds?: Set<string>;
  searchable?: boolean;
  searchQuery?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  submenuId?: string;
  submenuRoot?: string;
  closePopover?: () => void;
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
  @Prop() items: LeOption[] | string = [];

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

  /** ID of the currently focused navigation item */
  @State() private focusedItemId?: string;

  @State() private openSubmenuId?: string;

  private popoverRefs: Map<string, HTMLLePopoverElement> = new Map();

  private instanceId: string = generateId('le-nav');

  private mutationObserver?: MutationObserver;

  private pendingAutoActivationId?: string;

  private renderLabel(label: string | HTMLCollection) {
    if (label instanceof HTMLCollection) {
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
  }

  @Listen('slotchange')
  handleSlotChange() {
    this.buildDeclarativeItems();
  }

  componentWillLoad() {
    this.buildDeclarativeItems();
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
  }

  componentDidRender() {
    const current = this.focusedItemId ? this.getNavElementById(this.focusedItemId) : undefined;
    if (current && this.isElementVisible(current)) {
      return;
    }

    const fallbackId = this.getFirstVisibleItemId();
    if (fallbackId && fallbackId !== this.focusedItemId) {
      this.focusedItemId = fallbackId;
    }
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
    if (this.isDeclarativeMode) {
      return this.declarativeItems;
    }

    return parseOptionInput(this.items, 'le-navigation', 'items');
  }

  private getItemId(item: LeOption, path: string): string {
    return item.id ?? `${this.instanceId}:${path}`;
  }

  private getChildItems(item: LeOption): LeOption[] {
    return Array.isArray(item.children) ? item.children : [];
  }

  private getItemById(
    targetId: string,
    items: LeOption[] = this.parsedItems,
    pathPrefix: string = '',
  ): LeOption | undefined {
    for (const [index, item] of items.entries()) {
      const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
      const id = this.getItemId(item, path);

      if (id === targetId) {
        return item;
      }

      const children = this.getChildItems(item);
      if (children.length > 0) {
        const found = this.getItemById(targetId, children, path);
        if (found) {
          return found;
        }
      }
    }

    return undefined;
  }

  private getNavElements(): HTMLElement[] {
    return Array.from(this.el.shadowRoot?.querySelectorAll<HTMLElement>('[data-nav-id]') ?? []);
  }

  private getNavElementById(id: string): HTMLElement | undefined {
    return this.getNavElements().find(element => element.dataset.navId === id);
  }

  private isElementVisible(element: HTMLElement): boolean {
    return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
  }

  private isElementDisabled(element: HTMLElement): boolean {
    return element.getAttribute('aria-disabled') === 'true' || element.hasAttribute('disabled');
  }

  private getVisibleNavElements(): HTMLElement[] {
    return this.getNavElements().filter(element => this.isElementVisible(element));
  }

  private getFirstVisibleItemId(): string | undefined {
    return this.getVisibleNavElements().find(element => !this.isElementDisabled(element))?.dataset
      .navId;
  }

  private getTopLevelHorizontalElements(): HTMLElement[] {
    return this.getVisibleNavElements().filter(element => {
      return (element.dataset.submenuRoot ?? '') === '' && Number(element.dataset.depth ?? 0) === 0;
    });
  }

  private getLinearGroupForElement(element: HTMLElement): HTMLElement[] {
    const submenuRoot = element.dataset.submenuRoot ?? '';
    const depth = Number(element.dataset.depth ?? 0);

    if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
      return this.getTopLevelHorizontalElements();
    }

    return this.getVisibleNavElements().filter(candidate => {
      return (candidate.dataset.submenuRoot ?? '') === submenuRoot;
    });
  }

  private findAdjacentEnabledElement(
    elements: HTMLElement[],
    currentId: string,
    direction: 1 | -1,
  ): HTMLElement | undefined {
    if (elements.length === 0) return undefined;

    let index = elements.findIndex(element => element.dataset.navId === currentId);
    if (index < 0) {
      index = direction > 0 ? -1 : 0;
    }

    for (let step = 0; step < elements.length; step++) {
      index = (index + direction + elements.length) % elements.length;
      const candidate = elements[index];
      if (!this.isElementDisabled(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  private getFirstEnabledElement(elements: HTMLElement[]): HTMLElement | undefined {
    return elements.find(element => !this.isElementDisabled(element));
  }

  private getLastEnabledElement(elements: HTMLElement[]): HTMLElement | undefined {
    return [...elements].reverse().find(element => !this.isElementDisabled(element));
  }

  private getFirstChildElement(parentId: string, submenuRoot: string): HTMLElement | undefined {
    return this.getVisibleNavElements().find(element => {
      return (
        (element.dataset.parentId ?? '') === parentId &&
        (element.dataset.submenuRoot ?? '') === submenuRoot &&
        !this.isElementDisabled(element)
      );
    });
  }

  private getParentElement(element: HTMLElement): HTMLElement | undefined {
    const parentId = element.dataset.parentId ?? '';
    if (!parentId) return undefined;
    return this.getNavElementById(parentId);
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

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof globalThis.Element)) return false;
    return !!target.closest('input, textarea, [contenteditable="true"]');
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (this.isEditableTarget(event.target)) {
      return;
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

    const currentItem = this.getItemById(currentId);
    if (!currentItem) return;

    const group = this.getLinearGroupForElement(currentElement);
    const submenuRoot = currentElement.dataset.submenuRoot ?? '';
    const depth = Number(currentElement.dataset.depth ?? 0);
    const hasChildren = currentElement.dataset.hasChildren === 'true';
    const isOpen = currentElement.dataset.open === 'true';

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot && hasChildren) {
          this.openHorizontalSubmenu(currentId);
          requestAnimationFrame(() => {
            const firstChild = this.getFirstChildElement(currentId, currentId);
            if (firstChild?.dataset.navId) {
              this.setFocusedItem(firstChild.dataset.navId, true, true);
            }
          });
          return;
        }

        const next = this.findAdjacentEnabledElement(group, currentId, 1);
        if (next?.dataset.navId) {
          this.setFocusedItem(next.dataset.navId, true, true);
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
        if (previous?.dataset.navId) {
          this.setFocusedItem(previous.dataset.navId, true, true);
        }
        return;
      }

      case 'ArrowRight': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
          this.closeHorizontalSubmenu();
          const next = this.findAdjacentEnabledElement(
            this.getTopLevelHorizontalElements(),
            currentId,
            1,
          );
          if (next?.dataset.navId) {
            this.setFocusedItem(next.dataset.navId, true, true);
          }
          return;
        }

        if (hasChildren && !isOpen) {
          this.toggleItemOpen(currentItem, currentId, event, true);
          requestAnimationFrame(() => {
            const firstChild = this.getFirstChildElement(currentId, submenuRoot || currentId);
            if (firstChild?.dataset.navId) {
              this.setFocusedItem(firstChild.dataset.navId, true, true);
            }
          });
          return;
        }

        if (hasChildren && isOpen) {
          const firstChild = this.getFirstChildElement(currentId, submenuRoot || currentId);
          if (firstChild?.dataset.navId) {
            this.setFocusedItem(firstChild.dataset.navId, true, true);
          }
        }
        return;
      }

      case 'ArrowLeft': {
        event.preventDefault();

        if (this.orientation === 'horizontal' && depth === 0 && !submenuRoot) {
          this.closeHorizontalSubmenu();
          const previous = this.findAdjacentEnabledElement(
            this.getTopLevelHorizontalElements(),
            currentId,
            -1,
          );
          if (previous?.dataset.navId) {
            this.setFocusedItem(previous.dataset.navId, true, true);
          }
          return;
        }

        if (hasChildren && isOpen) {
          this.toggleItemOpen(currentItem, currentId, event, false);
          this.setFocusedItem(currentId, true, false);
          return;
        }

        const parentElement = this.getParentElement(currentElement);
        if (parentElement?.dataset.navId) {
          if (this.orientation === 'horizontal' && submenuRoot) {
            this.closeHorizontalSubmenu(submenuRoot);
          }
          this.setFocusedItem(parentElement.dataset.navId, true, false);
        }
        return;
      }

      case 'Home': {
        event.preventDefault();
        const first = this.getFirstEnabledElement(group);
        if (first?.dataset.navId) {
          this.setFocusedItem(first.dataset.navId, true, true);
        }
        return;
      }

      case 'End': {
        event.preventDefault();
        const last = this.getLastEnabledElement(group);
        if (last?.dataset.navId) {
          this.setFocusedItem(last.dataset.navId, true, true);
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
        const parentElement = this.getParentElement(currentElement);
        if (this.orientation === 'horizontal' && submenuRoot && parentElement?.dataset.navId) {
          event.preventDefault();
          this.closeHorizontalSubmenu(submenuRoot);
          this.setFocusedItem(parentElement.dataset.navId, true, false);
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
    const firstEnabledId = filtered.find(item => !item.disabled)
      ? this.getItemId(
          filtered.find(item => !item.disabled) as LeOption,
          pathPrefix
            ? `${pathPrefix}.${filtered.findIndex(item => !item.disabled)}`
            : String(filtered.findIndex(item => !item.disabled)),
        )
      : undefined;

    return (
      <div class={classnames('nav-vertical', { 'is-submenu': !!submenuId })}>
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
              const paddingLeft = `calc(var(--le-nav-item-padding-x) + ${depth} * var(--le-spacing-4))`;
              const TagType = item.href && !item.disabled ? 'a' : 'button';
              const attrs =
                TagType === 'a'
                  ? { href: item.href, target: item.target, role: 'treeitem' }
                  : { type: 'button', role: 'treeitem' };
              const selected = this.isItemSelected(item);
              const itemPart = this.partFromOptionPart('item', item.part, {
                selected,
                disabled: item.disabled,
              });
              const isFocused = this.focusedItemId === id;
              const autoActivatable = !!(item.href || item.action || !hasChildren);
              const isDefaultTabStop =
                !this.focusedItemId && !submenuId && depth === 0 && id === firstEnabledId;

              return (
                <li
                  class={classnames('nav-node', {
                    'disabled': item.disabled,
                    selected,
                    open,
                    'has-children': hasChildren,
                    [`color-${item.color}`]: !!item.color,
                  })}
                  key={id}
                  role="none"
                >
                  <div
                    class={classnames('nav-row', { 'is-focused': isFocused })}
                    style={{ paddingLeft }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        class="nav-toggle"
                        aria-label={open ? 'Collapse' : 'Expand'}
                        aria-expanded={open ? 'true' : 'false'}
                        onClick={(e: MouseEvent) => this.handleToggle(e, item, id)}
                        disabled={item.disabled}
                      >
                        <le-icon name="chevron-down" class="nav-chevron" aria-hidden="true" />
                      </button>
                    ) : (
                      <span class="nav-toggle-spacer" aria-hidden="true" />
                    )}

                    <TagType
                      class={classnames(
                        'nav-item',
                        {
                          disabled: item.disabled,
                          focused: isFocused,
                          selected,
                        },
                        item.className,
                      )}
                      part={itemPart}
                      {...attrs}
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
                      onFocus={() => this.handleInteractiveFocus(id)}
                      onClick={(e: MouseEvent) => this.handleItemSelect(e, item, id, closePopover)}
                    >
                      {item.iconStart && (
                        <span class="nav-icon" aria-hidden="true">
                          {this.renderIcon(item.iconStart)}
                        </span>
                      )}
                      <span class="nav-text">
                        <span class="nav-label">{this.renderLabel(item.label)}</span>
                        {item.description && (
                          <span class="nav-description">{item.description}</span>
                        )}
                      </span>
                      {item.iconEnd && (
                        <span class="nav-icon nav-icon-end" aria-hidden="true">
                          {this.renderIcon(item.iconEnd)}
                        </span>
                      )}
                    </TagType>
                  </div>

                  {hasChildren && (
                    <le-collapse class="nav-children" closed={!open} noFading={true} role="group">
                      {this.renderVerticalList(children, {
                        depth: depth + 1,
                        pathPrefix: path,
                        parentId: id,
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

  private renderHorizontalItem(item: LeOption, index: number) {
    const id = this.getItemId(item, String(index));
    const children = this.getChildItems(item);
    const hasChildren = children.length > 0;
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
                focused: isFocused,
                selected,
                [`color-${item.color}`]: !!item.color,
              },
              item.className,
            )}
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
                    focused: isFocused,
                    selected,
                    [`color-${item.color}`]: !!item.color,
                  },
                  item.className,
                )}
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
                    focused: isFocused,
                    selected,
                    [`color-${item.color}`]: !!item.color,
                  },
                  item.className,
                )}
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
              searchable: this.searchable,
              searchQuery: this.searchQuery,
              searchPlaceholder: this.searchPlaceholder,
              emptyText: this.emptyText,
            })}
            <div style={{ display: 'none' }}>
              <slot></slot>
            </div>
          </div>
        </le-component>
      </Host>
    );
  }
}

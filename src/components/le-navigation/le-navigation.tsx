import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Watch,
  h,
  Host,
} from '@stencil/core';
import { LeOption } from '../../types/options';
import { classnames, generateId } from '../../utils/utils';

export interface LeNavigationItemSelectDetail {
  item: LeOption;
  id: string;
  href?: string;
  originalEvent: MouseEvent;
}

export interface LeNavigationItemToggleDetail {
  item: LeOption;
  id: string;
  open: boolean;
  originalEvent: MouseEvent;
}

interface VerticalListRenderOptions {
  depth: number;
  pathPrefix: string;
  autoOpenIds?: Set<string>;
  searchable?: boolean;
  searchQuery?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  submenuId?: string;
}

/**
 * Navigation component with vertical (tree) and horizontal (menu) layouts.
 *
 * - Accepts items as `LeOption[]` or a JSON string.
 * - Supports hierarchical items via `children`.
 * - Supports persisted expansion via `open` on items.
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
  @Element() el: HTMLElement;

  /**
   * Navigation items.
   * Can be passed as an array or JSON string (same pattern as le-select).
   */
  @Prop() items: LeOption[] | string = [];

  /**
   * Layout orientation.
   */
  @Prop({ reflect: true }) orientation: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Horizontal wrapping behavior.
   * If false, overflow behavior depends on `overflowMode`.
   */
  @Prop({ reflect: true }) wrap: boolean = true;

  /**
   * Overflow behavior for horizontal, non-wrapping menus.
   * - more: moves overflow items into a "More" popover
   * - hamburger: turns the whole nav into a hamburger popover
   */
  @Prop({ reflect: true }) overflowMode: 'more' | 'hamburger' = 'more';

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
   * Fired when a navigation item is activated.
   *
   * This event is cancelable. Call `event.preventDefault()` to prevent
   * default browser navigation and implement custom routing.
   */
  @Event({ cancelable: true }) leNavItemSelect: EventEmitter<LeNavigationItemSelectDetail>;

  /**
   * Fired when a tree branch is toggled.
   */
  @Event() leNavItemToggle: EventEmitter<LeNavigationItemToggleDetail>;

  @State() private searchQuery: string = '';

  @State() private openState: Record<string, boolean> = {};

  @State() private overflowIds: string[] = [];

  @State() private hamburgerActive: boolean = false;

  @State() private submenuQueries: Record<string, string> = {};

  private navContainerEl?: HTMLElement;

  private measureEl?: HTMLElement;
  private measureMoreEl?: HTMLElement;

  private topItemEls: Map<string, HTMLElement> = new Map();

  private popoverRefs: Map<string, HTMLLePopoverElement> = new Map();

  private resizeObserver?: ResizeObserver;

  private instanceId: string = generateId('le-nav');

  @Watch('items')
  @Watch('orientation')
  @Watch('wrap')
  @Watch('overflowMode')
  handleLayoutInputsChange() {
    this.scheduleOverflowRecalc();
  }

  componentDidLoad() {
    this.setupResizeObserver();
    this.scheduleOverflowRecalc();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  componentDidRender() {
    // In case refs change after render.
    this.scheduleOverflowRecalc();
  }

  private setupResizeObserver() {
    this.resizeObserver?.disconnect();

    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => this.computeOverflow());
    this.observeContainer(this.navContainerEl);
  }

  private observeContainer(el?: HTMLElement) {
    if (!this.resizeObserver) return;
    this.resizeObserver.disconnect();
    if (el) this.resizeObserver.observe(el);
  }

  private scheduleOverflowRecalc() {
    // Avoid work for vertical layout.
    if (this.orientation !== 'horizontal') return;

    // Ensure it runs after layout.
    requestAnimationFrame(() => this.computeOverflow());
  }

  private get parsedItems(): LeOption[] {
    if (typeof this.items === 'string') {
      try {
        return JSON.parse(this.items);
      } catch {
        return [];
      }
    }

    return this.items;
  }

  private getItemId(item: LeOption, path: string): string {
    return item.id ?? `${this.instanceId}:${path}`;
  }

  private getChildItems(item: LeOption): LeOption[] {
    return Array.isArray(item.children) ? item.children : [];
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

  private handleItemSelect = (e: MouseEvent, item: LeOption, id: string) => {
    if (item.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const emitted = this.leNavItemSelect.emit({
      item,
      id,
      href: item.href,
      originalEvent: e,
    });

    if (emitted.defaultPrevented) {
      e.preventDefault();
    }
  };

  private handleToggle = (e: MouseEvent, item: LeOption, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.disabled) return;

    const next = !this.isOpen(item, id);
    this.setOpen(id, next);

    this.leNavItemToggle.emit({
      item,
      id,
      open: next,
      originalEvent: e,
    });
  };

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

    // Position may change as items filter.
    requestAnimationFrame(() => this.popoverRefs.get(submenuId)?.updatePosition());
  };

  private getTopLevelIds(items: LeOption[]): string[] {
    return items.map((item, index) => this.getItemId(item, String(index)));
  }

  private computeOverflow() {
    // Only applies to horizontal, non-wrapping navs.
    if (this.orientation !== 'horizontal' || this.wrap) {
      if (this.overflowIds.length) this.overflowIds = [];
      if (this.hamburgerActive) this.hamburgerActive = false;
      return;
    }

    const container = this.navContainerEl;
    if (!container) return;

    const topIds = this.getTopLevelIds(this.parsedItems);
    const widths = topIds.map(id => this.topItemEls.get(id)?.getBoundingClientRect().width ?? 0);

    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const availableWidth = container.getBoundingClientRect().width;

    if (this.overflowMode === 'hamburger') {
      const shouldHamburger = totalWidth > availableWidth;
      if (shouldHamburger !== this.hamburgerActive) {
        this.hamburgerActive = shouldHamburger;
      }
      if (this.overflowIds.length) this.overflowIds = [];
      return;
    }

    // overflowMode === 'more'
    this.computeOverflowMoreByWrap(availableWidth);
  }

  private computeOverflowMoreByWrap(availableWidth: number) {
    const container = this.navContainerEl;
    const measure = this.measureEl;
    const measureMore = this.measureMoreEl;
    const items = this.parsedItems;

    if (!container || !measure) return;

    // Ensure measurement container matches visible container width.
    measure.style.width = `${availableWidth}px`;

    const allIds = this.getTopLevelIds(items);
    const itemEls = allIds
      .map(id => measure.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(id)}"]`))
      .filter((el): el is HTMLElement => !!el);

    // Reset measurement visibility.
    itemEls.forEach(el => {
      el.style.display = '';
    });
    if (measureMore) {
      measureMore.style.display = 'none';
    }

    if (itemEls.length === 0) {
      if (this.overflowIds.length) this.overflowIds = [];
      return;
    }

    const firstRowTop = Math.min(...itemEls.map(el => el.offsetTop));
    const overflowSet = new Set<string>();

    // Pass 1: detect which items fall onto rows > 1 (without "More" in flow).
    itemEls.forEach(el => {
      const id = el.getAttribute('data-nav-id');
      if (!id) return;
      if (el.offsetTop > firstRowTop) overflowSet.add(id);
    });

    if (overflowSet.size === 0) {
      if (this.overflowIds.length) this.overflowIds = [];
      return;
    }

    // Pass 2: show "More" and iteratively move items into overflow until "More" fits on row 1.
    if (measureMore) {
      measureMore.style.display = '';
    }

    // Hide currently overflowing items.
    itemEls.forEach(el => {
      const id = el.getAttribute('data-nav-id');
      if (!id) return;
      if (overflowSet.has(id)) el.style.display = 'none';
    });

    const getVisibleItemEls = () => itemEls.filter(el => el.style.display !== 'none');

    while (measureMore) {
      const visible = getVisibleItemEls();
      const rowTop = visible.length ? Math.min(...visible.map(el => el.offsetTop)) : 0;

      if (measureMore.offsetTop <= rowTop) break;
      if (visible.length === 0) break;

      // Remove one last visible item and retry.
      const last = visible[visible.length - 1];
      const lastId = last.getAttribute('data-nav-id');
      if (!lastId) break;

      last.style.display = 'none';
      overflowSet.add(lastId);
    }

    const overflowIds = allIds.filter(id => overflowSet.has(id));

    const same =
      overflowIds.length === this.overflowIds.length &&
      overflowIds.every((v, i) => v === this.overflowIds[i]);

    if (!same) {
      this.overflowIds = overflowIds;
    }
  }

  private renderHorizontalMeasureItem(item: LeOption, index: number) {
    const id = this.getItemId(item, String(index));
    const children = this.getChildItems(item);
    const hasChildren = children.length > 0;

    const setRef = (el?: HTMLElement) => {
      if (el) this.topItemEls.set(id, el);
    };

    if (!hasChildren) {
      return (
        <div class="h-item" ref={setRef} data-nav-id={id}>
          <span class="h-link">
            {item.iconStart && (
              <span class="nav-icon" aria-hidden="true">
                {item.iconStart}
              </span>
            )}
            <span class="h-label">{item.label}</span>
            {item.iconEnd && (
              <span class="nav-icon nav-icon-end" aria-hidden="true">
                {item.iconEnd}
              </span>
            )}
          </span>
        </div>
      );
    }

    return (
      <div class="h-item" ref={setRef} data-nav-id={id}>
        <span class="h-trigger">
          <span class="h-link">
            {item.iconStart && (
              <span class="nav-icon" aria-hidden="true">
                {item.iconStart}
              </span>
            )}
            <span class="h-label">{item.label}</span>
          </span>
          <span class="h-submenu-toggle" aria-hidden="true">
            <span class="nav-chevron">▼</span>
          </span>
        </span>
      </div>
    );
  }

  private renderVerticalList(
    items: LeOption[],
    {
      depth,
      pathPrefix,
      autoOpenIds,
      searchable,
      searchQuery,
      searchPlaceholder,
      emptyText,
      submenuId,
    }: VerticalListRenderOptions,
  ) {
    const query = searchQuery ?? '';
    const openFromSearch = autoOpenIds ?? new Set<string>();

    const filtered = query ? this.filterTree(items, query, pathPrefix, openFromSearch) : items;

    return (
      <div class={classnames('nav-vertical', { 'is-submenu': !!submenuId })}>
        {searchable && (
          <div class="nav-search">
            <le-string-input
              mode="default"
              class="nav-search-input"
              placeholder={searchPlaceholder ?? 'Search...'}
              value={query}
              onInput={(e: Event) =>
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
                  ? { href: item.href, role: 'treeitem' }
                  : { type: 'button', role: 'treeitem' };

              return (
                <li
                  class={classnames('nav-node', {
                    'disabled': item.disabled,
                    'selected': item.selected,
                    open,
                    'has-children': hasChildren,
                  })}
                  key={id}
                  role="none"
                >
                  <div class="nav-row" style={{ paddingLeft }}>
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
                      class="nav-item"
                      {...attrs}
                      aria-disabled={item.disabled ? 'true' : undefined}
                      onClick={(e: MouseEvent) => {
                        // For buttons, also toggle if this is a purely structural node.
                        this.handleItemSelect(e, item, id);
                        if (!item.href && hasChildren && !item.disabled) {
                          this.handleToggle(e, item, id);
                        }
                      }}
                    >
                      {item.iconStart && (
                        <span class="nav-icon" aria-hidden="true">
                          {item.iconStart}
                        </span>
                      )}
                      <span class="nav-text">
                        <span class="nav-label">{item.label}</span>
                        {item.description && (
                          <span class="nav-description">{item.description}</span>
                        )}
                      </span>
                      {item.iconEnd && (
                        <span class="nav-icon nav-icon-end" aria-hidden="true">
                          {item.iconEnd}
                        </span>
                      )}
                    </TagType>
                  </div>

                  {hasChildren && (
                    <le-collapse class="nav-children" closed={!open} noFading={true} role="group">
                      {this.renderVerticalList(children, {
                        depth: depth + 1,
                        pathPrefix: path,
                        autoOpenIds: openFromSearch,
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

    if (!hasChildren) {
      const TagType = item.href && !item.disabled ? 'a' : 'button';
      const attrs =
        TagType === 'a'
          ? { href: item.href, role: 'menuitem' }
          : { type: 'button', role: 'menuitem' };

      return (
        <div class="h-item">
          <TagType
            class={classnames('h-link', {
              disabled: item.disabled,
              selected: item.selected,
            })}
            {...attrs}
            aria-disabled={item.disabled ? 'true' : undefined}
            onClick={(e: MouseEvent) => this.handleItemSelect(e, item, id)}
          >
            {item.iconStart && (
              <span class="nav-icon" aria-hidden="true">
                {item.iconStart}
              </span>
            )}
            <span class="h-label">{item.label}</span>
            {item.iconEnd && (
              <span class="nav-icon nav-icon-end" aria-hidden="true">
                {item.iconEnd}
              </span>
            )}
          </TagType>
        </div>
      );
    }

    const submenuId = id;

    return (
      <div class="h-item">
        <le-popover
          ref={el => {
            if (el) this.popoverRefs.set(submenuId, el);
          }}
          mode="default"
          showClose={false}
          closeOnClickOutside={true}
          closeOnEscape={true}
          position="bottom"
          align="start"
          minWidth="240px"
        >
          <div
            slot="trigger"
            class={classnames('h-trigger', {
              disabled: item.disabled,
              selected: item.selected,
            })}
            role="menuitem"
            aria-disabled={item.disabled ? 'true' : undefined}
            onClick={(e: MouseEvent) => {
              // Don’t let le-popover auto-toggle from its internal wrapper.
              e.stopPropagation();
              if (item.disabled) return;

              if (item.href) {
                this.handleItemSelect(e, item, id);
              } else {
                this.popoverRefs.get(submenuId)?.toggle();
              }
            }}
          >
            {item.href ? (
              <a
                class="h-link"
                href={item.href}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  this.handleItemSelect(e, item, id);
                }}
              >
                {item.iconStart && (
                  <span class="nav-icon" aria-hidden="true">
                    {item.iconStart}
                  </span>
                )}
                <span class="h-label">{item.label}</span>
              </a>
            ) : (
              <button
                type="button"
                class="h-link"
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  if (item.disabled) return;
                  this.popoverRefs.get(submenuId)?.toggle();
                }}
              >
                {item.iconStart && (
                  <span class="nav-icon" aria-hidden="true">
                    {item.iconStart}
                  </span>
                )}
                <span class="h-label">{item.label}</span>
              </button>
            )}

            <button
              type="button"
              class="h-submenu-toggle"
              aria-label="Open submenu"
              onClick={(e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.disabled) return;
                this.popoverRefs.get(submenuId)?.toggle();
              }}
            >
              <span class="nav-chevron" aria-hidden="true">
                <le-icon name="chevron-down" />
              </span>
            </button>
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
            })}
          </div>
        </le-popover>
      </div>
    );
  }

  private renderHorizontal() {
    const items = this.parsedItems;

    const overflowSet = new Set(this.overflowIds);

    const overflowItems: LeOption[] = [];
    items.forEach((item, index) => {
      const id = this.getItemId(item, String(index));
      if (!this.wrap && this.overflowMode === 'more' && overflowSet.has(id)) {
        overflowItems.push(item);
      }
    });

    // Hamburger mode: show a single trigger if anything overflows.
    if (!this.wrap && this.overflowMode === 'hamburger' && this.hamburgerActive) {
      return (
        <div class="nav-horizontal-shell">
          <div
            class="nav-horizontal-measure"
            aria-hidden="true"
            ref={el => {
              this.measureEl = el as HTMLElement;
            }}
          >
            {items.map((item, index) => this.renderHorizontalMeasureItem(item, index))}
            <div
              class="h-item"
              ref={el => {
                this.measureMoreEl = el as HTMLElement;
              }}
            >
              <button type="button" class="overflow-trigger">
                More
              </button>
            </div>
          </div>

          <div
            class="nav-horizontal"
            ref={el => {
              this.navContainerEl = el as HTMLElement;
              this.setupResizeObserver();
              this.observeContainer(this.navContainerEl);
            }}
          >
            <le-popover
              mode="default"
              showClose={false}
              closeOnClickOutside={true}
              closeOnEscape={true}
              position="bottom"
              align="end"
              minWidth="260px"
            >
              <button slot="trigger" type="button" class="overflow-trigger" aria-label="Open menu">
                ☰
              </button>
              <div class="popover-menu">
                {this.renderVerticalList(items, { depth: 0, pathPrefix: '' })}
              </div>
            </le-popover>
          </div>
        </div>
      );
    }

    const showMore = !this.wrap && this.overflowMode === 'more' && overflowItems.length > 0;

    return (
      <div class="nav-horizontal-shell" role="menubar">
        <div
          class="nav-horizontal-measure"
          aria-hidden="true"
          ref={el => {
            this.measureEl = el as HTMLElement;
          }}
        >
          {items.map((item, index) => this.renderHorizontalMeasureItem(item, index))}
          <div
            class="h-item"
            ref={el => {
              this.measureMoreEl = el as HTMLElement;
            }}
          >
            <button type="button" class="overflow-trigger">
              More
            </button>
          </div>
        </div>

        <div
          class={classnames('nav-horizontal', {
            wrap: this.wrap,
            nowrap: !this.wrap,
          })}
          ref={el => {
            this.navContainerEl = el as HTMLElement;
            this.setupResizeObserver();
            this.observeContainer(this.navContainerEl);
          }}
        >
          {items.map((item, index) => {
            const id = this.getItemId(item, String(index));
            const isOverflow = !this.wrap && this.overflowMode === 'more' && overflowSet.has(id);
            if (isOverflow) return null;
            return this.renderHorizontalItem(item, index);
          })}

          {/* Render a hidden trigger for measurement when not visible */}
          <div
            class={classnames('more-trigger-wrap', {
              'is-visible': showMore,
              'is-measure': !showMore,
            })}
          >
            <le-popover
              mode="default"
              position="bottom"
              align="end"
              minWidth="260px"
              showClose={false}
            >
              <button slot="trigger" type="button" class="overflow-trigger" aria-label="More">
                More
              </button>
              <div class="popover-menu">
                {this.renderVerticalList(overflowItems, { depth: 0, pathPrefix: '' })}
              </div>
            </le-popover>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const items = this.parsedItems;

    if (this.orientation === 'horizontal') {
      return (
        <Host>
          <le-component component="le-navigation">{this.renderHorizontal()}</le-component>
        </Host>
      );
    }

    return (
      <Host>
        <le-component component="le-navigation">
          {this.renderVerticalList(items, {
            depth: 0,
            pathPrefix: '',
            searchable: this.searchable,
            searchQuery: this.searchQuery,
            searchPlaceholder: this.searchPlaceholder,
            emptyText: this.emptyText,
          })}
        </le-component>
      </Host>
    );
  }
}

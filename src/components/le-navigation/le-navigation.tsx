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
import { LeBarOverflowChangeDetail } from '../le-bar/le-bar';

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
  closePopover?: () => void;
}

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
  @Element() el: HTMLElement;

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
  @Prop({ reflect: true }) wrap: boolean = true;

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

  /** IDs of items currently in overflow (from le-bar) */
  @State() private overflowIds: string[] = [];

  /** Whether hamburger mode is active (from le-bar) */
  @State() private hamburgerActive: boolean = false;

  @State() private submenuQueries: Record<string, string> = {};

  /** Whether the overflow popover is open */
  @State() private overflowPopoverOpen: boolean = false;

  private popoverRefs: Map<string, HTMLLePopoverElement> = new Map();

  private instanceId: string = generateId('le-nav');

  private partFromOptionPart(base: string, part?: string): string {
    const raw = (part ?? '').trim();
    if (!raw) return base;

    const tokens = raw
      .split(/\s+/)
      .map(t => t.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean);

    if (tokens.length === 0) return base;

    return [base, ...tokens.map(t => `${base}-${t}`)].join(' ');
  }

  @Watch('items')
  @Watch('orientation')
  @Watch('wrap')
  @Watch('overflowMode')
  handleLayoutInputsChange() {
    // Reset overflow state when layout inputs change
    this.overflowIds = [];
    this.hamburgerActive = false;
  }

  disconnectedCallback() {
    // Cleanup if needed
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
      autoOpenIds,
      searchable,
      searchQuery,
      searchPlaceholder,
      emptyText,
      submenuId,
      closePopover,
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

              const itemPart = this.partFromOptionPart('item', item.part);

              return (
                <li
                  class={classnames('nav-node', {
                    'disabled': item.disabled,
                    'selected': item.selected || (this.activeUrl && item.href === this.activeUrl),
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
                      part={itemPart}
                      {...attrs}
                      aria-disabled={item.disabled ? 'true' : undefined}
                      onClick={(e: MouseEvent) => {
                        // For buttons, also toggle if this is a purely structural node.
                        this.handleItemSelect(e, item, id);
                        if (!item.href && hasChildren && !item.disabled) {
                          this.handleToggle(e, item, id);
                          return;
                        }

                        if (!item.disabled && closePopover) {
                          closePopover();
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
                        submenuId,
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

    if (!hasChildren) {
      const TagType = item.href && !item.disabled ? 'a' : 'button';
      const attrs =
        TagType === 'a'
          ? { href: item.href, role: 'menuitem' }
          : { type: 'button', role: 'menuitem' };

      const itemPart = this.partFromOptionPart('item', item.part);

      return (
        <div class="h-item" data-bar-id={id}>
          <TagType
            class={classnames('h-link', {
              disabled: item.disabled,
              selected: item.selected || (this.activeUrl && item.href === this.activeUrl),
            })}
            part={itemPart}
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

    const itemPart = this.partFromOptionPart('item', item.part);

    return (
      <div class="h-item" data-bar-id={id}>
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
              selected: item.selected || (this.activeUrl && item.href === this.activeUrl),
            })}
            part={itemPart}
            role="menuitem"
            aria-disabled={item.disabled ? 'true' : undefined}
            onClick={(e: MouseEvent) => {
              // Don’t let le-popover auto-toggle from its internal wrapper.
              e.stopPropagation();
              if (item.disabled) return;

              if (item.href) {
                this.handleItemSelect(e, item, id);
                this.popoverRefs.get(submenuId)?.hide();
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
                <span class="nav-chevron" aria-hidden="true">
                  <le-icon name="chevron-down" />
                </span>
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
              closePopover: () => this.popoverRefs.get(submenuId)?.hide(),
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
    // Map le-navigation align to le-bar alignItems
    // 'space-between' doesn't map directly, use 'stretch' as closest
    if (this.align === 'space-between') return 'stretch';
    return this.align;
  }

  private renderOverflowPopover() {
    const items = this.parsedItems;
    const overflowSet = new Set(this.overflowIds || []);

    // Determine which items to show in the popover
    let itemsToShow: LeOption[];

    if (this.hamburgerActive) {
      // In hamburger mode, show all items
      itemsToShow = items;
    } else {
      // In "more" mode, show only overflow items
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
          onLeBarOverflowChange={this.handleBarOverflowChange}
        >
          {items.map((item, index) => this.renderHorizontalItem(item, index))}
        </le-bar>

        {/* Overflow popover - rendered outside le-bar to have full control over content */}
        {showOverflowButton && this.renderOverflowPopover()}
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

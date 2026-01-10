import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  h,
  Element,
  Watch,
  Host,
  Method,
  Listen,
} from '@stencil/core';
import { classnames, generateId } from '../../utils/utils';

export interface LeBarOverflowChangeDetail {
  /** IDs of items that are currently overflowing (in the "more" popover) */
  overflowingIds: string[];
  /** Whether hamburger mode is active */
  hamburgerActive: boolean;
}

/**
 * A flexible bar component that handles overflow gracefully.
 *
 * Items are slotted children. The bar measures which items fit on the first
 * row and handles overflow according to the `overflow` prop.
 *
 * @slot - Bar items (children will be measured for overflow)
 * @slot more - Custom "more" button content
 * @slot hamburger - Custom hamburger button content
 * @slot start-arrow - Custom left scroll arrow
 * @slot end-arrow - Custom right scroll arrow
 * @slot all-menu - Custom "show all" menu button
 *
 * @csspart container - The main bar container
 * @csspart item - Individual items in the bar
 * @csspart more-button - The "more" overflow button
 * @csspart hamburger-button - The hamburger menu button
 * @csspart arrow-start - The start (left) scroll arrow
 * @csspart arrow-end - The end (right) scroll arrow
 * @csspart all-menu-button - The "show all" menu button
 * @csspart popover-content - The popover content wrapper
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-bar',
  styleUrl: 'le-bar.css',
  shadow: true,
})
export class LeBar {
  @Element() el: HTMLElement;

  /**
   * Overflow behavior when items don't fit on one row.
   * - `more`: Overflow items appear in a "more" dropdown
   * - `scroll`: Items scroll horizontally with optional arrows
   * - `hamburger`: All items go into a hamburger menu if any overflow
   * - `wrap`: Items wrap to additional rows
   */
  @Prop({ reflect: true }) overflow: 'more' | 'scroll' | 'hamburger' | 'wrap' = 'more';

  /**
   * Alignment of items within the bar (maps to justify-content).
   */
  @Prop({ reflect: true }) alignItems: 'start' | 'end' | 'center' | 'stretch' = 'start';

  /**
   * Show scroll arrows when overflow is "scroll".
   */
  @Prop() arrows: boolean = false;

  /**
   * Disable the internal overflow popover.
   * When true, the bar still detects overflow and hides items,
   * but doesn't render its own popover. Use this when providing
   * custom overflow handling via the leBarOverflowChange event.
   */
  @Prop() disablePopover: boolean = false;

  /**
   * Show an "all items" menu button.
   * - `false`: Don't show
   * - `true` or `'end'`: Show at end
   * - `'start'`: Show at start
   */
  @Prop() showAllMenu: boolean | 'start' | 'end' = false;

  /**
   * Emitted when overflow state changes.
   */
  @Event() leBarOverflowChange: EventEmitter<LeBarOverflowChangeDetail>;

  /** Whether the hamburger/more popover is open */
  @State() private popoverOpen: boolean = false;

  /** Whether hamburger mode is active (for hamburger overflow) */
  @State() private hamburgerActive: boolean = false;

  /** IDs of items that are overflowing */
  @State() private overflowingIds: Set<string> = new Set();

  /** Whether we can scroll left */
  @State() private canScrollStart: boolean = false;

  /** Whether we can scroll right */
  @State() private canScrollEnd: boolean = false;

  /** Whether the all-menu popover is open */
  @State() private allMenuOpen: boolean = false;

  /** Current height of the items container (for overflow handling) */
  @State() private containerHeight: number | null = null;

  private itemsContainerEl?: HTMLElement;
  private moreButtonEl?: HTMLElement;

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private instanceId: string = generateId('le-bar');

  // Map to track item elements and their IDs
  private itemMap: Map<string, HTMLElement> = new Map();

  // Prevent multiple recalculations in the same frame
  private pendingRecalc: number | null = null;

  @Watch('overflow')
  handleOverflowChange() {
    this.resetOverflowState();
    this.scheduleOverflowRecalc();
  }

  @Listen('slotchange')
  handleSlotChange() {
    this.scheduleOverflowRecalc();
  }

  connectedCallback() {
    this.setupObservers();
  }

  componentDidLoad() {
    this.scheduleOverflowRecalc();
  }

  componentDidRender() {
    // Recalculate after render in case children changed
    this.scheduleOverflowRecalc();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  /**
   * Force recalculation of overflow state.
   */
  @Method()
  async recalculate() {
    this.computeOverflow();
  }

  private setupObservers() {
    // ResizeObserver for container size changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.computeOverflow();
        this.updateScrollState();
      });
    }

    // MutationObserver for child changes
    this.mutationObserver = new MutationObserver(() => {
      this.scheduleOverflowRecalc();
    });

    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: false,
    });
  }

  private observeContainer(el?: HTMLElement) {
    if (!this.resizeObserver) return;
    this.resizeObserver.disconnect();
    if (el) this.resizeObserver.observe(el);
  }

  private scheduleOverflowRecalc() {
    // Debounce recalculations to prevent infinite loops
    if (this.pendingRecalc !== null) {
      cancelAnimationFrame(this.pendingRecalc);
    }
    this.pendingRecalc = requestAnimationFrame(() => {
      this.pendingRecalc = null;
      this.computeOverflow();
    });
  }

  private resetOverflowState() {
    this.hamburgerActive = false;
    this.overflowingIds = new Set();
    this.containerHeight = null;
    this.popoverOpen = false;
  }

  private getSlottedItems(): HTMLElement[] {
    // Get direct children from the light DOM (excluding named slot elements)
    return Array.from(this.el.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('slot'),
    );
  }

  private getItemId(el: HTMLElement, index: number): string {
    return el.id || el.dataset.barId || `${this.instanceId}-item-${index}`;
  }

  private computeOverflow() {
    if (this.overflow === 'wrap' || this.overflow === 'scroll') {
      // No overflow handling needed for wrap/scroll modes
      this.resetOverflowState();
      this.updateScrollState();
      return;
    }

    const container = this.itemsContainerEl;
    if (!container) return;

    const items = this.getSlottedItems();
    if (items.length === 0) {
      this.resetOverflowState();
      return;
    }

    // Force a layout recalc
    container.offsetHeight;

    // Build item map
    this.itemMap.clear();
    items.forEach((item, index) => {
      const id = this.getItemId(item, index);
      this.itemMap.set(id, item);
    });

    // Get the position of items to determine which are on the first row
    const itemRects = items.map((item, index) => ({
      item,
      id: this.getItemId(item, index),
      rect: item.getBoundingClientRect(),
    }));

    if (itemRects.length === 0) {
      return;
    }

    // Find the first row's top position (accounting for vertical alignment)
    const containerRect = container.getBoundingClientRect();
    const topValues = itemRects.map(i => i.rect.top - containerRect.top);
    const minTop = Math.min(...topValues);

    // Items are on the first row if their top is close to minTop
    // Allow some tolerance for alignment differences
    const tolerance = 15;
    const firstRowItems = itemRects.filter(
      i => i.rect.top - containerRect.top <= minTop + tolerance,
    );
    const overflowItems = itemRects.filter(
      i => i.rect.top - containerRect.top > minTop + tolerance,
    );

    // Calculate the height of the first row
    const firstRowBottom =
      firstRowItems.length > 0
        ? Math.max(...firstRowItems.map(i => i.rect.bottom - containerRect.top))
        : 0;

    if (this.overflow === 'hamburger') {
      // In hamburger mode, if ANY item overflows, all go into the menu
      const shouldHamburger = overflowItems.length > 0;

      if (shouldHamburger !== this.hamburgerActive) {
        this.hamburgerActive = shouldHamburger;
        this.emitOverflowChange();
      }

      // Set height to show only first row (or hide all if hamburger is active)
      if (shouldHamburger && firstRowBottom > 0) {
        this.containerHeight = firstRowBottom;
      } else {
        this.containerHeight = null;
      }
    } else {
      // 'more' mode
      const newOverflowingIds = new Set(overflowItems.map(i => i.id));

      // Check if we need to make room for the "more" button
      if (newOverflowingIds.size > 0 && this.moreButtonEl) {
        const moreRect = this.moreButtonEl.getBoundingClientRect();
        const moreTop = moreRect.top - containerRect.top;

        // If "more" button is not on the first row, we need to hide one more item
        if (moreTop > minTop + tolerance) {
          // Find the last visible item and move it to overflow
          const lastVisible = firstRowItems[firstRowItems.length - 1];
          if (lastVisible) {
            newOverflowingIds.add(lastVisible.id);
          }
        }
      }

      // Check if overflow state changed
      const hasChanged =
        newOverflowingIds.size !== this.overflowingIds.size ||
        ![...newOverflowingIds].every(id => this.overflowingIds.has(id));

      if (hasChanged) {
        this.overflowingIds = newOverflowingIds;
        this.emitOverflowChange();
      }

      // Set container height to show only first row
      if ((newOverflowingIds?.size ?? 0) > 0 && firstRowBottom > 0) {
        this.containerHeight = firstRowBottom;
      } else {
        this.containerHeight = null;
      }
    }
  }

  private emitOverflowChange() {
    this.leBarOverflowChange.emit({
      overflowingIds: [...(this.overflowingIds ?? [])],
      hamburgerActive: this.hamburgerActive,
    });
  }

  private updateScrollState() {
    if (this.overflow !== 'scroll' || !this.itemsContainerEl) {
      this.canScrollStart = false;
      this.canScrollEnd = false;
      return;
    }

    const el = this.itemsContainerEl;
    this.canScrollStart = el.scrollLeft > 0;
    this.canScrollEnd = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
  }

  private handleScroll = () => {
    this.updateScrollState();
  };

  private scrollToStart = () => {
    if (!this.itemsContainerEl) return;

    const items = this.getSlottedItems();
    const container = this.itemsContainerEl;

    // Find the scroll position of the previous item
    const currentScroll = container.scrollLeft;
    let targetScroll = 0;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      // Calculate item's left edge relative to container's scroll position
      const itemLeft = item.offsetLeft - container.offsetLeft;

      // If this item starts before current scroll position, scroll to it
      if (itemLeft < currentScroll - 1) {
        targetScroll = itemLeft;
        break;
      }
    }

    container.scrollTo({ left: targetScroll, behavior: 'smooth' });

    // Update scroll state after animation
    setTimeout(() => this.updateScrollState(), 300);
  };

  private scrollToEnd = () => {
    if (!this.itemsContainerEl) return;

    const container = this.itemsContainerEl;
    const items = this.getSlottedItems();

    if (items.length === 0) return;

    const containerWidth = container.clientWidth;
    const currentScroll = container.scrollLeft;

    let targetScroll = container.scrollWidth - containerWidth;

    for (const item of items) {
      // Calculate item's right edge relative to container
      const itemLeft = item.offsetLeft - container.offsetLeft;

      // If this is the next item to scroll to from left to right then scroll to it
      if (itemLeft > currentScroll + 1) {
        targetScroll = itemLeft;
        break;
      }
    }

    container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });

    // Update scroll state after animation
    setTimeout(() => this.updateScrollState(), 300);
  };

  private togglePopover = () => {
    this.popoverOpen = !this.popoverOpen;
  };

  private closePopover = () => {
    this.popoverOpen = false;
  };

  private toggleAllMenu = () => {
    this.allMenuOpen = !this.allMenuOpen;
  };

  private closeAllMenu = () => {
    this.allMenuOpen = false;
  };

  private handleItemClick = (_e: MouseEvent, id: string) => {
    // Close popover when an item inside is clicked
    const originalItem = this.itemMap.get(id);

    if (originalItem) {
      // Clone the click to the original item
      const cloneEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      originalItem.dispatchEvent(cloneEvent);
    }

    this.closePopover();
    this.closeAllMenu();
  };

  private renderMoreButton() {
    const hasSlottedMore = this.el.querySelector('[slot="more"]');

    return (
      <button
        class="bar-more-button"
        part="more-button"
        ref={el => (this.moreButtonEl = el)}
        onClick={this.togglePopover}
        aria-expanded={String(this.popoverOpen)}
        aria-haspopup="true"
      >
        {hasSlottedMore ? <slot name="more" /> : <le-icon name="ellipsis-horizontal" />}
      </button>
    );
  }

  private renderHamburgerButton() {
    const hasSlottedHamburger = this.el.querySelector('[slot="hamburger"]');

    return (
      <button
        class="bar-hamburger-button"
        part="hamburger-button"
        onClick={this.togglePopover}
        aria-expanded={String(this.popoverOpen)}
        aria-haspopup="true"
      >
        {hasSlottedHamburger ? <slot name="hamburger" /> : <le-icon name="hamburger" />}
      </button>
    );
  }

  private renderScrollArrows() {
    if (!this.arrows || this.overflow !== 'scroll') return null;

    const hasSlottedStartArrow = this.el.querySelector('[slot="start-arrow"]');
    const hasSlottedEndArrow = this.el.querySelector('[slot="end-arrow"]');

    return [
      <button
        class={classnames('bar-arrow', 'bar-arrow-start', {
          disabled: !this.canScrollStart,
        })}
        part="arrow-start"
        onClick={this.scrollToStart}
        disabled={!this.canScrollStart}
        aria-label="Scroll to start"
      >
        {hasSlottedStartArrow ? (
          <slot name="start-arrow" />
        ) : (
          <le-icon name="chevron-down" class="arrow-icon-start" />
        )}
      </button>,
      <button
        class={classnames('bar-arrow', 'bar-arrow-end', {
          disabled: !this.canScrollEnd,
        })}
        part="arrow-end"
        onClick={this.scrollToEnd}
        disabled={!this.canScrollEnd}
        aria-label="Scroll to end"
      >
        {hasSlottedEndArrow ? (
          <slot name="end-arrow" />
        ) : (
          <le-icon name="chevron-down" class="arrow-icon-end" />
        )}
      </button>,
    ];
  }

  private renderAllMenuButton() {
    if (!this.showAllMenu) return null;

    const hasSlottedAllMenu = this.el.querySelector('[slot="all-menu"]');

    return (
      <button
        class="bar-all-menu-button"
        part="all-menu-button"
        onClick={this.toggleAllMenu}
        aria-expanded={String(this.allMenuOpen)}
        aria-haspopup="true"
      >
        {hasSlottedAllMenu ? <slot name="all-menu" /> : <le-icon name="hamburger" />}
      </button>
    );
  }

  private renderPopoverContent(itemsToShow: { id: string; item: HTMLElement }[]) {
    return (
      <div class="bar-popover-content" part="popover-content">
        {itemsToShow.map(({ id, item }) => (
          <div
            class="bar-popover-item"
            key={id}
            onClick={(e: MouseEvent) => this.handleItemClick(e, id)}
            innerHTML={item.outerHTML}
          />
        ))}
      </div>
    );
  }

  private renderOverflowPopover() {
    if (this.overflow !== 'more' && this.overflow !== 'hamburger') return null;

    const items = this.getSlottedItems();
    let itemsToShow: { id: string; item: HTMLElement }[] = [];

    if (this.overflow === 'hamburger' && this.hamburgerActive) {
      // Show all items in hamburger mode
      itemsToShow = items.map((item, index) => ({
        id: this.getItemId(item, index),
        item,
      }));
    } else if (this.overflow === 'more' && (this.overflowingIds?.size ?? 0) > 0) {
      // Show only overflowing items
      itemsToShow = items
        .map((item, index) => ({
          id: this.getItemId(item, index),
          item,
        }))
        .filter(({ id }) => this.overflowingIds?.has(id));
    }

    if (itemsToShow.length === 0) return null;

    return (
      <le-popover
        mode="default"
        open={this.popoverOpen}
        position="bottom"
        align="end"
        showClose={false}
        closeOnClickOutside={true}
        closeOnEscape={true}
        onLePopoverClose={this.closePopover}
      >
        <div slot="trigger" class="bar-overflow-trigger">
          {this.overflow === 'hamburger' ? this.renderHamburgerButton() : this.renderMoreButton()}
        </div>
        {this.renderPopoverContent(itemsToShow)}
      </le-popover>
    );
  }

  private renderAllMenuPopover() {
    if (!this.showAllMenu) return null;

    const items = this.getSlottedItems();
    const itemsToShow = items.map((item, index) => ({
      id: this.getItemId(item, index),
      item,
    }));

    const position = this.showAllMenu === 'start' ? 'start' : 'end';

    return (
      <le-popover
        mode="default"
        open={this.allMenuOpen}
        position="bottom"
        align={position}
        showClose={false}
        closeOnClickOutside={true}
        closeOnEscape={true}
        onLePopoverClose={this.closeAllMenu}
      >
        <div slot="trigger" class="bar-all-menu-trigger">
          {this.renderAllMenuButton()}
        </div>
        {this.renderPopoverContent(itemsToShow)}
      </le-popover>
    );
  }

  render() {
    const showOverflowButton =
      !this.disablePopover &&
      ((this.overflow === 'more' && (this.overflowingIds?.size ?? 0) > 0) ||
        (this.overflow === 'hamburger' && this.hamburgerActive));

    const containerStyle: { [key: string]: string } = {};
    if (
      this.containerHeight !== null &&
      (this.overflow === 'more' || this.overflow === 'hamburger')
    ) {
      containerStyle.height = `${this.containerHeight}px`;
    }

    const showAllMenuAtStart = this.showAllMenu === 'start';
    const showAllMenuAtEnd = this.showAllMenu === true || this.showAllMenu === 'end';

    return (
      <Host
        class={classnames({
          'overflow-more': this.overflow === 'more',
          'overflow-scroll': this.overflow === 'scroll',
          'overflow-hamburger': this.overflow === 'hamburger',
          'overflow-wrap': this.overflow === 'wrap',
          'hamburger-active': this.hamburgerActive,
          'has-overflow': (this.overflowingIds?.size ?? 0) > 0 || this.hamburgerActive,
        })}
      >
        <div
          class={classnames('bar-container', {
            [`align-${this.alignItems}`]: true,
          })}
          part="container"
        >
          {/* Start controls */}
          {this.overflow === 'scroll' && this.arrows && (
            <div class="bar-controls bar-controls-start">{this.renderScrollArrows()?.[0]}</div>
          )}

          {showAllMenuAtStart && (
            <div class="bar-controls bar-controls-start">{this.renderAllMenuPopover()}</div>
          )}

          {/* Items container */}
          <div
            class={classnames('bar-items', {
              'is-scrollable': this.overflow === 'scroll',
              'is-wrapping': this.overflow === 'wrap',
            })}
            style={containerStyle}
            ref={el => {
              this.itemsContainerEl = el;
              this.observeContainer(el);
            }}
            onScroll={this.overflow === 'scroll' ? this.handleScroll : undefined}
          >
            <slot />
          </div>

          {/* End controls */}
          {showOverflowButton && (
            <div class="bar-controls bar-controls-end">{this.renderOverflowPopover()}</div>
          )}

          {showAllMenuAtEnd && (
            <div class="bar-controls bar-controls-end">{this.renderAllMenuPopover()}</div>
          )}

          {this.overflow === 'scroll' && this.arrows && (
            <div class="bar-controls bar-controls-end">{this.renderScrollArrows()?.[1]}</div>
          )}
        </div>
      </Host>
    );
  }
}

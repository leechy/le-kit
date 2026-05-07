import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Watch,
  Listen,
  Method,
  h,
  Host,
} from '@stencil/core';
import { classnames, generateId } from '../../utils/utils';
import { LeOverflowMenuItemSelectDetail } from '../le-overflow-menu/le-overflow-menu';
import type { LeOption } from '../../types/options';

export interface LeToolbarOverflowChangeDetail {
  /** IDs of items currently in the overflow menu. */
  overflowIds: string[];
  /** IDs of collapsible groups currently in their compact state. */
  collapsedGroupIds: string[];
}

export interface SolverOutput {
  /** IDs of participants that should be fully visible. */
  visibleIds: Set<string>;

  /**
   * IDs of collapsible participants that should be in their collapsed
   * (compact) state. These are still visible – just narrower.
   */
  collapsedGroupIds: Set<string>;

  /** IDs of participants that should go into the overflow menu. */
  overflowIds: Set<string>;

  /** Whether the overflow trigger button should be shown. */
  showTrigger: boolean;
}

/**
 * A priority-aware, overflow-safe toolbar component.
 *
 * Items are slotted light-DOM children. Each item may carry a
 * `priority` attribute (lower = more important). When there
 * isn't enough space, lower-priority items move to an overflow menu.
 *
 * Collapsible `le-button-group` children are asked to reduce their own
 * footprint first before their contents are overflowed entirely.
 *
 * @slot - Toolbar items
 * @slot overflow-trigger - Custom content for the overflow trigger button
 *
 * @csspart container - The main flex row
 * @csspart overflow-trigger - The "more" button wrapper
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-toolbar',
  styleUrl: 'le-toolbar.css',
  shadow: true,
})
export class LeToolbar {
  @Element() el!: HTMLElement;

  /**
   * Optional declarative items input.
   *
   * The current implementation is slot-driven, but when this prop changes we
   * still invalidate the slotted-items cache and recompute layout.
   */
  @Prop() items?: unknown;

  /**
   * Alignment of items along the main axis.
   */
  @Prop({ reflect: true }) alignItems: 'start' | 'center' | 'end' | 'stretch' = 'start';

  /**
   * Icon for the overflow trigger button when no custom slot content is provided.
   */
  @Prop() overflowIcon: string = 'ellipsis-horizontal';

  /**
   * Accessible label for the overflow trigger button.
   */
  @Prop() overflowLabel: string = 'More';

  /**
   * Disable the built-in overflow popover.
   * The toolbar will still compute overflow state and emit events, but
   * won't render its own menu. Useful for custom overflow handling.
   */
  @Prop() disablePopover: boolean = false;

  /**
   * Hysteresis epsilon in pixels. A visibility state flip only happens when
   * the available/required width delta exceeds this value, preventing flicker
   * from sub-pixel resize events.
   */
  @Prop() epsilon: number = 2;

  /**
   * Emitted when the overflow state changes.
   */
  @Event() leToolbarOverflowChange?: EventEmitter<LeToolbarOverflowChangeDetail>;

  @State() private solverOutput: SolverOutput = {
    visibleIds: new Set<string>(),
    collapsedGroupIds: new Set<string>(),
    overflowIds: new Set<string>(),
    showTrigger: false,
  };

  @State() private overflowMenuItems: LeOption[] = [];

  private instanceId: string = generateId('le-toolbar');

  /** Toolbar host element (follows the width of the parent element). */
  private toolbarHostEl?: HTMLElement | null;

  /** Live toolbar items container. */
  private toolbarContainerEl?: HTMLElement | null;

  /** Hidden virtual toolbar container used for browser-native overflow checks. */
  private virtualToolbarEl?: HTMLElement;

  /** Virtual row where cloned participants are mounted for simulation. */
  private virtualItemsEl?: HTMLElement;

  /** Virtual trigger element that participates in layout when overflow exists. */
  private virtualTriggerEl?: HTMLElement;

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;

  private pendingRecalc: number | null = null;

  /** Prevent double-attach on rapid connect/disconnect cycles. */
  private observersAttached: boolean = false;

  /** Map from ID → original light-DOM element (for click forwarding). */
  private itemMap: Map<string, { element: HTMLElement; virtual: HTMLElement }> = new Map();

  private itemsByPriority: Array<{
    id: string;
    priority: number;
    width: number;
    hidden: boolean;
  }> = [];
  private hiddenItems: Set<string> = new Set();

  private disconnectModeObserver?: () => void;

  @Watch('alignItems')
  handlePropChange() {
    this.scheduleRecalc();
  }

  @Watch('items')
  handleItemsChange() {
    // update virtual toolbar structure when items are changed
    this.prepareToolbarItems();
  }

  @Listen('slotchange')
  handleSlotChange() {
    // update virtual toolbar structure when items are changed
    this.prepareToolbarItems();
  }

  connectedCallback() {
    this.attachObservers();
  }

  componentDidLoad() {
    // create virtual toolbar structure for layout calculations
    this.prepareToolbarItems();
  }

  disconnectedCallback() {
    this.detachObservers();
    this.disconnectModeObserver?.();
    if (this.pendingRecalc !== null) {
      cancelAnimationFrame(this.pendingRecalc);
      this.pendingRecalc = null;
    }
  }

  /**
   * Force a layout recalculation.
   */
  @Method()
  async recalculate() {
    this.computeLayout();
  }

  // ─── Observers ──────────────────────────────────────────────────────────────

  private attachObservers() {
    if (this.observersAttached) return;
    this.observersAttached = true;

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleRecalc();
      });
    }

    this.mutationObserver = new MutationObserver(mutations => {
      // Only invalidate cached slotted children when structure changes.
      if (mutations.some(m => m.type === 'childList')) {
        // update virtual toolbar structure when items are changed
        this.prepareToolbarItems();
      }
      this.scheduleRecalc();
    });

    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ['priority', 'data-le-pinned', 'data-le-separator', 'disabled'],
    });
  }

  private detachObservers() {
    this.observersAttached = false;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  private observeContainer(el?: HTMLElement | null) {
    if (!this.resizeObserver || !el) return;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (el) {
      this.resizeObserver.observe(el);
    }
  }

  // ─── Scheduling ─────────────────────────────────────────────────────────────

  private scheduleRecalc() {
    if (this.pendingRecalc !== null) {
      cancelAnimationFrame(this.pendingRecalc);
    }
    this.pendingRecalc = requestAnimationFrame(() => {
      this.pendingRecalc = null;
      this.computeLayout();
    });
  }

  private getItemId(el: HTMLElement, index: number): string {
    const existing = el.dataset.leToolbarId;
    if (existing) return existing;
    const id = el.id || `${this.instanceId}-item-${index}`;
    el.dataset.leToolbarId = id;
    return id;
  }

  private getItemPriority(el: HTMLElement, index: number): number {
    const raw = el.dataset.lePriority ?? el.getAttribute('priority');
    if (raw === null || raw === undefined || raw.trim() === '') return 1000 + index;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 1000 + index;
  }

  private setVirtualTriggerVisible(visible: boolean) {
    if (!this.virtualTriggerEl) return;
    this.virtualTriggerEl.style.display = visible ? 'inline-flex' : 'none';
  }

  private syncVirtualTriggerContent() {
    if (!this.virtualTriggerEl) return;

    this.virtualTriggerEl.replaceChildren();

    const slottedTriggerNodes = Array.from(this.el.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.getAttribute('slot') === 'overflow-trigger',
    );

    if (slottedTriggerNodes.length > 0) {
      for (const node of slottedTriggerNodes) {
        this.virtualTriggerEl.appendChild(node.cloneNode(true));
      }
      return;
    }

    const fallbackButton = document.createElement('button');
    fallbackButton.className = 'toolbar-more-button toolbar-more-button--phantom';
    fallbackButton.tabIndex = -1;

    const fallbackIcon = document.createElement('le-icon');
    fallbackIcon.setAttribute('name', this.overflowIcon);
    fallbackButton.appendChild(fallbackIcon);

    this.virtualTriggerEl.appendChild(fallbackButton);
  }

  private async prepareToolbarItems() {
    const items = Array.from(this.el.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('slot'),
    );

    // Revuild itemMap, trying to keep the id's stable for existing elements
    // to preserve overflow state when possible.
    this.itemMap.clear();

    this.itemsByPriority = [];

    const virtual = this.virtualItemsEl;
    if (!virtual) return;

    virtual.replaceChildren();
    this.syncVirtualTriggerContent();

    for (var i = 0; i < items.length; i++) {
      const clone = items[i].cloneNode(true) as any;
      const id = this.getItemId(items[i], i);
      clone.removeAttribute('id');
      clone.setAttribute('visibility', 'visible');
      clone.setAttribute('disabled', 'true');
      clone.removeAttribute('collapse');
      virtual.appendChild(clone);

      // wait until the cloned item is rendered in the virtual toolbar before continuing
      if (clone.componentOnReady) await clone.componentOnReady();
      // wait for the virtual toolbar to render with the new items before measuring
      await this.nextResize(virtual);

      // add the item to the priority list
      const priority = this.getItemPriority(items[i], i);
      this.itemsByPriority.push({ id, priority, width: 0, hidden: false });

      // create new item
      const newItem = {
        element: items[i],
        virtual: clone,
      };
      this.itemMap.set(id, newItem);
    }

    // sort the items by priority (highest first) to use when collapsing items
    this.itemsByPriority.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return 0;
    });

    await this.calculateLayoutWidths();
    this.scheduleRecalc();
  }

  /**
   * Helper that returns a promise resolving on the next resize of the given element.
   */
  private nextResize(element: HTMLElement): Promise<ResizeObserverEntry> {
    return new Promise(resolve => {
      const observer = new ResizeObserver(([entry]) => {
        console.log('[le-toolbar] Resize observed: ', entry);
        observer.disconnect(); // Remove observer after the first resize to avoid multiple triggers.
        resolve(entry);
      });
      observer.observe(element);
    });
  }

  // ─── Virtual Solver + State Sync ───────────────────────────────────────────

  private async calculateLayoutWidths() {
    const virtual = this.virtualToolbarEl;
    if (!virtual) return;

    let virtualToolbarWidth = virtual.getBoundingClientRect().width;

    // saving the full width of the toolbar before any collapsing happens,
    // and without the trigger, to use as a reference when expanding items back
    if (this.hiddenItems.size === 0 && this.itemsByPriority.length > 0) {
      this.itemsByPriority[this.itemsByPriority.length - 1].width = virtualToolbarWidth;
    }

    // show the trigger first if it's not already, to include it in the width calculations
    this.setVirtualTriggerVisible(true);
    await this.nextResize(virtual);
    virtualToolbarWidth = virtual.getBoundingClientRect().width;

    // iterate through the items by priority,
    // and save the width of the toolbar when each item is hidden,
    // to know when to expand items again when the host grows back
    for (var i = this.itemsByPriority.length - 1; i >= 0; i--) {
      const priorityItem = this.itemsByPriority[i];

      // set visibility to collapsed in the virtual toolbar
      const item = this.itemMap.get(priorityItem.id);
      if (item?.virtual) {
        item.virtual.setAttribute('visibility', 'collapsed');
      }

      await this.nextResize(virtual);
      virtualToolbarWidth = virtual.getBoundingClientRect().width;

      // save this width to the itemsByPriority list,
      // to know when to expand items again when the host grows back
      if (this.itemsByPriority[i - 1] && this.itemsByPriority[i - 1].width === 0) {
        this.itemsByPriority[i - 1].width = virtualToolbarWidth;
      }
    }

    console.log('[le-toolbar] Initial layout widths: ', this.itemsByPriority);
  }

  private async computeLayout() {
    const host = this.toolbarHostEl;
    const container = this.toolbarContainerEl;
    if (!host || !container) return;

    const newHostWidth = host.getBoundingClientRect().width;

    // data for the solver:
    const visibleIds = new Set<string>();
    const overflowIds = new Set<string>();

    // look at the `itemsByPriority` list, which items should be hidden at which widths
    // and show or hide the items in the container accordingly
    this.itemsByPriority.forEach(priorityItem => {
      if (newHostWidth < priorityItem.width) {
        overflowIds.add(priorityItem.id);
        this.hiddenItems.add(priorityItem.id);
        if (priorityItem.hidden) return;

        const item = this.itemMap.get(priorityItem.id);
        if (item?.element) {
          item.element.setAttribute('visibility', 'collapsed');
        }
        priorityItem.hidden = true;
      } else if (newHostWidth >= priorityItem.width) {
        visibleIds.add(priorityItem.id);
        this.hiddenItems.delete(priorityItem.id);
        if (!priorityItem.hidden) return;

        const item = this.itemMap.get(priorityItem.id);
        if (item?.element) {
          item.element.setAttribute('visibility', 'visible');
        }
        priorityItem.hidden = false;
      }
    });

    // show the trigger if there are any hidden items, to make sure the overflow menu is accessible
    this.setVirtualTriggerVisible(this.hiddenItems.size > 0);
    this.applyOutput(
      {
        visibleIds,
        collapsedGroupIds: new Set<string>(),
        overflowIds,
        showTrigger: this.hiddenItems.size > 0,
      } as SolverOutput,
      // filter the overflow items
      Array.from(this.itemMap.entries())
        .filter(([id]) => overflowIds.has(id))
        .map(([_id, { element }]) => element),
    );
  }

  private applyOutput(output: SolverOutput, items: HTMLElement[]) {
    // Build overflow menu options.
    const overflowItems: LeOption[] = items
      .filter((item, index) => output.overflowIds.has(this.getItemId(item, index)))
      .map((item, _i) => {
        const index = items.indexOf(item);
        const id = this.getItemId(item, index);
        const label =
          item.getAttribute('label') ||
          item.textContent?.trim() ||
          item.getAttribute('aria-label') ||
          id;

        return {
          id,
          label,
          value: id,
          disabled: item.hasAttribute('disabled'),
          href: item.getAttribute('href') ?? undefined,
          target: item.getAttribute('target') ?? undefined,
        } satisfies LeOption;
      });

    const prevOverflowKey = this.overflowMenuItems.map(i => i.id).join('|');
    const nextOverflowKey = overflowItems.map(i => i.id).join('|');

    if (prevOverflowKey !== nextOverflowKey) {
      this.overflowMenuItems = overflowItems;
    }

    const prevOutput = this.solverOutput;
    const changed =
      !setsEqual(prevOutput.visibleIds, output.visibleIds) ||
      !setsEqual(prevOutput.collapsedGroupIds, output.collapsedGroupIds) ||
      !setsEqual(prevOutput.overflowIds, output.overflowIds) ||
      prevOutput.showTrigger !== output.showTrigger;

    if (changed) {
      this.solverOutput = output;
      this.leToolbarOverflowChange?.emit({
        overflowIds: [...output.overflowIds],
        collapsedGroupIds: [...output.collapsedGroupIds],
      });
    }
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────

  private handleOverflowSelect = (event: CustomEvent<LeOverflowMenuItemSelectDetail>) => {
    const { id } = event.detail;
    const original = this.itemMap.get(id);
    if (!original || original.element.hasAttribute('disabled')) return;

    const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    original.element.dispatchEvent(click);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  render() {
    const { showTrigger } = this.solverOutput;
    const showMenu = showTrigger && !this.disablePopover;

    return (
      <Host
        class={classnames({
          'has-overflow': showTrigger,
        })}
        ref={el => {
          this.toolbarHostEl = el;
          this.observeContainer(el);
        }}
      >
        {/* Live toolbar row */}
        <div
          class={classnames('toolbar-container', {
            [`align-${this.alignItems}`]: true,
          })}
          part="container"
          role="toolbar"
          ref={el => (this.toolbarContainerEl = el)}
        >
          <slot />

          {/* Overflow trigger – always rendered so we can measure its width;
              hidden via CSS when showTrigger is false */}
          {showMenu && (
            <div class="toolbar-overflow-trigger" part="overflow-trigger">
              <le-overflow-menu
                items={this.overflowMenuItems}
                position="bottom"
                align="end"
                icon={this.overflowIcon}
                triggerAriaLabel={this.overflowLabel}
                triggerPart="more-button"
                onLeOverflowMenuItemSelect={this.handleOverflowSelect}
              >
                <div slot="trigger" class="toolbar-more-button-wrap">
                  <slot name="more">
                    <button
                      class="toolbar-more-button"
                      aria-label={this.overflowLabel}
                      aria-haspopup="true"
                    >
                      <le-icon name={this.overflowIcon} />
                    </button>
                  </slot>
                </div>
              </le-overflow-menu>
            </div>
          )}
        </div>

        <fieldset
          disabled
          aria-hidden="true"
          class={classnames('toolbar-container', 'toolbar-virtual', {
            [`align-${this.alignItems}`]: true,
          })}
          ref={el => (this.virtualToolbarEl = el)}
        >
          <div class="toolbar-virtual-items" ref={el => (this.virtualItemsEl = el)} />
          <div
            class="toolbar-overflow-trigger toolbar-virtual-trigger"
            style={{ display: 'none' }}
            ref={el => (this.virtualTriggerEl = el)}
          />
        </fieldset>
      </Host>
    );
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

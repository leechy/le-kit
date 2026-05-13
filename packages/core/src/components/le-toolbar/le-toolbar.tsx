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
import { classnames, generateId, nextFrame, nextResize } from '../../utils/utils';
import { LeOverflowMenuItemSelectDetail } from '../le-overflow-menu/le-overflow-menu';
import type { LeOption } from '../../types/options';
import { LeButtonGroupItemsMeta } from '../le-button-group/le-button-group';

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

interface ToolbarItemRecord {
  element: HTMLElement;
  virtual: HTMLElement;
  index: number;
  priority: number;
  kind: 'item' | 'group' | 'spacer-flex' | 'spacer-fixed';
  overflowOption?: LeOption;
}

interface CollapseStep {
  id: string;
  itemId: string;
  priority: number;
  index: number;
  stage: number;
  action: 'hide-item' | 'group-collapse' | 'hide-group';
  collapseValue?: string;
  overflowOption?: LeOption;
  excludeFromOverflowMenu?: boolean;
  thresholdWidth: number;
  resultingWidth: number;
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
 * @slot more - Custom content for the overflow trigger button
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
   * Spacing between top-level toolbar items.
   * Accepts any valid CSS length (e.g. `8px`, `0.5rem`, `var(--le-spacing-2)`).
   */
  @Prop() itemGap: string = 'var(--le-toolbar-gap, var(--le-spacing-1, 4px))';

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

  @State() private initializingLayout: boolean = true;

  private hasPreparedInitialLayout: boolean = false;

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

  /** Map from ID → original light-DOM element plus virtual clone. */
  private itemMap: Map<string, ToolbarItemRecord> = new Map();

  private collapseSteps: CollapseStep[] = [];

  private disconnectModeObserver?: () => void;

  @Watch('alignItems')
  handleAlignChange() {
    void this.prepareToolbarItems();
  }

  @Watch('itemGap')
  handleGapChange(newValue: string) {
    if (!newValue || newValue.trim() === '') {
      // set default gap if input is empty or invalid
      this.itemGap = 'var(--le-toolbar-gap, var(--le-spacing-1, 4px))';
    }
    void this.prepareToolbarItems();
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
      subtree: true,
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

  private isToolbarSpacer(el: HTMLElement): boolean {
    return el.tagName.toLowerCase() === 'le-toolbar-spacer';
  }

  private getFixedSpacerWidthPx(el: HTMLElement): number | undefined {
    if (!this.isToolbarSpacer(el)) return undefined;

    const spacer = el as HTMLElement & { width?: unknown };
    const raw = spacer.getAttribute('width') ?? spacer.width;
    if (raw === null || raw === undefined || String(raw).trim() === '') return undefined;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;

    return parsed;
  }

  private async buildOverflowOption(item: HTMLElement, id: string): Promise<LeOption> {
    const optionLike = item as HTMLElement & {
      getOption?: () => Promise<LeOption>;
    };

    if (typeof optionLike.getOption === 'function') {
      try {
        const option = await optionLike.getOption();
        return {
          ...option,
          id: option.id || id,
          value: option.value ?? option.id ?? option.label,
          disabled: option.disabled ?? item.hasAttribute('disabled'),
        };
      } catch {
        // Fall back to lightweight extraction.
      }
    }

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
    };
  }

  private setVirtualTriggerVisible(visible: boolean) {
    if (!this.virtualTriggerEl) return;
    this.virtualTriggerEl.style.display = visible ? 'inline-flex' : 'none';
  }

  private clearVirtualMeasurements() {
    this.virtualItemsEl?.replaceChildren();
    this.virtualTriggerEl?.replaceChildren();
    this.setVirtualTriggerVisible(false);
  }

  private async settleVirtualItem(element?: HTMLElement) {
    const virtualLike = element as
      | (HTMLElement & {
          componentOnReady?: () => Promise<unknown>;
          whenLayoutSettled?: () => Promise<void>;
        })
      | undefined;

    if (!virtualLike) return;

    if (virtualLike.componentOnReady) {
      await virtualLike.componentOnReady();
    }

    if (typeof virtualLike.whenLayoutSettled === 'function') {
      await virtualLike.whenLayoutSettled();
      await this.waitForNestedCustomElements(virtualLike);
      return;
    }

    await this.waitForNestedCustomElements(virtualLike);
    await nextFrame();
  }

  private async waitForNestedCustomElements(root: HTMLElement) {
    const nested = Array.from(root.querySelectorAll('*')).filter(
      (el): el is HTMLElement & { componentOnReady?: () => Promise<unknown> } =>
        el instanceof HTMLElement && el.tagName.includes('-'),
    );

    await Promise.all(
      nested.map(async el => {
        if (typeof el.componentOnReady !== 'function') return;

        try {
          await el.componentOnReady();
        } catch {
          // Keep measurement resilient even if one nested component fails to resolve readiness.
        }
      }),
    );
  }

  private syncVirtualTriggerContent() {
    if (!this.virtualTriggerEl) return;

    this.virtualTriggerEl.replaceChildren();

    const slottedTriggerNodes = Array.from(this.el.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.getAttribute('slot') === 'more',
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
    this.collapseSteps = [];

    const virtual = this.virtualItemsEl;
    if (!virtual) return;

    virtual.replaceChildren();
    this.syncVirtualTriggerContent();

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const clone = item.cloneNode(true) as HTMLElement & {
        componentOnReady?: () => Promise<unknown>;
      };
      const id = this.getItemId(item, index);
      const priority = this.getItemPriority(item, index);

      clone.removeAttribute('id');
      clone.setAttribute('visibility', 'visible');
      clone.setAttribute('disabled', 'true');
      clone.removeAttribute('collapse');
      virtual.appendChild(clone);

      if (clone.componentOnReady) {
        await clone.componentOnReady();
        await nextResize(virtual);
      }

      if (clone.tagName.toLowerCase() === 'le-button-group') {
        await this.settleVirtualItem(clone);
      }

      const fixedSpacerWidth = this.getFixedSpacerWidthPx(item);
      const kind: ToolbarItemRecord['kind'] = this.isToolbarSpacer(item)
        ? fixedSpacerWidth !== undefined
          ? 'spacer-fixed'
          : 'spacer-flex'
        : item.tagName.toLowerCase() === 'le-button-group'
          ? 'group'
          : 'item';

      const overflowOption =
        kind === 'item' || kind === 'group' ? await this.buildOverflowOption(item, id) : undefined;

      const itemRecord: ToolbarItemRecord = {
        element: item,
        virtual: clone,
        index,
        priority,
        kind,
        overflowOption,
      };
      this.itemMap.set(id, itemRecord);

      if (itemRecord.kind === 'group') {
        const group = item as HTMLElement & {
          componentOnReady?: () => Promise<unknown>;
          getItemsMeta?: () => Promise<LeButtonGroupItemsMeta>;
          getToolbarOverflowGroupOption?: () => Promise<LeOption>;
        };

        if (group.componentOnReady) {
          await group.componentOnReady();
        }

        const meta =
          typeof group.getItemsMeta === 'function'
            ? await group.getItemsMeta()
            : { label: overflowOption?.label || id, items: [], visibleCounts: [] };

        meta.visibleCounts.forEach((visibleCount, stage) => {
          this.collapseSteps.push({
            id: `${id}::collapse-${visibleCount}`,
            itemId: id,
            priority,
            index,
            stage,
            action: 'group-collapse',
            collapseValue: String(visibleCount),
            thresholdWidth: 0,
            resultingWidth: 0,
          });
        });

        const groupOverflowOption =
          typeof group.getToolbarOverflowGroupOption === 'function'
            ? await group.getToolbarOverflowGroupOption()
            : {
                id,
                label: meta.label,
                value: id,
                children: meta.items,
              };

        this.collapseSteps.push({
          id: `${id}::collapse-hide`,
          itemId: id,
          priority,
          index,
          stage: meta.visibleCounts.length,
          action: 'hide-group',
          collapseValue: 'collapse',
          overflowOption: groupOverflowOption,
          thresholdWidth: 0,
          resultingWidth: 0,
        });
      } else {
        if (itemRecord.kind === 'item') {
          this.collapseSteps.push({
            id: `${id}::hide`,
            itemId: id,
            priority,
            index,
            stage: 0,
            action: 'hide-item',
            overflowOption,
            thresholdWidth: 0,
            resultingWidth: 0,
          });
        } else if (itemRecord.kind === 'spacer-fixed') {
          this.collapseSteps.push({
            id: `${id}::hide`,
            itemId: id,
            priority,
            index,
            stage: 0,
            action: 'hide-item',
            excludeFromOverflowMenu: true,
            thresholdWidth: 0,
            resultingWidth: 0,
          });
        }
      }
    }

    this.collapseSteps.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.index !== b.index) return b.index - a.index;
      return a.stage - b.stage;
    });

    await this.calculateLayoutWidths();
    this.hasPreparedInitialLayout = true;
    this.scheduleRecalc();
  }

  // ─── Virtual Solver + State Sync ───────────────────────────────────────────

  private async calculateLayoutWidths() {
    const virtual = this.virtualToolbarEl;
    if (!virtual || this.collapseSteps.length === 0) {
      this.clearVirtualMeasurements();
      return;
    }

    this.setVirtualTriggerVisible(false);

    for (const item of this.itemMap.values()) {
      item.virtual.setAttribute('visibility', 'visible');
      item.virtual.removeAttribute('collapse');
    }

    for (const item of this.itemMap.values()) {
      if (item.kind === 'group') {
        await this.settleVirtualItem(item.virtual);
      }
    }

    await nextFrame();

    let currentWidth = virtual.getBoundingClientRect().width;
    let virtualTriggerVisible = false;

    for (let index = 0; index < this.collapseSteps.length; index += 1) {
      const step = this.collapseSteps[index];
      step.thresholdWidth = currentWidth;

      if (step.action === 'hide-item') {
        this.itemMap.get(step.itemId)?.virtual.setAttribute('visibility', 'collapsed');
      } else if (step.action === 'group-collapse' || step.action === 'hide-group') {
        this.itemMap.get(step.itemId)?.virtual.setAttribute('collapse', step.collapseValue || '');
      }

      const addsOverflowEntry =
        (step.action === 'hide-item' || step.action === 'hide-group') &&
        !step.excludeFromOverflowMenu;

      if (!virtualTriggerVisible && addsOverflowEntry) {
        this.setVirtualTriggerVisible(true);
        virtualTriggerVisible = true;
      }

      const record = this.itemMap.get(step.itemId);

      if (record?.kind === 'group') {
        await this.settleVirtualItem(record.virtual);
        await nextFrame();
      } else {
        await nextResize(virtual);
        await nextFrame();
      }

      currentWidth = virtual.getBoundingClientRect().width;
      step.resultingWidth = currentWidth;
    }

    this.clearVirtualMeasurements();
  }

  private async computeLayout() {
    const host = this.toolbarHostEl;
    const container = this.toolbarContainerEl;
    if (!host || !container) return;

    // Ignore early observer-driven recalcs until the virtual measurement pass
    // has produced collapse thresholds.
    if (this.initializingLayout && !this.hasPreparedInitialLayout) {
      return;
    }

    const newHostWidth = host.getBoundingClientRect().width;

    const visibleIds = new Set<string>(this.itemMap.keys());
    const hiddenIds = new Set<string>();
    const overflowIds = new Set<string>();
    const collapsedGroupIds = new Set<string>();
    const groupCollapseValues = new Map<string, string>();
    const hiddenGroupIds = new Set<string>();
    const overflowOptionMap = new Map<string, LeOption>();

    for (const step of this.collapseSteps) {
      if (newHostWidth >= step.thresholdWidth) {
        break;
      }

      const item = this.itemMap.get(step.itemId);
      if (!item) {
        continue;
      }

      if (step.action === 'hide-item') {
        item.element.setAttribute('visibility', 'collapsed');
        visibleIds.delete(step.itemId);
        hiddenIds.add(step.itemId);
        if (!step.excludeFromOverflowMenu) {
          overflowIds.add(step.itemId);
        }
        if (!step.excludeFromOverflowMenu && step.overflowOption) {
          overflowOptionMap.set(step.itemId, step.overflowOption);
        }
      } else if (step.action === 'group-collapse') {
        item.element.setAttribute('collapse', step.collapseValue || '1');
        collapsedGroupIds.add(step.itemId);
        groupCollapseValues.set(step.itemId, step.collapseValue || '1');
      } else if (step.action === 'hide-group') {
        item.element.setAttribute('collapse', 'collapse');
        visibleIds.delete(step.itemId);
        hiddenIds.add(step.itemId);
        overflowIds.add(step.itemId);
        hiddenGroupIds.add(step.itemId);
        collapsedGroupIds.delete(step.itemId);
        groupCollapseValues.delete(step.itemId);
        if (step.overflowOption) {
          overflowOptionMap.set(step.itemId, step.overflowOption);
        }
      }
    }

    for (const [id, item] of this.itemMap.entries()) {
      const desiredVisibility = hiddenIds.has(id) ? 'collapsed' : 'visible';
      if (item.element.getAttribute('visibility') !== desiredVisibility) {
        item.element.setAttribute('visibility', desiredVisibility);
      }

      const desiredCollapse = hiddenGroupIds.has(id)
        ? 'collapse'
        : (groupCollapseValues.get(id) ?? undefined);
      const currentCollapse = item.element.getAttribute('collapse') ?? undefined;

      if (desiredCollapse) {
        if (currentCollapse !== desiredCollapse) {
          item.element.setAttribute('collapse', desiredCollapse);
        }
      } else if (currentCollapse !== undefined) {
        item.element.removeAttribute('collapse');
      }
    }

    void groupCollapseValues;

    const overflowMenuItems = Array.from(overflowOptionMap.entries())
      .sort(([leftId], [rightId]) => {
        return (this.itemMap.get(leftId)?.index ?? 0) - (this.itemMap.get(rightId)?.index ?? 0);
      })
      .map(([, option]) => option);

    this.setVirtualTriggerVisible(overflowMenuItems.length > 0);
    this.applyOutput(
      {
        visibleIds,
        collapsedGroupIds,
        overflowIds,
        showTrigger: overflowMenuItems.length > 0,
      },
      overflowMenuItems,
    );

    if (this.initializingLayout) {
      this.initializingLayout = false;
    }
  }

  private applyOutput(output: SolverOutput, overflowItems: LeOption[]) {
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
    const hostStyle = {
      '--le-toolbar-item-gap': this.itemGap,
      '--le-toolbar-item-inner-margin': `calc(${this.itemGap} / 2)`,
    } as { [key: string]: string };

    return (
      <Host
        class={classnames({
          'has-overflow': showTrigger,
          'is-initializing-layout': this.initializingLayout,
        })}
        style={hostStyle}
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

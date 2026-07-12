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
import type { LeCollapseMeta } from '../../types/toolbar';

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
  virtual?: HTMLElement;
  virtualWrapper?: HTMLElement;
  index: number;
  priority: number;
  kind: 'item' | 'item-stepping' | 'group' | 'spacer-flex' | 'spacer-fixed';
  overflowOption?: LeOption;
  slotName: string;
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
   * Temporary debug mode: render the virtual toolbar visibly above
   * the live toolbar so collapse measurements can be inspected.
   */
  @Prop({ reflect: true }) debugVirtualToolbar: boolean = false;

  /**
   * Temporary debug mode: stop before measuring virtual widths so the
   * virtual DOM can be inspected before collapse simulation mutates it.
   */
  @Prop({ reflect: true }) debugPauseBeforeMeasure: boolean = false;

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

  @State() private itemSlots: Array<{ id: string; slotName: string }> = [];

  @State() private initializingLayout: boolean = true;

  @State() private debugStepIndex: number = 0;

  @State() private debugStepMeasuredWidth: number = 0;

  @State() private virtualTriggerVisible: boolean = false;

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

  private debugVirtualWidth: number = 0;

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
   * Reset the toolbar's internal layout state and recalculate item visibility from scratch.
   */
  @Method()
  async resetToolbar() {
    this.clearVirtualMeasurements();
    this.prepareToolbarItems();
  }

  /**
   * Force a layout recalculation.
   */
  @Method()
  async recalculate() {
    this.computeLayout();
  }

  /**
   * Open the toolbar's overflow menu.
   */
  @Method()
  async showOverflowMenu() {
    const menu = this.el.shadowRoot?.querySelector('le-overflow-menu') as any;
    if (menu) {
      await menu.show();
    }
  }

  /**
   * Close the toolbar's overflow menu.
   */
  @Method()
  async hideOverflowMenu() {
    const menu = this.el.shadowRoot?.querySelector('le-overflow-menu') as any;
    if (menu) {
      await menu.hide();
    }
  }

  /**
   * Simulate a keyboard navigation key on the overflow menu.
   */
  @Method()
  async navigateOverflowMenu(key: 'ArrowDown' | 'ArrowUp' | 'Enter') {
    const menu = this.el.shadowRoot?.querySelector('le-overflow-menu') as any;
    if (menu) {
      await menu.navigate(key);
    }
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
    this.virtualTriggerVisible = visible;
  }

  private getAuthoredVirtualCollapse(record: ToolbarItemRecord): string | undefined {
    if (record.element.tagName.toLowerCase() !== 'le-button-group') {
      return undefined;
    }

    // Authored-collapsed groups are represented as 'item' kind.
    if (record.kind !== 'item') {
      return undefined;
    }

    const collapse = record.element.getAttribute('collapse');
    return collapse === null ? undefined : collapse;
  }

  private resetVirtualState() {
    this.setVirtualTriggerVisible(false);

    for (const item of this.itemMap.values()) {
      item.virtual?.setAttribute('visibility', 'visible');
      const authoredCollapse = this.getAuthoredVirtualCollapse(item);
      if (authoredCollapse !== undefined) {
        item.virtual?.setAttribute('collapse', authoredCollapse);
      } else {
        item.virtual?.removeAttribute('collapse');
      }
      item.virtualWrapper?.classList.remove('is-collapsed');
    }
  }

  private async initializeDebugMeasurementState() {
    this.resetVirtualState();

    for (const item of this.itemMap.values()) {
      if (item.kind === 'group' && item.virtual) {
        await this.settleVirtualItem(item.virtual);
      }
    }

    await nextFrame();

    const width = this.virtualToolbarEl?.getBoundingClientRect().width ?? 0;
    this.debugVirtualWidth = width;
    this.debugStepMeasuredWidth = width;
    this.debugStepIndex = 0;
  }

  @Method()
  async runDebugMeasurementStep() {
    const virtual = this.virtualToolbarEl;
    if (!virtual) return;

    if (this.debugStepIndex >= this.collapseSteps.length) {
      return;
    }

    const step = this.collapseSteps[this.debugStepIndex];
    step.thresholdWidth = this.debugVirtualWidth;

    if (step.action === 'hide-item') {
      const record = this.itemMap.get(step.itemId);
      record?.virtual?.setAttribute('visibility', 'collapsed');
      record?.virtualWrapper?.classList.add('is-collapsed');
    } else if (step.action === 'group-collapse' || step.action === 'hide-group') {
      const record = this.itemMap.get(step.itemId);
      record?.virtual?.setAttribute('collapse', step.collapseValue || '');
      if (step.action === 'hide-group') {
        record?.virtualWrapper?.classList.add('is-collapsed');
      }
    }

    const addsOverflowEntry =
      (step.action === 'hide-item' || step.action === 'hide-group') &&
      !step.excludeFromOverflowMenu;

    if (addsOverflowEntry) {
      this.setVirtualTriggerVisible(true);
    }

    const record = this.itemMap.get(step.itemId);
    if (record?.kind === 'group' && record.virtual) {
      await this.settleVirtualItem(record.virtual);
      await nextFrame();
    } else {
      await nextResize(virtual);
      await nextFrame();
    }

    this.debugVirtualWidth = virtual.getBoundingClientRect().width;
    this.debugStepMeasuredWidth = this.debugVirtualWidth;
    step.resultingWidth = this.debugVirtualWidth;
    this.debugStepIndex += 1;
  }

  private handleVirtualDebugClick = (event: MouseEvent) => {
    if (!this.debugPauseBeforeMeasure) return;
    event.preventDefault();
    void this.runDebugMeasurementStep();
  };

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
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        ((el.getAttribute('slot') ?? '').startsWith('__le-toolbar-item-') ||
          !el.hasAttribute('slot') ||
          el.getAttribute('slot') === ''),
    );

    // Rebuild itemMap, trying to keep the id's stable for existing elements
    // to preserve overflow state when possible.
    this.itemMap.clear();
    this.collapseSteps = [];

    const virtual = this.virtualItemsEl;
    if (!virtual) return;

    virtual.replaceChildren();
    this.syncVirtualTriggerContent();

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const toolbarParticipant = item as HTMLElement & {
        componentOnReady?: () => Promise<unknown>;
        getCollapseMeta?: () => Promise<LeCollapseMeta>;
      };
      const clone = item.cloneNode(true) as HTMLElement & {
        componentOnReady?: () => Promise<unknown>;
      };
      const virtualWrapper = document.createElement('div');
      virtualWrapper.className = 'toolbar-virtual-item-wrap';
      const id = this.getItemId(item, index);
      const slotName = `__le-toolbar-item-${index}`;
      const priority = this.getItemPriority(item, index);

      if (item.getAttribute('slot') !== slotName) {
        item.setAttribute('slot', slotName);
      }

      // Universal collapse meta detection
      let collapseMeta: LeCollapseMeta = { kind: 'item' };
      if (typeof toolbarParticipant.componentOnReady === 'function') {
        try {
          await toolbarParticipant.componentOnReady();
        } catch {}
      }

      if (typeof toolbarParticipant.getCollapseMeta === 'function') {
        try {
          collapseMeta = await toolbarParticipant.getCollapseMeta();
        } catch {}
      }

      let kind: ToolbarItemRecord['kind'];
      if (collapseMeta.kind === 'spacer') {
        const isFixedSpacer = collapseMeta.fixed ?? collapseMeta.minWidth !== undefined;
        kind = isFixedSpacer ? 'spacer-fixed' : 'spacer-flex';
      } else if (collapseMeta.kind === 'stepping') {
        kind = item.tagName.toLowerCase() === 'le-button-group' ? 'group' : 'item-stepping';
      } else {
        kind = 'item';
      }

      let virtualNode: HTMLElement | undefined;
      let virtualWrapperNode: HTMLElement | undefined;

      // Flexible spacers should not influence virtual width simulation.
      if (kind !== 'spacer-flex') {
        clone.removeAttribute('id');
        clone.removeAttribute('slot');
        clone.setAttribute('visibility', 'visible');
        clone.setAttribute('disabled', 'true');

        const shouldPreserveAuthoredCollapse =
          kind === 'item' &&
          item.tagName.toLowerCase() === 'le-button-group' &&
          item.hasAttribute('collapse');

        if (shouldPreserveAuthoredCollapse) {
          const authoredCollapse = item.getAttribute('collapse');
          if (authoredCollapse !== null) {
            clone.setAttribute('collapse', authoredCollapse);
          }
        } else {
          clone.removeAttribute('collapse');
        }

        virtualWrapper.appendChild(clone);
        virtual.appendChild(virtualWrapper);

        if (clone.componentOnReady) {
          await clone.componentOnReady();
          await nextResize(virtual);
        }

        virtualNode = clone;
        virtualWrapperNode = virtualWrapper;
      }

      const overflowOption =
        kind === 'item' || kind === 'item-stepping' || kind === 'group'
          ? await this.buildOverflowOption(item, id)
          : undefined;

      const itemRecord: ToolbarItemRecord = {
        element: item,
        virtual: virtualNode,
        virtualWrapper: virtualWrapperNode,
        index,
        priority,
        kind,
        overflowOption,
        slotName,
      };
      this.itemMap.set(id, itemRecord);

      // Collapse step logic based on collapseMeta
      if (kind === 'group' && collapseMeta.kind === 'stepping' && collapseMeta.collapseValues) {
        const collapseStagePriority = priority + (collapseMeta.collapsePriorityOffset ?? 0);
        collapseMeta.collapseValues.forEach((collapseValue, stage) => {
          this.collapseSteps.push({
            id: `${id}::collapse-${collapseValue}`,
            itemId: id,
            priority: collapseStagePriority,
            index,
            stage,
            action: 'group-collapse',
            collapseValue,
            thresholdWidth: 0,
            resultingWidth: 0,
          });
        });

        // Overflow option for fully collapsed group
        const group = item as HTMLElement & {
          getToolbarOverflowGroupOption?: () => Promise<LeOption>;
        };
        const groupOverflowOption =
          typeof group.getToolbarOverflowGroupOption === 'function'
            ? await group.getToolbarOverflowGroupOption()
            : {
                id,
                label: overflowOption?.label || id,
                value: id,
                children: [],
              };

        this.collapseSteps.push({
          id: `${id}::collapse-hide`,
          itemId: id,
          priority,
          index,
          stage: collapseMeta.collapseValues.length,
          action: 'hide-group',
          collapseValue: 'collapse',
          overflowOption: groupOverflowOption,
          thresholdWidth: 0,
          resultingWidth: 0,
        });
      } else if (
        kind === 'item-stepping' &&
        collapseMeta.kind === 'stepping' &&
        collapseMeta.collapseValues
      ) {
        const collapseStagePriority = priority + (collapseMeta.collapsePriorityOffset ?? 0);
        collapseMeta.collapseValues.forEach((collapseValue, stage) => {
          this.collapseSteps.push({
            id: `${id}::collapse-${collapseValue}`,
            itemId: id,
            priority: collapseStagePriority,
            index,
            stage,
            action: 'group-collapse',
            collapseValue,
            thresholdWidth: 0,
            resultingWidth: 0,
          });
        });

        this.collapseSteps.push({
          id: `${id}::hide`,
          itemId: id,
          priority,
          index,
          stage: collapseMeta.collapseValues.length,
          action: 'hide-item',
          overflowOption,
          thresholdWidth: 0,
          resultingWidth: 0,
        });
      } else if (kind === 'item') {
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
      } else if (kind === 'spacer-fixed') {
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

    this.collapseSteps.sort((a, b) => {
      const aBucket = a.action === 'group-collapse' ? 0 : 1;
      const bBucket = b.action === 'group-collapse' ? 0 : 1;

      // First collapse participants (no overflow), then start hiding items.
      if (aBucket !== bBucket) return aBucket - bBucket;
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.index !== b.index) return b.index - a.index;
      return a.stage - b.stage;
    });

    const nextItemSlots = Array.from(this.itemMap.entries())
      .sort(([, left], [, right]) => left.index - right.index)
      .map(([id, record]) => ({ id, slotName: record.slotName }));

    const slotsChanged =
      nextItemSlots.length !== this.itemSlots.length ||
      nextItemSlots.some((slot, idx) => {
        const prev = this.itemSlots[idx];
        return !prev || prev.id !== slot.id || prev.slotName !== slot.slotName;
      });

    if (slotsChanged) {
      this.itemSlots = nextItemSlots;
    }

    if (this.debugPauseBeforeMeasure) {
      await this.initializeDebugMeasurementState();

      this.applyOutput(
        {
          visibleIds: new Set(this.itemMap.keys()),
          collapsedGroupIds: new Set<string>(),
          overflowIds: new Set<string>(),
          showTrigger: false,
        },
        [],
      );

      this.initializingLayout = false;
      this.hasPreparedInitialLayout = false;
      return;
    }

    await this.calculateLayoutWidths();
    this.hasPreparedInitialLayout = true;
    this.scheduleRecalc();
  }

  private getVisibilityState(value: string | null): 'visible' | 'collapsed' {
    return value === 'collapsed' || value === 'collapsing' ? 'collapsed' : 'visible';
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
      item.virtual?.setAttribute('visibility', 'visible');
      const authoredCollapse = this.getAuthoredVirtualCollapse(item);
      if (authoredCollapse !== undefined) {
        item.virtual?.setAttribute('collapse', authoredCollapse);
      } else {
        item.virtual?.removeAttribute('collapse');
      }
      item.virtualWrapper?.classList.remove('is-collapsed');
    }

    for (const item of this.itemMap.values()) {
      if (item.kind === 'group' && item.virtual) {
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
        const record = this.itemMap.get(step.itemId);
        record?.virtual?.setAttribute('visibility', 'collapsed');
        record?.virtualWrapper?.classList.add('is-collapsed');
      } else if (step.action === 'group-collapse' || step.action === 'hide-group') {
        const record = this.itemMap.get(step.itemId);
        record?.virtual?.setAttribute('collapse', step.collapseValue || '');
        if (step.action === 'hide-group') {
          record?.virtualWrapper?.classList.add('is-collapsed');
        }
      }

      const addsOverflowEntry =
        (step.action === 'hide-item' || step.action === 'hide-group') &&
        !step.excludeFromOverflowMenu;

      if (!virtualTriggerVisible && addsOverflowEntry) {
        this.setVirtualTriggerVisible(true);
        // Wait for the virtual trigger (including any slotted custom elements
        // like a custom "more" button) to fully settle before measuring widths.
        await this.settleVirtualItem(this.virtualTriggerEl);
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
    const steppingCollapseValues = new Map<string, string>();
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
        steppingCollapseValues.set(step.itemId, step.collapseValue || '1');
        if (item.kind === 'group') {
          collapsedGroupIds.add(step.itemId);
        }
      } else if (step.action === 'hide-group') {
        item.element.setAttribute('collapse', 'collapse');
        visibleIds.delete(step.itemId);
        hiddenIds.add(step.itemId);
        overflowIds.add(step.itemId);
        hiddenGroupIds.add(step.itemId);
        collapsedGroupIds.delete(step.itemId);
        steppingCollapseValues.delete(step.itemId);
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

      // Only manage runtime collapse for toolbar stepping participants.
      // For plain 'item' kind, authored collapse values must remain untouched.
      if (item.kind === 'group' || item.kind === 'item-stepping') {
        const desiredCollapse =
          item.kind === 'group' && hiddenGroupIds.has(id)
            ? 'collapse'
            : (steppingCollapseValues.get(id) ?? undefined);
        const currentCollapse = item.element.getAttribute('collapse') ?? undefined;

        if (desiredCollapse) {
          if (currentCollapse !== desiredCollapse) {
            item.element.setAttribute('collapse', desiredCollapse);
          }
        } else if (currentCollapse !== undefined) {
          item.element.removeAttribute('collapse');
        }
      }
    }

    void steppingCollapseValues;

    // Keep le-button-group entries grouped in overflow: parent label + child items
    const overflowMenuItems: LeOption[] = [];
    const sortedOverflowEntries = Array.from(overflowOptionMap.entries()).sort(
      ([leftId], [rightId]) => {
        return (this.itemMap.get(leftId)?.index ?? 0) - (this.itemMap.get(rightId)?.index ?? 0);
      },
    );

    for (const [itemId, option] of sortedOverflowEntries) {
      const record = this.itemMap.get(itemId);
      if (!record) {
        overflowMenuItems.push(option);
        continue;
      }

      // If this is a button-group going to overflow, keep it as a parent item.
      const isButtonGroup =
        record.element.tagName.toLowerCase() === 'le-button-group' &&
        typeof (record.element as any).getToolbarOverflowGroupOption === 'function';

      if (isButtonGroup) {
        try {
          const groupOption = await (record.element as any).getToolbarOverflowGroupOption();
          overflowMenuItems.push(groupOption);
        } catch {
          // Fallback: add the group option as-is
          overflowMenuItems.push(option);
        }
      } else {
        overflowMenuItems.push(option);
      }
    }

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

  private renderVirtualToolbar() {
    return (
      <fieldset
        disabled
        aria-hidden="true"
        data-debug-step-index={String(this.debugStepIndex)}
        data-debug-step-total={String(this.collapseSteps.length)}
        data-debug-width={String(Math.round(this.debugStepMeasuredWidth))}
        class={classnames('toolbar-container', 'toolbar-virtual', {
          [`align-${this.alignItems}`]: true,
          'toolbar-virtual-debug': this.debugVirtualToolbar,
          'toolbar-virtual-debug-paused': this.debugPauseBeforeMeasure,
        })}
        onClick={this.handleVirtualDebugClick}
        ref={el => (this.virtualToolbarEl = el)}
      >
        <div class="toolbar-virtual-items" ref={el => (this.virtualItemsEl = el)} />
        <div
          class={classnames('toolbar-overflow-trigger', 'toolbar-virtual-trigger', {
            'is-visible': this.virtualTriggerVisible,
          })}
          ref={el => (this.virtualTriggerEl = el)}
        />
      </fieldset>
    );
  }

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
        {this.debugVirtualToolbar && this.renderVirtualToolbar()}

        {/* Live toolbar row */}
        <div
          class={classnames('toolbar-container', {
            [`align-${this.alignItems}`]: true,
          })}
          part="container"
          role="toolbar"
          ref={el => (this.toolbarContainerEl = el)}
        >
          {this.itemSlots.map(slot => {
            const record = this.itemMap.get(slot.id);

            if (record?.kind === 'spacer-flex') {
              return (
                <div class="toolbar-item-flex-spacer">
                  <slot name={slot.slotName} />
                </div>
              );
            }

            const state = this.getVisibilityState(
              record?.element.getAttribute('visibility') ?? null,
            );
            return (
              <le-visibility
                class={{
                  'toolbar-item-visibility': true,
                  'is-collapsed': state === 'collapsed',
                }}
                state={state}
                mode="width"
              >
                <slot name={slot.slotName} />
              </le-visibility>
            );
          })}

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

        {!this.debugVirtualToolbar && this.renderVirtualToolbar()}
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

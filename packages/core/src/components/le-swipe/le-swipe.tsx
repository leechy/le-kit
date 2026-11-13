import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch } from '@stencil/core';

export interface LeSwipeAction {
  /** Action ID, returned in `leSwipeAction` */
  id: string;
  /** Button label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Semantic color ('primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info') or any CSS color */
  color?: string;
  /** Disabled buttons are shown but do nothing */
  disabled?: boolean;
  /** Runs when the content is pulled past the buttons. One per side, placed at the outer edge. */
  full?: boolean;
}

export type LeSwipeSide = 'start' | 'end';

export interface LeSwipeActionDetail {
  id: string;
  side: LeSwipeSide;
  /** Whether the action was triggered by a full swipe */
  full: boolean;
  originalEvent?: Event;
}

const MAX_ACTIONS_PER_SIDE = 3;
const SEMANTIC_COLORS = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
/** Wheel events stop arriving this long after the trackpad gesture (incl. momentum) ends */
const WHEEL_IDLE_MS = 140;
const SETTLE_MS = 220;

/** Only one swipe is open at a time, like in native lists */
let openSwipe: LeSwipe | undefined;

/**
 * Reveals action buttons behind its content when swiped horizontally — by touch or by
 * horizontal scrolling on a trackpad / Magic Mouse. Mouse dragging is left to the content
 * (e.g. selection).
 *
 * 'start' actions sit at the inline start (left in LTR) and are revealed by swiping towards
 * the end; 'end' actions the other way. A side without actions does not swipe. Pulling past
 * the buttons runs the side's `full` action.
 *
 * @slot - The swipeable content
 *
 * @cssprop --le-swipe-action-width - Width of one action button
 * @cssprop --le-swipe-duration - Settle animation duration
 */
@Component({
  tag: 'le-swipe',
  styleUrl: 'le-swipe.css',
  shadow: true,
})
export class LeSwipe {
  @Element() el!: HTMLElement;

  /** Actions revealed at the inline start (left in LTR) */
  @Prop() startActions: LeSwipeAction[] = [];

  /** Actions revealed at the inline end (right in LTR) */
  @Prop() endActions: LeSwipeAction[] = [];

  /** Width of one action button in pixels */
  @Prop() actionWidth: number = 72;

  /** Emitted when an action runs, by tapping its button or by a full swipe */
  @Event() leSwipeAction!: EventEmitter<LeSwipeActionDetail>;

  /** Emitted when the swipe opens on one side or closes */
  @Event() leSwipeChange!: EventEmitter<{ open?: LeSwipeSide }>;

  /** Logical offset: positive reveals start actions, negative reveals end actions */
  @State() private offset: number = 0;
  @State() private isSettling: boolean = false;
  @State() private openSide?: LeSwipeSide;

  private dirSign: number = 1;
  private gesture?: { pointerId: number; startX: number; startY: number; startOffset: number; dragging: boolean; lastX: number; lastTime: number; velocity: number };
  private wheelTimer?: number;
  private wheelLocked: boolean = false;
  private suppressClick: boolean = false;
  private settleTimer?: number;

  @Watch('startActions')
  @Watch('endActions')
  handleActionsChange() {
    this.warnAboutExtraActions();
  }

  componentWillLoad() {
    this.warnAboutExtraActions();
  }

  connectedCallback() {
    this.el.addEventListener('wheel', this.handleWheel, { passive: false });
    this.el.addEventListener('pointerdown', this.handlePointerDown);
    this.el.addEventListener('click', this.handleClickCapture, true);
  }

  disconnectedCallback() {
    this.el.removeEventListener('wheel', this.handleWheel);
    this.el.removeEventListener('pointerdown', this.handlePointerDown);
    this.el.removeEventListener('click', this.handleClickCapture, true);
    this.removeGestureListeners();
    document.removeEventListener('pointerdown', this.handleOutsidePointerDown, true);
    window.clearTimeout(this.wheelTimer);
    window.clearTimeout(this.settleTimer);
    if (openSwipe === this) openSwipe = undefined;
  }

  /** Opens the swipe on the given side, showing its buttons */
  @Method()
  async open(side: LeSwipeSide) {
    const actions = this.getActions(side);
    if (actions.length === 0) return;
    this.animateTo((side === 'start' ? 1 : -1) * this.getPanelWidth(side));
    this.setOpenSide(side);
  }

  /** Closes the swipe */
  @Method()
  async close() {
    this.animateTo(0);
    this.setOpenSide(undefined);
  }

  private warnAboutExtraActions() {
    for (const side of ['start', 'end'] as LeSwipeSide[]) {
      const all = side === 'start' ? this.startActions : this.endActions;
      if (all && all.length > MAX_ACTIONS_PER_SIDE) {
        console.warn(`[le-swipe] ${all.length} ${side} actions given; only ${MAX_ACTIONS_PER_SIDE} are shown (2 recommended).`);
      }
    }
  }

  /** Actions of a side, at most 3, with the full-swipe one first (outermost) */
  private getActions(side: LeSwipeSide): LeSwipeAction[] {
    const all = (side === 'start' ? this.startActions : this.endActions) || [];
    const limited = all.slice(0, MAX_ACTIONS_PER_SIDE);
    const fullIndex = limited.findIndex(a => a.full);
    if (fullIndex <= 0) return limited;
    return [limited[fullIndex], ...limited.filter((_, i) => i !== fullIndex)];
  }

  private getFullAction(side: LeSwipeSide): LeSwipeAction | undefined {
    const first = this.getActions(side)[0];
    return first?.full && !first.disabled ? first : undefined;
  }

  private getPanelWidth(side: LeSwipeSide): number {
    return this.getActions(side).length * this.actionWidth;
  }

  private getFullDistance(side: LeSwipeSide): number {
    const width = this.el.getBoundingClientRect().width;
    return Math.max(this.getPanelWidth(side) + 48, width * 0.6);
  }

  /** Limits the offset: no movement towards a side without actions, resistance past the buttons */
  private clampOffset(value: number): number {
    const side: LeSwipeSide = value > 0 ? 'start' : 'end';
    if (value === 0 || this.getActions(side).length === 0) return 0;
    const abs = Math.abs(value);
    // Without a full-swipe action the content stops at its buttons
    const limit = this.getFullAction(side)
      ? Math.max(this.el.getBoundingClientRect().width, this.getFullDistance(side) + 24)
      : this.getPanelWidth(side);
    return Math.sign(value) * (abs <= limit ? abs : limit + (abs - limit) * 0.2);
  }

  private readDirection() {
    this.dirSign = getComputedStyle(this.el).direction === 'rtl' ? -1 : 1;
  }

  /** Starting to swipe one item closes the one that is open */
  private closeOtherSwipe() {
    if (openSwipe && openSwipe !== this) void openSwipe.close();
  }

  private setOpenSide(side?: LeSwipeSide) {
    if (this.openSide === side) return;
    this.openSide = side;
    if (side) {
      this.closeOtherSwipe();
      openSwipe = this;
      document.addEventListener('pointerdown', this.handleOutsidePointerDown, true);
    } else {
      if (openSwipe === this) openSwipe = undefined;
      document.removeEventListener('pointerdown', this.handleOutsidePointerDown, true);
    }
    this.leSwipeChange.emit({ open: side });
  }

  private animateTo(offset: number, done?: () => void) {
    window.clearTimeout(this.settleTimer);
    this.isSettling = true;
    this.offset = offset;
    this.settleTimer = window.setTimeout(() => {
      this.isSettling = false;
      done?.();
    }, SETTLE_MS);
  }

  /** Decides where the content goes after a gesture ends */
  private settle(velocity: number = 0, originalEvent?: Event) {
    if (this.offset === 0) {
      this.setOpenSide(undefined);
      return;
    }
    const side: LeSwipeSide = this.offset > 0 ? 'start' : 'end';
    const sign = Math.sign(this.offset);
    const abs = Math.abs(this.offset);
    const panel = this.getPanelWidth(side);
    const full = this.getFullAction(side);

    if (full && abs >= this.getFullDistance(side)) {
      const width = this.el.getBoundingClientRect().width || abs;
      this.animateTo(sign * width, () => {
        this.leSwipeAction.emit({ id: full.id, side, full: true, originalEvent });
        this.animateTo(0);
      });
      this.setOpenSide(undefined);
      return;
    }

    const flick = Math.sign(velocity) === sign && Math.abs(velocity) > 0.4 && abs > 16;
    if (abs > panel / 2 || flick) {
      this.animateTo(sign * panel);
      this.setOpenSide(side);
    } else {
      this.animateTo(0);
      this.setOpenSide(undefined);
    }
  }

  // --- Trackpad / Magic Mouse: horizontal wheel ---

  private handleWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    // Momentum after a finished swipe keeps arriving; wait for a pause before reacting again
    if (this.wheelLocked) {
      e.preventDefault();
      this.restartWheelTimer(() => (this.wheelLocked = false));
      return;
    }

    if (!this.gesture) this.readDirection();
    const next = this.offset - e.deltaX * this.dirSign;
    const clamped = this.clampOffset(next);
    if (clamped === 0 && this.offset === 0) return;

    // Captures the gesture, also keeping the browser from navigating back/forward
    e.preventDefault();
    if (this.offset === 0) this.closeOtherSwipe();
    window.clearTimeout(this.settleTimer);
    this.isSettling = false;
    this.offset = clamped;
    this.restartWheelTimer(() => {
      const wasFull = this.offset !== 0 && Math.abs(this.offset) >= this.getFullDistance(this.offset > 0 ? 'start' : 'end');
      this.settle(0, e);
      if (wasFull) this.wheelLocked = true;
    });
  };

  private restartWheelTimer(callback: () => void) {
    window.clearTimeout(this.wheelTimer);
    this.wheelTimer = window.setTimeout(callback, WHEEL_IDLE_MS);
  }

  // --- Touch / pen: horizontal drag ---

  private handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || this.gesture) return;
    this.readDirection();
    this.gesture = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: this.offset,
      dragging: false,
      lastX: e.clientX,
      lastTime: e.timeStamp,
      velocity: 0,
    };
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  };

  private handlePointerMove = (e: PointerEvent) => {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (!g.dragging) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        // Vertical scroll wins
        this.removeGestureListeners();
        this.gesture = undefined;
        return;
      }
      if (Math.abs(dx) < 8) return;
      g.dragging = true;
      this.closeOtherSwipe();
      window.clearTimeout(this.settleTimer);
      this.isSettling = false;
    }

    const dt = Math.max(1, e.timeStamp - g.lastTime);
    g.velocity = ((e.clientX - g.lastX) * this.dirSign) / dt;
    g.lastX = e.clientX;
    g.lastTime = e.timeStamp;
    this.offset = this.clampOffset(g.startOffset + dx * this.dirSign);
  };

  private handlePointerUp = (e: PointerEvent) => {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointerId) return;
    this.removeGestureListeners();
    this.gesture = undefined;
    if (g.dragging) {
      this.suppressClick = true;
      this.settle(e.type === 'pointercancel' ? 0 : g.velocity, e);
    }
  };

  private removeGestureListeners() {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  // --- Clicks ---

  /** Swallows the click ending a swipe, and a tap on the content of an open swipe closes it */
  private handleClickCapture = (e: MouseEvent) => {
    const path = e.composedPath();
    const isActionButton = path.some(node => node instanceof HTMLElement && node.classList?.contains('le-swipe-action'));
    if (isActionButton) return;

    if (this.suppressClick || this.openSide) {
      e.preventDefault();
      e.stopPropagation();
      this.suppressClick = false;
      if (this.openSide) void this.close();
    }
  };

  private handleOutsidePointerDown = (e: PointerEvent) => {
    if (!e.composedPath().includes(this.el)) void this.close();
  };

  private handleActionClick(e: MouseEvent, action: LeSwipeAction, side: LeSwipeSide) {
    e.stopPropagation();
    if (action.disabled) return;
    this.leSwipeAction.emit({ id: action.id, side, full: false, originalEvent: e });
    void this.close();
  }

  private getColorStyle(color?: string): Record<string, string> {
    if (!color) return {};
    if (SEMANTIC_COLORS.includes(color)) {
      return {
        '--le-swipe-action-bg': `var(--le-color-${color})`,
        '--le-swipe-action-color': `var(--le-color-${color}-contrast)`,
      };
    }
    return { '--le-swipe-action-bg': color };
  }

  private renderPanel(side: LeSwipeSide) {
    const actions = this.getActions(side);
    if (actions.length === 0) return null;

    const reveal = side === 'start' ? Math.max(0, this.offset) : Math.max(0, -this.offset);
    const isFull = !!this.getFullAction(side) && reveal >= this.getFullDistance(side);
    // The outermost button sits at the edge: first in the start panel, last in the end panel
    const ordered = side === 'start' ? actions : [...actions].reverse();
    const isOpen = this.openSide === side;

    return (
      <div
        class={{ 'le-swipe-panel': true, [`le-swipe-panel-${side}`]: true, 'is-full': isFull }}
        style={{ width: `${reveal}px` }}
        aria-hidden={isOpen ? undefined : 'true'}
      >
        {ordered.map(action => (
          <button
            type="button"
            class={{ 'le-swipe-action': true, 'is-outer': action === actions[0], 'is-disabled': !!action.disabled }}
            data-action-id={action.id}
            disabled={action.disabled}
            tabIndex={isOpen ? 0 : -1}
            style={this.getColorStyle(action.color)}
            onClick={e => this.handleActionClick(e, action, side)}
          >
            {action.icon && <le-icon name={action.icon} class="le-swipe-action-icon" />}
            <span class="le-swipe-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    );
  }

  render() {
    const hasActions = this.getActions('start').length > 0 || this.getActions('end').length > 0;
    return (
      <Host
        data-open={this.openSide}
        class={{ 'has-actions': hasActions, 'is-settling': this.isSettling, 'is-moving': this.offset !== 0 }}
        style={{ '--le-swipe-action-width': `${this.actionWidth}px` }}
      >
        {this.renderPanel('start')}
        {this.renderPanel('end')}
        <div class="le-swipe-content" style={{ transform: this.offset ? `translateX(${this.offset * this.dirSign}px)` : undefined }}>
          <slot />
        </div>
      </Host>
    );
  }
}

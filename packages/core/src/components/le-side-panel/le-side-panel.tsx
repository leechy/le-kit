import {
  Build,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';

export type LeSidePanelSide = 'start' | 'end';
export type LeSidePanelNarrowBehavior = 'overlay' | 'push';
export type LeSidePanelToggleAction = 'toggle' | 'open' | 'close';

export type LeSidePanelRequestToggleDetail = {
  panelId?: string;
  action: LeSidePanelToggleAction;
};

type PersistedSidePanelState = {
  width?: number;
  collapsed?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readCssVariablePixels(varName: string): number | undefined {
  if (!Build.isBrowser) {
    return undefined;
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!v) {
    return undefined;
  }
  const parsed = Number.parseFloat(v);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCollapseAtPx(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('--')) {
    const fromVar = readCssVariablePixels(trimmed);
    return fromVar;
  }

  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

@Component({
  tag: 'le-side-panel',
  styleUrl: 'le-side-panel.css',
  shadow: true,
})
export class LeSidePanel {
  @Element() el: HTMLElement;

  /**
   * Optional id used to match toggle requests.
   * If set, the panel only responds to toggle events with the same `panelId`.
   */
  @Prop() panelId?: string;

  /** Which side the panel is attached to. */
  @Prop() side: LeSidePanelSide = 'start';

  /** Width breakpoint (in px or a CSS var like `--le-breakpoint-md`) below which the panel enters "narrow" mode. */
  @Prop() collapseAt?: string;

  /** Behavior when in narrow mode. */
  @Prop() narrowBehavior: LeSidePanelNarrowBehavior = 'overlay';

  /**
   * Panel open state for narrow mode.
   * - overlay: controls modal drawer visibility
   * - push: controls whether panel is shown (non-modal)
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /** Panel collapsed state for wide mode (fully hidden). */
  @Prop({ mutable: true, reflect: true }) collapsed: boolean = false;

  /** Default panel width in pixels. */
  @Prop() panelWidth: number = 280;

  /** Minimum allowed width when resizable. */
  @Prop() minPanelWidth: number = 220;

  /** Maximum allowed width when resizable. */
  @Prop() maxPanelWidth: number = 420;

  /** Allows users to resize the panel by dragging its edge. */
  @Prop() resizable: boolean = false;

  /** When set, panel width + collapsed state are persisted in localStorage. */
  @Prop() persistKey?: string;

  /** Show a close button inside the panel (primarily used in narrow overlay mode). */
  @Prop() showCloseButton: boolean = true;

  /** When crossing to wide mode, automatically show the panel (collapsed=false). */
  @Prop() autoShowOnWide: boolean = true;

  /** When crossing to narrow mode, automatically hide the panel (open=false). */
  @Prop() autoHideOnNarrow: boolean = true;

  /** Accessible label for the panel navigation region. */
  @Prop() panelLabel: string = 'Navigation';

  @Event({ eventName: 'leSidePanelOpenChange', bubbles: true, composed: true })
  leSidePanelOpenChange: EventEmitter<{ open: boolean; panelId?: string }>;

  @Event({ eventName: 'leSidePanelCollapsedChange', bubbles: true, composed: true })
  leSidePanelCollapsedChange: EventEmitter<{ collapsed: boolean; panelId?: string }>;

  @Event({ eventName: 'leSidePanelWidthChange', bubbles: true, composed: true })
  leSidePanelWidthChange: EventEmitter<{ width: number; panelId?: string }>;

  @State() private isNarrow: boolean = false;
  @State() private responsiveReady: boolean = false;
  @State() private overlayMounted: boolean = false;
  @State() private overlayVisible: boolean = false;
  @State() private currentWidthPx: number;
  @State() private resizing: boolean = false;
  @State() private suppressAnimation: boolean = false;

  private resizeObserver?: ResizeObserver;
  private panelEl?: HTMLElement;
  private overlayWrapEl?: HTMLElement;
  private focusedBeforeOpen?: HTMLElement | null;

  private firstLayoutComplete: boolean = false;

  private dragPointerId?: number;
  private dragStartX?: number;
  private dragStartWidth?: number;

  connectedCallback() {
    this.restorePersistedState();
    this.currentWidthPx = clamp(
      this.currentWidthPx || this.panelWidth,
      this.minPanelWidth,
      this.maxPanelWidth,
    );

    if (Build.isBrowser && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.recomputeNarrow();
      });
      this.resizeObserver.observe(this.el);
    }

    // Ensure we get at least one post-layout measurement.
    if (Build.isBrowser) {
      requestAnimationFrame(() => this.recomputeNarrow());
    }
  }

  componentWillLoad() {
    this.recomputeNarrow();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.teardownDragListeners();
  }

  private isModalOverlayActive(): boolean {
    return this.isNarrow && this.narrowBehavior === 'overlay' && this.open;
  }

  private syncOverlayToState() {
    const shouldUseOverlay = this.isNarrow && this.narrowBehavior === 'overlay';
    if (!shouldUseOverlay) {
      this.overlayVisible = false;
      this.overlayMounted = false;
      return;
    }

    if (this.open) {
      if (!this.overlayMounted) {
        this.overlayMounted = true;
        this.overlayVisible = false;
        requestAnimationFrame(() => {
          if (this.isNarrow && this.narrowBehavior === 'overlay' && this.open) {
            this.overlayVisible = true;
            this.focusFirstInsidePanel();
          }
        });
      }
      return;
    }

    // Closed: allow unmount to be handled by transition end / fallback timeout.
    this.overlayVisible = false;
  }

  @Watch('panelWidth')
  protected onPanelWidthChanged() {
    if (!Number.isFinite(this.panelWidth)) {
      return;
    }
    if (!this.resizing) {
      this.currentWidthPx = clamp(
        this.panelWidth || 280,
        this.minPanelWidth || 220,
        this.maxPanelWidth || 800,
      );
      this.persistState();
    }
  }

  @Watch('collapsed')
  protected onCollapsedChanged() {
    this.persistState();
    this.leSidePanelCollapsedChange.emit({ collapsed: this.collapsed, panelId: this.panelId });
  }

  @Watch('open')
  protected onOpenChanged(newValue: boolean) {
    const shouldUseOverlay = this.isNarrow && this.narrowBehavior === 'overlay';

    if (!shouldUseOverlay) {
      this.persistState();
      this.leSidePanelOpenChange.emit({ open: this.open, panelId: this.panelId });
      return;
    }

    if (newValue) {
      this.focusedBeforeOpen = (document.activeElement as HTMLElement) || null;
      this.overlayMounted = true;
      this.overlayVisible = false;
      requestAnimationFrame(() => {
        this.overlayVisible = true;
        this.focusFirstInsidePanel();
      });
    } else {
      this.overlayVisible = false;
      this.persistState();
      this.restoreFocusAfterClose();

      // Fallback: if transitionend doesn't fire, ensure overlay unmounts.
      // (e.g. interrupted transitions or unusual browser behavior)
      window.setTimeout(() => {
        const shouldUseOverlay = this.isNarrow && this.narrowBehavior === 'overlay';
        if (shouldUseOverlay && !this.open && !this.overlayVisible) {
          this.overlayMounted = false;
        }
      }, 350);
    }

    this.leSidePanelOpenChange.emit({ open: this.open, panelId: this.panelId });
  }

  @Watch('collapseAt')
  @Watch('narrowBehavior')
  protected onResponsivePropChanged() {
    this.recomputeNarrow();
  }

  @Listen('keydown', { target: 'document', capture: true })
  protected onDocumentKeyDown(ev: KeyboardEvent) {
    if (!Build.isBrowser) {
      return;
    }
    if (!this.isModalOverlayActive()) {
      return;
    }

    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      this.open = false;
      return;
    }

    if (ev.key !== 'Tab') {
      return;
    }

    const panel = this.panelEl;
    if (!panel) {
      return;
    }

    const focusables = this.getFocusableElements(panel);
    if (focusables.length === 0) {
      ev.preventDefault();
      try {
        panel.focus();
      } catch {
        // ignore
      }
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (ev.shiftKey) {
      if (!active || active === first || !panel.contains(active)) {
        ev.preventDefault();
        try {
          last.focus();
        } catch {
          // ignore
        }
      }
    } else {
      if (active === last) {
        ev.preventDefault();
        try {
          first.focus();
        } catch {
          // ignore
        }
      }
    }
  }

  @Listen('leSidePanelRequestToggle', { target: 'document' })
  protected onToggleRequest(ev: CustomEvent<LeSidePanelRequestToggleDetail>) {
    const detail = ev.detail;
    if (!detail || !detail.action) {
      return;
    }

    // panelId matching rules:
    // - If this panel has panelId: respond only when detail.panelId matches.
    // - If this panel has no panelId: respond only when detail.panelId is empty.
    const requestedId = detail.panelId || '';
    const myId = this.panelId || '';
    if (myId !== requestedId) {
      return;
    }

    if (this.isNarrow) {
      this.applyActionToOpen(detail.action);
    } else {
      this.applyActionToCollapsed(detail.action);
    }
  }

  private applyActionToOpen(action: LeSidePanelToggleAction) {
    if (action === 'open') {
      this.open = true;
      return;
    }
    if (action === 'close') {
      this.open = false;
      return;
    }
    this.open = !this.open;
  }

  private applyActionToCollapsed(action: LeSidePanelToggleAction) {
    if (action === 'open') {
      this.collapsed = false;
      return;
    }
    if (action === 'close') {
      this.collapsed = true;
      return;
    }
    this.collapsed = !this.collapsed;
  }

  private recomputeNarrow() {
    const collapseAtPx = parseCollapseAtPx(this.collapseAt);
    if (!collapseAtPx) {
      this.isNarrow = false;
      this.responsiveReady = true;
      this.syncOverlayToState();
      return;
    }

    const width = this.el.clientWidth;

    // If we can't measure yet (common on first paint), don't guess a mode.
    // This prevents a brief "wide" flash before ResizeObserver kicks in.
    if (!(width > 0)) {
      this.responsiveReady = false;
      return;
    }

    this.responsiveReady = true;

    // Suppress animation on the very first successful layout
    if (!this.firstLayoutComplete) {
      this.suppressAnimation = true;
      this.firstLayoutComplete = true;

      setTimeout(() => {
        // We need a timeout to ensure the paint
        // has happened without transition
        this.suppressAnimation = false;
      }, 1000);
    }

    const nextIsNarrow = width < collapseAtPx;

    const prevIsNarrow = this.isNarrow;
    this.isNarrow = nextIsNarrow;

    if (prevIsNarrow !== nextIsNarrow) {
      if (nextIsNarrow) {
        if (this.autoHideOnNarrow) {
          this.open = false;
        }
      } else {
        // entering wide mode
        this.open = false;
        this.overlayVisible = false;
        this.overlayMounted = false;

        if (this.autoShowOnWide) {
          this.collapsed = false;
        }
      }
    }

    this.syncOverlayToState();
  }

  private restorePersistedState() {
    if (!Build.isBrowser || !this.persistKey) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(this.persistKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PersistedSidePanelState;
      if (typeof parsed.width === 'number' && Number.isFinite(parsed.width)) {
        this.currentWidthPx = parsed.width;
      }
      if (typeof parsed.collapsed === 'boolean') {
        this.collapsed = parsed.collapsed;
      }
    } catch {
      // ignore
    }
  }

  private persistState() {
    if (!Build.isBrowser || !this.persistKey) {
      return;
    }
    const payload: PersistedSidePanelState = {
      width: this.currentWidthPx,
      collapsed: this.collapsed,
    };
    try {
      window.localStorage.setItem(this.persistKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private focusFirstInsidePanel() {
    if (!Build.isBrowser) {
      return;
    }

    const root = this.panelEl;
    if (!root) {
      return;
    }

    const candidates = this.getFocusableElements(root);
    for (const el of candidates) {
      if (el.hasAttribute('disabled')) {
        continue;
      }
      const tabindex = el.getAttribute('tabindex');
      if (tabindex === '-1') {
        continue;
      }
      try {
        el.focus();
        return;
      } catch {
        // ignore
      }
    }
  }

  private getFocusableElements(root: HTMLElement): HTMLElement[] {
    const selector = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
    return all.filter(el => {
      if (el.hasAttribute('disabled')) {
        return false;
      }
      const tabindex = el.getAttribute('tabindex');
      if (tabindex === '-1') {
        return false;
      }
      return true;
    });
  }

  private restoreFocusAfterClose() {
    if (!Build.isBrowser) {
      return;
    }
    const prev = this.focusedBeforeOpen;
    this.focusedBeforeOpen = null;
    if (prev && document.contains(prev)) {
      try {
        prev.focus();
      } catch {
        // ignore
      }
    }
  }

  private onOverlayTransitionEnd = (ev: TransitionEvent) => {
    if (ev.target !== this.overlayWrapEl) {
      return;
    }
    if (ev.propertyName !== 'transform') {
      return;
    }

    const shouldUseOverlay = this.isNarrow && this.narrowBehavior === 'overlay';
    if (!shouldUseOverlay) {
      return;
    }

    if (!this.open && !this.overlayVisible) {
      this.overlayMounted = false;
    }
  };

  private onOverlayPointerDown = (ev: PointerEvent) => {
    // Close on any click outside the panel.
    const panel = this.panelEl;
    if (!panel) {
      return;
    }
    const path = ev.composedPath();
    if (!path.includes(panel)) {
      this.open = false;
    }
  };

  private startResizeDrag = (ev: PointerEvent) => {
    if (!this.resizable) {
      return;
    }
    // No resizing if fully hidden.
    if (!this.isNarrow && this.collapsed) {
      return;
    }
    if (this.isNarrow && this.narrowBehavior === 'overlay' && !this.open) {
      return;
    }
    if (this.isNarrow && this.narrowBehavior === 'push' && !this.open) {
      return;
    }

    this.resizing = true;
    this.dragPointerId = ev.pointerId;
    this.dragStartX = ev.clientX;
    this.dragStartWidth = this.currentWidthPx;

    (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId);

    window.addEventListener('pointermove', this.onResizeDragMove, { passive: false });
    window.addEventListener('pointerup', this.onResizeDragEnd, { passive: true });
    window.addEventListener('pointercancel', this.onResizeDragEnd, { passive: true });
  };

  private onResizeDragMove = (ev: PointerEvent) => {
    if (!this.resizing || this.dragPointerId !== ev.pointerId) {
      return;
    }
    ev.preventDefault();

    const startX = this.dragStartX ?? ev.clientX;
    const startWidth = this.dragStartWidth ?? this.currentWidthPx;

    const delta = ev.clientX - startX;
    const dir = this.side === 'start' ? 1 : -1;
    const nextWidth = clamp(startWidth + delta * dir, this.minPanelWidth, this.maxPanelWidth);
    this.currentWidthPx = nextWidth;
    this.leSidePanelWidthChange.emit({ width: this.currentWidthPx, panelId: this.panelId });
  };

  private onResizeDragEnd = (ev: PointerEvent) => {
    if (!this.resizing || this.dragPointerId !== ev.pointerId) {
      return;
    }

    this.resizing = false;
    this.dragPointerId = undefined;
    this.dragStartX = undefined;
    this.dragStartWidth = undefined;

    this.teardownDragListeners();
    this.persistState();
    this.leSidePanelWidthChange.emit({ width: this.currentWidthPx, panelId: this.panelId });
  };

  private teardownDragListeners() {
    window.removeEventListener('pointermove', this.onResizeDragMove as any);
    window.removeEventListener('pointerup', this.onResizeDragEnd as any);
    window.removeEventListener('pointercancel', this.onResizeDragEnd as any);
  }

  private renderPanelInner(opts?: { renderPanelSlot?: boolean }) {
    const renderPanelSlot = opts?.renderPanelSlot ?? true;
    const showClose = this.showCloseButton && this.isNarrow && this.narrowBehavior === 'overlay';
    const tabIndex = this.isNarrow && this.narrowBehavior === 'overlay' ? -1 : null;

    return (
      <div
        class={{
          panel: true,
          start: this.side === 'start',
          end: this.side === 'end',
          resizing: this.resizing,
        }}
        part="panel"
        ref={el => (this.panelEl = el as HTMLElement)}
        role="navigation"
        aria-label={this.panelLabel}
        tabindex={tabIndex as any}
      >
        {showClose ? (
          <le-side-panel-toggle
            panel-id="demo-side"
            action="toggle"
            shortcut="Mod+B"
            variant="clear"
            class="close"
            part="close-button"
            aria-label="Close panel"
            icon-only="true"
            style={{
              '--le-button-icon-only-padding': 'var(--le-space-sm)',
            }}
            onClick={() => (this.open = false)}
          >
            <slot name="close-icon" slot="icon-only">
              <le-icon name="side-panel" />
            </slot>
          </le-side-panel-toggle>
        ) : null}

        <div class="panel-scroller" part="panel-scroller">
          {renderPanelSlot ? <slot name="panel" /> : null}
        </div>

        {this.resizable ? (
          <div
            class={{
              handle: true,
              start: this.side === 'start',
              end: this.side === 'end',
            }}
            part="resize-handle"
            role="separator"
            aria-orientation="vertical"
            tabindex={-1}
            onPointerDown={this.startResizeDrag}
          />
        ) : null}
      </div>
    );
  }

  render() {
    const widthStyle = {
      '--le-side-panel-width': `${this.currentWidthPx}px`,
    };

    const isOverlay = this.isNarrow && this.narrowBehavior === 'overlay';
    const isModalOverlayOpen = isOverlay && this.open;

    const allowPanel = this.responsiveReady;

    const showWidePanel = allowPanel && !this.isNarrow && !this.collapsed;
    const showNarrowPushPanel =
      allowPanel && this.isNarrow && this.narrowBehavior === 'push' && this.open;

    const layoutHasInlinePanel = showWidePanel || showNarrowPushPanel;

    return (
      <div
        class={{
          host: true,
          narrow: this.isNarrow,
          wide: !this.isNarrow,
          overlay: isOverlay,
          push: !isOverlay,
          collapsed: !this.isNarrow && this.collapsed,
        }}
        style={widthStyle as any}
        data-resizing={this.resizing ? 'true' : null}
      >
        {/* Wide + narrow push layout */}
        <div
          class={{
            'layout': true,
            'has-panel': layoutHasInlinePanel,
            'start': this.side === 'start',
            'end': this.side === 'end',
          }}
        >
          <div
            class={{
              'inlinePanel': true,
              'hidden': !layoutHasInlinePanel,
              'no-transition': this.suppressAnimation,
            }}
            aria-hidden={!layoutHasInlinePanel ? 'true' : null}
          >
            {/* In narrow overlay mode, only the overlay should own the named slot. */}
            {this.renderPanelInner({ renderPanelSlot: !isOverlay })}
          </div>

          <div class="content" part="content" aria-hidden={isModalOverlayOpen ? 'true' : null}>
            <slot />
          </div>
        </div>

        {/* Narrow overlay modal (contained within this component) */}
        {allowPanel && isOverlay && this.overlayMounted ? (
          <div
            class={{ overlayRoot: true, visible: this.overlayVisible }}
            part="scrim"
            role="presentation"
            onPointerDown={this.onOverlayPointerDown}
            aria-hidden={isModalOverlayOpen ? null : 'true'}
          >
            <div
              class={{
                overlayPanelWrap: true,
                visible: this.overlayVisible,
                start: this.side === 'start',
                end: this.side === 'end',
              }}
              part="overlay"
              ref={el => (this.overlayWrapEl = el as HTMLElement)}
              onTransitionEnd={this.onOverlayTransitionEnd}
              role="dialog"
              aria-modal="true"
            >
              {this.renderPanelInner({ renderPanelSlot: true })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

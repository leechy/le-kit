import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Listen,
  Watch,
  Method,
  h,
  Host,
} from '@stencil/core';
import { classnames } from '../../utils/utils';

export interface LePreviewFrameBreakpoint {
  label: string;
  width: number;
  /** Optional icon name shown in the button */
  icon?: string;
}

export interface LePreviewFrameResizeDetail {
  width: number;
}

type LePreviewFrameHandleSide = 'left' | 'right' | 'bottom';
type LePreviewFrameResizeOrigin = 'auto' | 'edge' | 'center';

interface LePreviewFrameDragState {
  side: LePreviewFrameHandleSide;
  origin: Exclude<LePreviewFrameResizeOrigin, 'auto'>;
  leftEdge: number;
  rightEdge: number;
  centerX: number;
  topEdge: number;
}

const DEFAULT_BREAKPOINTS: LePreviewFrameBreakpoint[] = [
  { label: 'Desktop', width: 1280, icon: 'desktop' },
  { label: 'Tablet', width: 768, icon: 'tablet' },
  { label: 'Phone', width: 375, icon: 'phone' },
];

/**
 * A resizable preview frame for showcasing responsive component behavior.
 *
 * Wraps any content in a resizable viewport, complete with drag handle,
 * width indicator, and preset device-size buttons. Designed for use in
 * component demos and documentation.
 *
 * @slot - The content to preview
 * @slot controls - Extra content inserted after the preset buttons
 *
 * @csspart frame - The outer chrome (toolbar + viewport)
 * @csspart controls - The top controls bar
 * @csspart viewport - The scrollable content area
 * @csspart drag-handle - The drag-resize handle(s)
 * @csspart width-badge - The live width indicator
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-preview-frame',
  styleUrl: 'le-preview-frame.css',
  shadow: true,
})
export class LePreviewFrame {
  @Element() el!: HTMLElement;

  /**
   * Initial inner width of the preview viewport in pixels.
   * Set to 0 or 'auto' to fill the available container width.
   */
  @Prop({ reflect: true }) frameWidth?: number;

  /**
   * Minimum resizable width in pixels.
   */
  @Prop() minWidth: number = 240;

  /**
   * Maximum resizable width in pixels. 0 = unconstrained.
   */
  @Prop() maxWidth: number = 0;

  /**
   * Whether to show the controls bar (breakpoint buttons + width badge).
   */
  @Prop() showControls: boolean = true;

  /**
   * Whether to show drag resize handles.
   */
  @Prop() resizable: boolean = true;

  /**
   * Which handles are rendered.
   * Accepts "right", "left", "bottom", "left,right", etc. or a JSON string/array.
   */
  @Prop() handles: LePreviewFrameHandleSide[] | string = 'right';

  /**
   * Horizontal resize origin strategy.
   * - auto: detects centered layouts and switches to center math
   * - edge: keeps opposite edge fixed (default left-aligned behavior)
   * - center: grows/shrinks from center
   */
  @Prop() origin: LePreviewFrameResizeOrigin = 'auto';

  /**
   * Extra layout padding to subtract from available container space.
   * Useful when visual page padding is not detectable from the immediate parent.
   */
  @Prop() padding: number = 0;

  /**
   * Preset breakpoints shown as buttons.
   * Can be a JSON string or a LePreviewFrameBreakpoint[].
   */
  @Prop() breakpoints: LePreviewFrameBreakpoint[] | string = DEFAULT_BREAKPOINTS;

  /**
   * Label for the width badge. Set empty to hide the unit suffix.
   */
  @Prop() widthUnit: string = 'px';

  /**
   * Minimum height of the viewport in pixels.
   */
  @Prop() minHeight: number = 64;

  /**
   * Maximum resizable viewport height in pixels. 0 = unconstrained.
   */
  @Prop() maxHeight: number = 0;

  /**
   * Emitted whenever the frame width changes (drag or preset button).
   */
  @Event() lePreviewFrameResize?: EventEmitter<LePreviewFrameResizeDetail>;

  /** Current live width — mirrors frameWidth, updated during drag */
  @State() private currentWidth: number = 0;

  /** Whether a drag operation is in progress */
  @State() private isDragging: boolean = false;

  /** Current live viewport height, updated during bottom-handle drag */
  @State() private currentHeight: number = 0;

  private dragState?: LePreviewFrameDragState;
  private dragPointerId?: number;
  private dragHandleEl?: HTMLElement;

  private resizeObserver?: ResizeObserver;

  /** Cached width of the host container (non-reactive). */
  private containerWidth: number = 0;

  /** Whether width should track parent container size automatically. */
  private autoWidth: boolean = true;

  /** Whether viewport height should track content size automatically. */
  private autoHeight: boolean = true;

  private get parsedBreakpoints(): LePreviewFrameBreakpoint[] {
    if (typeof this.breakpoints === 'string') {
      try {
        return JSON.parse(this.breakpoints);
      } catch {
        return DEFAULT_BREAKPOINTS;
      }
    }
    return this.breakpoints ?? DEFAULT_BREAKPOINTS;
  }

  private get parsedHandles(): LePreviewFrameHandleSide[] {
    const fallback: LePreviewFrameHandleSide[] = ['right'];

    if (Array.isArray(this.handles)) {
      return this.normalizeHandles(this.handles);
    }

    if (typeof this.handles !== 'string') {
      return fallback;
    }

    try {
      const parsed = JSON.parse(this.handles);
      if (Array.isArray(parsed)) {
        return this.normalizeHandles(parsed);
      }
    } catch {
      // Treat as comma-separated shorthand when JSON parsing fails.
    }

    return this.normalizeHandles(this.handles.split(','));
  }

  @Watch('frameWidth')
  handleFrameWidthChange(next?: number) {
    // Avoid mutating state synchronously during hydration/render cycles.
    queueMicrotask(() => {
      if (!this.isFiniteNumber(next)) {
        this.autoWidth = true;
        this.setCurrentWidth(this.naturalContainerWidth(), false);
        return;
      }

      this.autoWidth = false;
      this.setCurrentWidth(next, false);
    });
  }

  componentWillLoad() {
    this.containerWidth = this.naturalContainerWidth();

    const initialExplicit = this.coerceWidth(this.frameWidth);
    if (initialExplicit !== null) {
      this.autoWidth = false;
      this.currentWidth = Math.max(this.minWidth, initialExplicit);
    } else {
      this.autoWidth = true;
      this.currentWidth = Math.max(this.minWidth, this.containerWidth || 900);
    }

    this.autoHeight = true;
    this.currentHeight = 0;
  }

  componentDidLoad() {
    // Run initial post-mount sync on next frame to avoid mutating state
    // during componentDidLoad() lifecycle.
    requestAnimationFrame(() => {
      this.containerWidth = this.naturalContainerWidth();
      if (this.autoWidth || this.currentWidth <= 0) {
        this.setCurrentWidth(this.containerWidth, false);
      }
    });

    this.observeContainer();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.cleanupDragListeners();
  }

  /** Snap to a preset width. */
  @Method()
  async snapTo(width: number) {
    this.applyWidth(width);
  }

  /** Reset to natural/container width. */
  @Method()
  async resetWidth() {
    this.autoWidth = true;
    this.setCurrentWidth(this.naturalContainerWidth(), true);
  }

  /** Resize handle drag */
  private naturalContainerWidth(): number {
    const parent = this.el.parentElement;
    const layoutPadding = this.normalizedPadding * 2;
    if (parent) {
      const style = getComputedStyle(parent);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return Math.max(
        0,
        parent.getBoundingClientRect().width - paddingLeft - paddingRight - layoutPadding,
      );
    }
    return Math.max(this.minWidth, 900 - layoutPadding); // Fallback width
  }

  private observeContainer() {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      const nextContainerWidth = this.naturalContainerWidth();
      this.containerWidth = nextContainerWidth;

      // If in auto mode, keep following container width.
      if (this.autoWidth) {
        this.setCurrentWidth(nextContainerWidth, false);
      }

      if (!this.autoHeight && this.currentHeight > 0) {
        this.setCurrentHeight(this.currentHeight, false);
      }
    });
    if (this.el.parentElement) {
      this.resizeObserver.observe(this.el.parentElement);
    }
  }

  private applyWidth(width: number) {
    this.autoWidth = false;
    this.setCurrentWidth(width, true);
  }

  private applyHeight(height: number) {
    this.autoHeight = false;
    this.setCurrentHeight(height, false);
  }

  private handleDragStart = (side: LePreviewFrameHandleSide, event: PointerEvent) => {
    if (!this.resizable) return;
    event.preventDefault();

    const frameEl = this.el.shadowRoot?.querySelector('.frame') as HTMLElement | null;
    const parent = this.el.parentElement;
    if (!frameEl || !parent) return;

    const frameRect = frameEl.getBoundingClientRect();
    const viewportEl = this.el.shadowRoot?.querySelector('.frame-viewport') as HTMLElement | null;
    const viewportRect = viewportEl?.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    this.dragState = {
      side,
      origin: this.resolveResizeOrigin(frameRect, parentRect),
      leftEdge: frameRect.left,
      rightEdge: frameRect.right,
      centerX: frameRect.left + frameRect.width / 2,
      topEdge: viewportRect?.top ?? frameRect.top,
    };

    this.isDragging = true;
    this.dragPointerId = event.pointerId;
    this.dragHandleEl = event.currentTarget as HTMLElement;
    this.dragHandleEl?.setPointerCapture?.(event.pointerId);
  };

  @Listen('pointermove', { target: 'window', passive: false })
  handleDragMove(event: PointerEvent) {
    if (this.dragPointerId !== event.pointerId) return;
    if (!this.isDragging || !this.dragState) return;

    event.preventDefault();

    if (this.dragState.side === 'bottom') {
      const height = event.clientY - this.dragState.topEdge;
      this.applyHeight(height);
      return;
    }

    const width = this.computeDragWidth(event.clientX, this.dragState);
    this.applyWidth(width);
  }

  @Listen('pointerup', { target: 'window' })
  @Listen('pointercancel', { target: 'window' })
  handleDragEnd(event: PointerEvent) {
    if (this.dragPointerId !== event.pointerId) return;
    if (!this.isDragging) return;

    if (this.dragHandleEl?.hasPointerCapture?.(event.pointerId)) {
      this.dragHandleEl.releasePointerCapture(event.pointerId);
    }

    this.isDragging = false;
    this.dragState = undefined;
    this.dragPointerId = undefined;
    this.dragHandleEl = undefined;
  }

  private cleanupDragListeners() {
    this.isDragging = false;
    this.dragState = undefined;
    this.dragPointerId = undefined;
    this.dragHandleEl = undefined;
  }

  private normalizeHandles(input: unknown[]): LePreviewFrameHandleSide[] {
    const handles = input
      .map(item => String(item).trim().toLowerCase())
      .filter(
        (item): item is LePreviewFrameHandleSide =>
          item === 'left' || item === 'right' || item === 'bottom',
      );

    if (handles.length === 0) return ['right'];
    return Array.from(new Set(handles));
  }

  private resolveResizeOrigin(
    frameRect: DOMRect,
    parentRect: DOMRect,
  ): Exclude<LePreviewFrameResizeOrigin, 'auto'> {
    if (this.origin !== 'auto') {
      return this.origin;
    }

    const leftGap = Math.max(0, frameRect.left - parentRect.left);
    const rightGap = Math.max(0, parentRect.right - frameRect.right);
    const centerTolerancePx = 2;

    return Math.abs(leftGap - rightGap) <= centerTolerancePx ? 'center' : 'edge';
  }

  private computeDragWidth(clientX: number, dragState: LePreviewFrameDragState): number {
    if (dragState.origin === 'center') {
      if (dragState.side === 'left') {
        return (dragState.centerX - clientX) * 2;
      }
      return (clientX - dragState.centerX) * 2;
    }

    if (dragState.side === 'left') {
      return dragState.rightEdge - clientX;
    }
    return clientX - dragState.leftEdge;
  }

  private handleResizeKeyDown = (side: LePreviewFrameHandleSide, event: KeyboardEvent) => {
    if (side === 'bottom') {
      const step = event.shiftKey ? 50 : 10;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.applyHeight(this.currentViewportHeight + step);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.applyHeight(this.currentViewportHeight - step);
      }
      return;
    }

    const step = event.shiftKey ? 50 : 10;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const delta = side === 'left' ? -step : step;
      this.applyWidth(this.currentWidth + delta);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = side === 'left' ? step : -step;
      this.applyWidth(this.currentWidth + delta);
    }
  };

  private renderHandle(side: LePreviewFrameHandleSide) {
    const oppositeSide = side === 'left' ? 'right' : 'left';
    const orientation = side === 'bottom' ? 'horizontal' : 'vertical';
    const placement = side === 'left' ? 'start' : 'end';

    return (
      <le-drag-handle
        class={{
          'is-dragging': this.isDragging,
        }}
        orientation={orientation}
        placement={placement}
        part={`drag-handle drag-handle-${side}`}
        role="slider"
        aria-label={`Resize preview frame from ${side} edge`}
        aria-orientation={side === 'bottom' ? 'vertical' : 'horizontal'}
        aria-valuenow={
          side === 'bottom' ? Math.round(this.currentViewportHeight) : Math.round(this.currentWidth)
        }
        aria-valuemin={side === 'bottom' ? this.minHeight : this.minWidth}
        aria-valuemax={
          side === 'bottom'
            ? this.maxHeight > 0
              ? this.maxHeight
              : undefined
            : this.maxWidth > 0
              ? this.maxWidth
              : undefined
        }
        tabIndex={0}
        onPointerDown={event => this.handleDragStart(side, event)}
        onKeyDown={event => this.handleResizeKeyDown(side, event)}
      >
        {side === 'bottom'
          ? 'Drag bottom handle to resize height.'
          : `Drag ${side} handle to resize. ${oppositeSide} edge remains anchor.`}
      </le-drag-handle>
    );
  }

  private get normalizedPadding(): number {
    return this.isFiniteNumber(this.padding) ? Math.max(0, this.padding) : 0;
  }

  private get currentViewportHeight(): number {
    if (this.currentHeight > 0) {
      return this.currentHeight;
    }

    const viewportEl = this.el.shadowRoot?.querySelector('.frame-viewport') as HTMLElement | null;
    if (viewportEl) {
      return viewportEl.getBoundingClientRect().height;
    }

    return this.minHeight;
  }

  private setCurrentWidth(width: number, emit: boolean) {
    const maxCandidate =
      this.maxWidth > 0 ? this.maxWidth : this.containerWidth || this.naturalContainerWidth();
    const maxW = Math.max(this.minWidth, maxCandidate);
    const clamped = Math.max(this.minWidth, Math.min(width, maxW));

    if (this.currentWidth !== clamped) {
      this.currentWidth = clamped;
      if (emit) {
        this.lePreviewFrameResize?.emit({ width: clamped });
      }
    }
  }

  private setCurrentHeight(height: number, emit: boolean) {
    const maxCandidate = this.maxHeight > 0 ? this.maxHeight : Number.POSITIVE_INFINITY;
    const maxH = Math.max(this.minHeight, maxCandidate);
    const clamped = Math.max(this.minHeight, Math.min(height, maxH));

    if (this.currentHeight !== clamped) {
      this.currentHeight = clamped;
      if (emit) {
        this.lePreviewFrameResize?.emit({ width: this.currentWidth });
      }
    }
  }

  private coerceWidth(value: unknown): number | null {
    if (!this.isFiniteNumber(value)) return null;
    return value;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  private renderControls() {
    if (!this.showControls) return null;

    const maxW =
      this.maxWidth > 0 ? this.maxWidth : this.containerWidth || this.naturalContainerWidth();

    return (
      <div class="frame-controls" part="controls">
        <le-button-group>
          {this.parsedBreakpoints?.map(bp => {
            const isActive = Math.abs(this.currentWidth - bp.width) < 2;
            const isDisabled = bp.width < this.minWidth || (this.maxWidth > 0 && bp.width > maxW);
            return (
              <le-button
                disabled={isDisabled}
                selected={isActive}
                variant="clear"
                aria-label={`Preview at ${bp.label} width (${bp.width}px)`}
                onClick={() => this.applyWidth(bp.width)}
                tooltip={bp.label}
              >
                <le-icon slot="icon-only" name={bp.icon} />
              </le-button>
            );
          })}
        </le-button-group>

        <slot name="controls" />

        <le-tag aria-live="polite">
          {Math.round(this.currentWidth)}
          {this.widthUnit ? <span class="width-unit">{this.widthUnit}</span> : null}
        </le-tag>
      </div>
    );
  }

  render() {
    const frameStyle: Record<string, string> = {};
    const viewportStyle: Record<string, string> = {};

    if (this.currentWidth > 0) {
      frameStyle.width = `${this.currentWidth}px`;
    }

    if (this.minHeight > 0) {
      frameStyle['--le-preview-frame-min-height'] = `${this.minHeight}px`;
    }

    if (this.currentHeight > 0) {
      viewportStyle.height = `${this.currentHeight}px`;
    }

    if (this.normalizedPadding > 0) {
      viewportStyle.padding = `${this.normalizedPadding}px`;
    }

    return (
      <Host
        class={classnames({
          'is-dragging': this.isDragging,
          'is-resizable': this.resizable,
        })}
      >
        <div class="frame" part="frame" style={frameStyle}>
          {this.renderControls()}

          <div class="frame-viewport" part="viewport" style={viewportStyle}>
            <slot />
          </div>

          {this.resizable && this.parsedHandles.map(side => this.renderHandle(side))}
        </div>
      </Host>
    );
  }
}

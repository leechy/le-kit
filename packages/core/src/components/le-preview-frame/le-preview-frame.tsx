import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
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
 * @csspart drag-handle - The right drag-resize handle
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
   * Whether to show the drag resize handle on the right edge.
   */
  @Prop() resizable: boolean = true;

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
   * Emitted whenever the frame width changes (drag or preset button).
   */
  @Event() lePreviewFrameResize?: EventEmitter<LePreviewFrameResizeDetail>;

  /** Current live width — mirrors frameWidth, updated during drag */
  @State() private currentWidth: number = 0;

  /** Whether a drag operation is in progress */
  @State() private isDragging: boolean = false;

  private dragStartX: number = 0;
  private dragStartWidth: number = 0;

  private resizeObserver?: ResizeObserver;

  /** Cached width of the host container (non-reactive). */
  private containerWidth: number = 0;

  /** Whether width should track parent container size automatically. */
  private autoWidth: boolean = true;

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
      return;
    }

    this.autoWidth = true;
    this.currentWidth = Math.max(this.minWidth, this.containerWidth || 900);
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
    if (parent) {
      const style = getComputedStyle(parent);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return Math.max(0, parent.getBoundingClientRect().width - paddingLeft - paddingRight);
    }
    return 900; // Fallback width if parent size can't be determined
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
    });
    if (this.el.parentElement) {
      this.resizeObserver.observe(this.el.parentElement);
    }
  }

  private applyWidth(width: number) {
    this.autoWidth = false;
    this.setCurrentWidth(width, true);
  }

  private handleDragStart = (event: PointerEvent) => {
    if (!this.resizable) return;
    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartWidth = this.currentWidth || this.naturalContainerWidth();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  private handleDragMove = (event: PointerEvent) => {
    if (!this.isDragging) return;
    const delta = event.clientX - this.dragStartX;
    this.applyWidth(this.dragStartWidth + delta);
  };

  private handleDragEnd = (event: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  private cleanupDragListeners() {
    this.isDragging = false;
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
    if (this.currentWidth > 0) {
      frameStyle.width = `${this.currentWidth}px`;
    }
    if (this.minHeight > 0) {
      frameStyle['--le-preview-frame-min-height'] = `${this.minHeight}px`;
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

          <div class="frame-viewport" part="viewport">
            <slot />
          </div>

          {this.resizable && (
            <div
              class="drag-handle"
              part="drag-handle"
              role="slider"
              aria-label="Resize preview frame"
              aria-valuenow={Math.round(this.currentWidth)}
              aria-valuemin={this.minWidth}
              aria-valuemax={this.maxWidth > 0 ? this.maxWidth : undefined}
              tabIndex={0}
              onPointerDown={this.handleDragStart}
              onPointerMove={this.handleDragMove}
              onPointerUp={this.handleDragEnd}
              onPointerCancel={this.handleDragEnd}
              onKeyDown={e => {
                const step = e.shiftKey ? 50 : 10;
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  this.applyWidth(this.currentWidth + step);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  this.applyWidth(this.currentWidth - step);
                }
              }}
            >
              <div class="drag-handle-grip" />
            </div>
          )}
        </div>
      </Host>
    );
  }
}

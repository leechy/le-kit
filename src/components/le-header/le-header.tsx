import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { classnames, observeModeChanges } from '../../utils/utils';

export type LeHeaderPosition = 'static' | 'sticky' | 'fixed';

/**
 * A functional page header with scroll-aware behaviors.
 *
 * Features:
 * - Static (default), sticky, or fixed positioning
 * - Optional shrink-on-scroll behavior via `shrink-offset`
 * - Optional reveal-on-scroll-up via `reveal-on-scroll` (sticky only)
 *
 * Slots:
 * - `start`: left side (logo/back button)
 * - `title`: centered/primary title content
 * - `end`: right side actions
 * - default: extra content row (e.g., tabs/search) rendered below main row
 *
 * @slot start - Start area content
 * @slot title - Title content
 * @slot end - End area content
 * @slot - Optional secondary row content
 *
 * @cssprop --le-header-bg - Background (color/gradient)
 * @cssprop --le-header-color - Text color
 * @cssprop --le-header-border - Border (e.g. 1px solid ...)
 * @cssprop --le-header-shadow - Shadow/elevation
 * @cssprop --le-header-max-width - Inner content max width
 * @cssprop --le-header-padding-x - Horizontal padding
 * @cssprop --le-header-padding-y - Vertical padding
 * @cssprop --le-header-gap - Gap between zones
 * @cssprop --le-header-height - Base height (main row)
 * @cssprop --le-header-height-condensed - Condensed height when shrunk
 * @cssprop --le-header-transition - Transition timing
 * @cssprop --le-header-z - Z-index (fixed mode)
 *
 * @csspart placeholder - The placeholder element that reserves space in fixed mode
 * @csspart header - The header container
 * @csspart inner - Inner max-width container
 * @csspart row - Main row
 * @csspart start - Start zone
 * @csspart title - Title zone
 * @csspart end - End zone
 * @csspart secondary - Secondary row
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-header',
  styleUrl: 'le-header.css',
  shadow: true,
})
export class LeHeader {
  @Element() el: HTMLElement;

  /** Force static positioning (default). Ignored if `sticky` or `fixed` are true. */
  @Prop({ attribute: 'static', reflect: true }) isStatic: boolean = false;

  /** Sticky positioning (in-flow). Ignored if `fixed` is true. */
  @Prop({ reflect: true }) sticky: boolean = false;

  /** Fixed positioning (out-of-flow). Takes precedence over `sticky`/`static`. */
  @Prop({ reflect: true }) fixed: boolean = false;

  /**
   * Sticky-only reveal behavior (hide on scroll down, show on scroll up).
   * - missing/false: disabled
   * - true/empty attribute: enabled with default threshold (16)
   * - number (as string): enabled and used as threshold
   */
  @Prop({ attribute: 'reveal-on-scroll', reflect: true }) revealOnScroll?: string;

  /**
   * Shrink trigger.
   * - missing/0: disabled
   * - number (px): shrink when scrollY >= that value (but never before header height)
   * - css var name (e.g. --foo): shrink when scrollY >= resolved var value
   * - selector (e.g. .page-title): shrink when that element scrolls out of view above the viewport
   */
  @Prop({ attribute: 'shrink-offset', reflect: true }) shrinkOffset?: string;

  /** Emits whenever scroll-driven state changes. */
  @Event() leHeaderState: EventEmitter<{
    y: number;
    direction: 'up' | 'down';
    revealed: boolean;
    shrunk: boolean;
  }>;

  /** Emits when the header shrinks/expands (only on change). */
  @Event({ bubbles: true, composed: true })
  leHeaderShrinkChange: EventEmitter<{ shrunk: boolean; y: number }>;

  /** Emits when the header hides/shows (only on change). */
  @Event({ bubbles: true, composed: true })
  leHeaderVisibilityChange: EventEmitter<{ visible: boolean; y: number }>;

  @State() private adminMode: boolean = false;
  @State() private revealed: boolean = true;
  @State() private shrunk: boolean = false;
  @State() private placeholderHeight: number | null = null;

  private disconnectModeObserver?: () => void;
  private rafId: number | null = null;
  private measureRafId: number | null = null;
  private lastY: number = 0;
  private lastEmittedDirection: 'up' | 'down' = 'down';
  private headerEl?: HTMLElement;
  private shrinkSelectorEl?: Element | null;

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, mode => {
      this.adminMode = mode === 'admin';
    });
  }

  componentDidLoad() {
    if (typeof window === 'undefined') return;
    this.lastY = window.scrollY || 0;
    this.scheduleMeasure(true);
    this.scheduleUpdate(true);
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.measureRafId != null) {
      cancelAnimationFrame(this.measureRafId);
      this.measureRafId = null;
    }
  }

  @Watch('revealOnScroll')
  @Watch('shrinkOffset')
  @Watch('fixed')
  @Watch('sticky')
  @Watch('isStatic')
  protected onBehaviorPropsChange() {
    this.scheduleUpdate(true);
    this.scheduleMeasure(true);
  }

  @Listen('scroll', { target: 'window', passive: true })
  protected onWindowScroll() {
    this.scheduleUpdate();
  }

  @Listen('resize', { target: 'window', passive: true })
  protected onWindowResize() {
    this.scheduleMeasure(true);
    this.scheduleUpdate(true);
  }

  private getPosition(): LeHeaderPosition {
    if (this.fixed) return 'fixed';
    if (this.sticky) return 'sticky';
    return 'static';
  }

  private parseRevealThreshold(): number | null {
    // Only applies in sticky mode.
    if (!this.sticky || this.fixed) return null;
    if (this.revealOnScroll == null) return null;
    const raw = String(this.revealOnScroll).trim();
    if (raw === '' || raw === 'true') return 16;
    if (raw === 'false') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 16;
  }

  private resolveShrinkStartPx(): number | null {
    const raw = (this.shrinkOffset ?? '').trim();
    if (!raw || raw === '0') return null;

    // Numeric
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return Math.max(0, numeric);

    // CSS variable name
    if (raw.startsWith('--')) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(raw).trim();
      const v = Number(value.replace('px', '').trim());
      return Number.isFinite(v) ? Math.max(0, v) : null;
    }

    // Selector
    try {
      const el = document.querySelector(raw);
      this.shrinkSelectorEl = el;
      return null;
    } catch {
      this.shrinkSelectorEl = null;
      return null;
    }
  }

  private scheduleUpdate(force: boolean = false) {
    if (this.rafId != null && !force) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateFromScroll();
    });
  }

  private scheduleMeasure(force: boolean = false) {
    if (this.measureRafId != null && !force) return;
    this.measureRafId = requestAnimationFrame(() => {
      this.measureRafId = null;
      this.measurePlaceholderHeight();
    });
  }

  private measurePlaceholderHeight() {
    // Measure the rendered header height once (and on resize/mode change).
    // This intentionally ignores scroll/shrink behavior; it should reserve the full header height.
    if (!this.headerEl) return;

    const next = Math.ceil(this.headerEl.getBoundingClientRect().height);
    if (!Number.isFinite(next) || next <= 0) return;

    if (next !== this.placeholderHeight) {
      this.placeholderHeight = next;
      // Publish to global root so placeholders anywhere can read it.
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--le-header-height', `${next}px`);
      }
    }
  }

  private updateFromScroll() {
    const y = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
    const delta = y - this.lastY;

    const direction: 'up' | 'down' = delta < 0 ? 'up' : 'down';

    // Shrink behavior
    let nextShrunk = false;
    const headerHeight = Math.max(0, this.placeholderHeight ?? 0);
    const shrinkStartPx = typeof window !== 'undefined' ? this.resolveShrinkStartPx() : null;

    if (this.shrinkSelectorEl) {
      const rect = (this.shrinkSelectorEl as HTMLElement).getBoundingClientRect();
      nextShrunk = rect.bottom <= 0;
    } else if (shrinkStartPx != null) {
      const effectiveStart = Math.max(shrinkStartPx, headerHeight);
      nextShrunk = y >= effectiveStart;
    }

    if (nextShrunk !== this.shrunk) {
      this.shrunk = nextShrunk;
      this.leHeaderShrinkChange.emit({ shrunk: this.shrunk, y });
    }

    // Reveal-on-scroll (sticky-only)
    const revealThreshold = this.parseRevealThreshold();
    if (revealThreshold != null) {
      // Always show the header near the top of the page.
      const topLock = Math.max(0, this.placeholderHeight ?? 0);
      if (y <= topLock) {
        if (!this.revealed) {
          this.revealed = true;
          this.leHeaderVisibilityChange.emit({ visible: true, y });
        }
      } else if (Math.abs(delta) >= revealThreshold) {
        const nextRevealed = direction === 'up' || y <= 0;
        if (nextRevealed !== this.revealed) {
          this.revealed = nextRevealed;
          this.leHeaderVisibilityChange.emit({ visible: this.revealed, y });
        }
        this.lastEmittedDirection = direction;
      }
    } else {
      if (!this.revealed) {
        this.revealed = true;
        this.leHeaderVisibilityChange.emit({ visible: true, y });
      }
    }

    this.lastY = y;

    this.leHeaderState.emit({
      y,
      direction: this.lastEmittedDirection,
      revealed: this.revealed,
      shrunk: this.shrunk,
    });
  }

  render() {
    const position = this.getPosition();

    const hostClass = classnames('le-header', {
      'header-is-shrunk': this.shrunk,
      'is-fixed': position === 'fixed',
      'is-sticky': position === 'sticky',
      'is-static': position === 'static',
      'is-revealed': this.revealed,
      'is-hidden': !this.revealed,
      'is-shrunk': this.shrunk,
      'is-admin': this.adminMode,
    });

    // Placeholder is now a separate component; header no longer renders it.

    return (
      <Host class={hostClass}>
        <le-component component="le-header">
          <header
            class="header"
            part="header"
            role="banner"
            ref={el => (this.headerEl = el as HTMLElement)}
          >
            <div class="inner" part="inner">
              <div class="row" part="row">
                <div class="start" part="start">
                  <le-slot
                    name="start"
                    label="Start"
                    description="Logo / back button / nav"
                    allowed-components="le-button,le-text,le-tag,le-box,le-stack"
                  >
                    <slot name="start"></slot>
                  </le-slot>
                </div>

                <div class="title" part="title">
                  <le-slot
                    name="title"
                    label="Title"
                    description="Header title"
                    type="text"
                    tag="span"
                  >
                    <span class="title-slot" part="title">
                      <slot name="title"></slot>
                    </span>
                  </le-slot>
                </div>

                <div class="end" part="end">
                  <le-slot
                    name="end"
                    label="End"
                    description="Actions"
                    allowed-components="le-button,le-text,le-tag,le-box,le-stack"
                  >
                    <slot name="end"></slot>
                  </le-slot>
                </div>
              </div>

              <div class="secondary" part="secondary">
                <le-slot
                  name=""
                  label="Secondary"
                  description="Secondary row content"
                  allowed-components="le-tabs,le-tab-bar,le-select,le-combobox,le-text,le-stack,le-box"
                >
                  <slot></slot>
                </le-slot>
              </div>
            </div>
          </header>
        </le-component>
      </Host>
    );
  }
}

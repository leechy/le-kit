import {
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
import { classnames, observeModeChanges } from '../../utils/utils';

export type LeWebPageHeaderMode = 'static' | 'fixed';
export type LeWebPageHeaderRevealMode = 'none' | 'reveal';
export type LeWebPageHeaderShrinkMode = 'none' | 'shrink';

/**
 * A functional page header with scroll-aware behaviors.
 *
 * Features:
 * - Static or fixed (fixed keeps layout space via a placeholder)
 * - Optional shrink-on-scroll styling hook
 * - Optional reveal-on-scroll-up (hide on down, show on up)
 * - Optional title handoff via event + scroll position
 *
 * Slots:
 * - `start`: left side (logo/back button)
 * - `title`: centered/primary title content
 * - `end`: right side actions
 * - default: extra content row (e.g., tabs/search) rendered below main row
 *
 * Events listened:
 * - `leWebPageTitleChange`: set a compact title to show when page title scrolled away
 * - `leWebPageTitleVisibility`: alternatively drive title visibility explicitly
 *
 * @slot start - Start area content
 * @slot title - Title content
 * @slot end - End area content
 * @slot - Optional secondary row content
 *
 * @cssprop --le-web-page-header-bg - Background (color/gradient)
 * @cssprop --le-web-page-header-color - Text color
 * @cssprop --le-web-page-header-border - Border (e.g. 1px solid ...)
 * @cssprop --le-web-page-header-shadow - Shadow/elevation
 * @cssprop --le-web-page-header-max-width - Inner content max width
 * @cssprop --le-web-page-header-padding-x - Horizontal padding
 * @cssprop --le-web-page-header-padding-y - Vertical padding
 * @cssprop --le-web-page-header-gap - Gap between zones
 * @cssprop --le-web-page-header-height - Base height (main row)
 * @cssprop --le-web-page-header-height-condensed - Condensed height when shrunk
 * @cssprop --le-web-page-header-transition - Transition timing
 * @cssprop --le-web-page-header-z - Z-index (fixed mode)
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
  tag: 'le-web-page-header',
  styleUrl: 'le-web-page-header.default.css',
  shadow: true,
})
export class LeWebPageHeader {
  @Element() el: HTMLElement;

  /** Layout behavior. `fixed` uses a placeholder to avoid overlap. */
  @Prop({ reflect: true }) mode: LeWebPageHeaderMode = 'static';

  /** Shrink styling hook when scrolling down beyond `shrinkOffset`. */
  @Prop({ reflect: true }) shrink: LeWebPageHeaderShrinkMode = 'none';

  /** Y offset (px) after which `shrunk` becomes true. */
  @Prop() shrinkOffset: number = 24;

  /** Reveal behavior: hide on scroll down, show on scroll up. */
  @Prop({ reflect: true }) reveal: LeWebPageHeaderRevealMode = 'none';

  /** Minimum delta (px) to consider direction changes (reduces jitter). */
  @Prop() revealThreshold: number = 8;

  /**
   * If true, show a compact title when the page title is not visible.
   * Title content is driven by `leWebPageTitleChange` or `leWebPageTitleVisibility`.
   */
  @Prop({ reflect: true }) smartTitle: boolean = false;

  /** Emits whenever scroll-driven state changes. */
  @Event() leWebPageHeaderState: EventEmitter<{
    y: number;
    direction: 'up' | 'down';
    revealed: boolean;
    shrunk: boolean;
  }>;

  @State() private adminMode: boolean = false;
  @State() private revealed: boolean = true;
  @State() private shrunk: boolean = false;
  @State() private compactTitle?: string;
  @State() private pageTitleVisible: boolean = true;

  private disconnectModeObserver?: () => void;
  private rafId: number | null = null;
  private lastY: number = 0;
  private lastEmittedDirection: 'up' | 'down' = 'down';

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, mode => {
      this.adminMode = mode === 'admin';
    });

    if (typeof window !== 'undefined') {
      this.lastY = window.scrollY || 0;
      this.scheduleUpdate();
    }
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  @Watch('reveal')
  @Watch('shrink')
  @Watch('shrinkOffset')
  @Watch('revealThreshold')
  protected onBehaviorPropsChange() {
    this.scheduleUpdate(true);
  }

  @Listen('scroll', { target: 'window', passive: true })
  protected onWindowScroll() {
    this.scheduleUpdate();
  }

  @Listen('resize', { target: 'window', passive: true })
  protected onWindowResize() {
    this.scheduleUpdate(true);
  }

  @Listen('leWebPageTitleChange', { target: 'window' })
  protected onTitleChange(ev: CustomEvent<{ title?: string }>) {
    if (!this.smartTitle) return;
    this.compactTitle = ev.detail?.title;
  }

  @Listen('leWebPageTitleVisibility', { target: 'window' })
  protected onTitleVisibility(ev: CustomEvent<{ visible: boolean }>) {
    if (!this.smartTitle) return;
    this.pageTitleVisible = !!ev.detail?.visible;
  }

  private scheduleUpdate(force: boolean = false) {
    if (this.rafId != null && !force) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateFromScroll();
    });
  }

  private updateFromScroll() {
    const y = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
    const delta = y - this.lastY;

    const direction: 'up' | 'down' = delta < 0 ? 'up' : 'down';

    if (this.shrink === 'shrink') {
      const nextShrunk = y >= Math.max(0, this.shrinkOffset);
      if (nextShrunk !== this.shrunk) this.shrunk = nextShrunk;
    } else if (this.shrunk) {
      this.shrunk = false;
    }

    if (this.reveal === 'reveal') {
      const threshold = Math.max(0, this.revealThreshold);
      if (Math.abs(delta) >= threshold) {
        const nextRevealed = direction === 'up' || y <= 0;
        if (nextRevealed !== this.revealed) this.revealed = nextRevealed;
        this.lastEmittedDirection = direction;
      }
    } else if (!this.revealed) {
      this.revealed = true;
    }

    this.lastY = y;

    this.leWebPageHeaderState.emit({
      y,
      direction: this.lastEmittedDirection,
      revealed: this.revealed,
      shrunk: this.shrunk,
    });
  }

  private renderTitle() {
    const shouldShowCompact = this.smartTitle && !this.pageTitleVisible && !!this.compactTitle;

    if (shouldShowCompact) {
      return (
        <span class="compact-title" part="title">
          {this.compactTitle}
        </span>
      );
    }

    return (
      <span class="title-slot" part="title">
        <slot name="title"></slot>
      </span>
    );
  }

  render() {
    const hostClass = classnames('le-web-page-header', {
      'mode-fixed': this.mode === 'fixed',
      'mode-static': this.mode === 'static',
      'is-revealed': this.revealed,
      'is-hidden': !this.revealed,
      'is-shrunk': this.shrunk,
      'is-admin': this.adminMode,
      'has-smart-title': this.smartTitle,
    });

    const showPlaceholder = this.mode === 'fixed';

    return (
      <le-component component="le-web-page-header" hostClass={hostClass}>
        {showPlaceholder ? <div class="placeholder" part="placeholder" aria-hidden="true" /> : null}

        <header class="header" part="header" role="banner">
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
                  {this.renderTitle()}
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
    );
  }
}

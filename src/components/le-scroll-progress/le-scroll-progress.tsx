import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';

/**
 * Displays scroll progress as a simple bar.
 *
 * If `track-scroll-progress` is present without a value, tracks the full document.
 * If it is a selector string, tracks progress within the matched element.
 *
 * @cssprop --le-scroll-progress-height - Bar height
 * @cssprop --le-scroll-progress-bg - Track background
 * @cssprop --le-scroll-progress-fill - Fill color
 * @cssprop --le-scroll-progress-sticky-top - If sticky, stop position to parent top
 * @cssprop --le-scroll-progress-fixed-top - If fixed, distance from window top
 * @cssprop --le-scroll-progress-fixed-left - If fixed, distance from window left
 * @cssprop --le-scroll-progress-fixed-right - If fixed, distance from window right
 * @cssprop --le-scroll-progress-z - Z-index of the progress bar (1001 by default, above header)
 *
 * @csspart track - Outer track
 * @csspart fill - Inner fill
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-scroll-progress',
  styleUrl: 'le-scroll-progress.css',
  shadow: true,
})
export class LeScrollProgress {
  @Element() el: HTMLElement;

  /** Boolean or selector string. */
  @Prop({ attribute: 'track-scroll-progress', reflect: true }) trackScrollProgress?: string;

  @State() private progress: number = 0;

  private rafId: number | null = null;
  private targetEl: Element | null = null;

  componentWillLoad() {
    this.updateProgress();
  }

  componentDidLoad() {
    this.resolveTarget();
    this.updateProgress();
  }

  disconnectedCallback() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  @Watch('trackScrollProgress')
  protected onTrackChange() {
    this.resolveTarget();
    this.updateProgress();
  }

  @Listen('scroll', { target: 'window', passive: true })
  protected onScroll() {
    this.scheduleUpdate();
  }

  @Listen('resize', { target: 'window', passive: true })
  protected onResize() {
    this.resolveTarget();
    this.scheduleUpdate(true);
  }

  private scheduleUpdate(force: boolean = false) {
    if (this.rafId != null && !force) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateProgress();
    });
  }

  private resolveTarget() {
    if (typeof document === 'undefined') return;
    const raw = this.trackScrollProgress;

    // If attribute missing, default to enabled (full document).
    // If user explicitly sets 'false', treat as disabled.
    if (raw == null) {
      this.targetEl = null;
      return;
    }

    const val = String(raw).trim();
    if (val === '' || val === 'true') {
      this.targetEl = null;
      return;
    }

    if (val === 'false') {
      this.targetEl = null;
      return;
    }

    try {
      this.targetEl = document.querySelector(val);
    } catch {
      this.targetEl = null;
    }
  }

  private clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
  }

  private updateProgress() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // If explicitly disabled.
    if (this.trackScrollProgress === 'false') {
      if (this.progress !== 0) this.progress = 0;
      return;
    }

    const scrollY = window.scrollY || 0;

    let p = 0;

    if (this.targetEl) {
      const rect = (this.targetEl as HTMLElement).getBoundingClientRect();
      const top = scrollY + rect.top;
      const height = rect.height;
      const viewport = window.innerHeight || 1;

      const denom = Math.max(1, height - viewport);
      p = this.clamp01((scrollY - top) / denom);
    } else {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      p = this.clamp01(scrollY / denom);
    }

    const next = Math.round(p * 1000) / 1000;
    if (next !== this.progress) this.progress = next;
  }

  render() {
    const width = `${this.progress * 100}%`;

    return (
      <Host>
        <div class="track" part="track" aria-hidden="true">
          <div class="fill" part="fill" style={{ width }} />
        </div>
      </Host>
    );
  }
}

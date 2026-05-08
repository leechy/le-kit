import { Component, Element, h, Prop, Watch } from '@stencil/core';

type LeVisibilityState = 'visible' | 'collapsed';
type LeVisibilityPhase = 'stable' | 'transitioning' | 'pre-collapse';
type LeVisibilityMode = 'width' | 'height' | 'both';

/**
 * Internal visibility transition controller.
 *
 * This component controls transition phase + measured size variables.
 *
 * Preferred usage wraps the target content:
 * <le-visibility state="collapsed"><div>...</div></le-visibility>
 *
 * For backward compatibility, when no children are provided it
 * falls back to controlling the parent host element.
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-visibility',
  styleUrl: 'le-visibility.css',
  shadow: false,
})
export class LeVisibility {
  @Element() el!: HTMLElement;

  /** Desired visibility state. */
  @Prop() state: LeVisibilityState = 'visible';

  /** Which dimensions to measure and expose as CSS vars. */
  @Prop() mode: LeVisibilityMode = 'width';

  private target?: HTMLElement;

  private transitionTimer?: number;

  private resizeObserver?: ResizeObserver;

  private clearTimer() {
    if (this.transitionTimer !== undefined) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = undefined;
    }
  }

  private hasOwnContent(): boolean {
    return Array.from(this.el.childNodes).some(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return true;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        return !!node.textContent?.trim();
      }

      return false;
    });
  }

  private getTarget(): HTMLElement | undefined {
    if (this.hasOwnContent()) {
      return this.el;
    }

    const root = this.el.getRootNode();
    if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
      return root.host;
    }
    return this.el.parentElement || undefined;
  }

  private parseDurationToMs(value: string): number {
    const trimmed = (value || '').trim();
    if (!trimmed) return 0;

    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) return 0;

    if (trimmed.endsWith('ms')) return parsed;
    if (trimmed.endsWith('s')) return parsed * 1000;
    return parsed;
  }

  private getVisibilityDurationMs(target: HTMLElement): number {
    const styles = getComputedStyle(target);
    const duration = styles.getPropertyValue('--le-motion-visibility-duration');
    return this.parseDurationToMs(duration);
  }

  private setPhase(target: HTMLElement, phase: LeVisibilityPhase) {
    target.setAttribute('visibility-phase', phase);
  }

  private setVisualState(
    target: HTMLElement,
    state: 'visible' | 'expanding' | 'collapsing' | 'collapsed',
  ) {
    target.setAttribute('visibility-state', state);
  }

  private canMeasure(target: HTMLElement): boolean {
    const phase = target.getAttribute('visibility-phase');
    const state = target.getAttribute('visibility-state');
    return phase !== 'transitioning' && phase !== 'pre-collapse' && (!state || state === 'visible');
  }

  private attachResizeObserver() {
    if (typeof ResizeObserver === 'undefined' || !this.target) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.target && this.canMeasure(this.target)) {
        this.cacheMeasuredSize(this.target);
      }
    });

    this.resizeObserver.observe(this.target);
  }

  private cacheMeasuredSize(target: HTMLElement) {
    if (!this.canMeasure(target)) return;

    const rect = target.getBoundingClientRect();

    if (this.mode === 'width' || this.mode === 'both') {
      if (rect.width > 0.5) {
        target.style.setProperty('--le-visibility-measured-width', `${rect.width}px`);
      }
    }

    if (this.mode === 'height' || this.mode === 'both') {
      if (rect.height > 0.5) {
        target.style.setProperty('--le-visibility-measured-height', `${rect.height}px`);
      }
    }
  }

  private applyState(desired: LeVisibilityState, animate: boolean) {
    const target = this.target;
    if (!target) return;

    this.clearTimer();

    const current =
      (target.getAttribute('visibility-state') as
        | 'visible'
        | 'expanding'
        | 'collapsing'
        | 'collapsed'
        | null) || 'visible';

    if (!animate) {
      this.setVisualState(target, desired);
      this.setPhase(target, 'stable');
      this.cacheMeasuredSize(target);
      return;
    }

    const durationMs = this.getVisibilityDurationMs(target);

    if (desired === 'visible') {
      if (current === 'visible' || current === 'expanding') return;

      this.setPhase(target, 'transitioning');
      this.setVisualState(target, 'expanding');

      if (durationMs <= 0) {
        // Disable transitions before restoring natural width so there is no
        // animation from measured-width back to unconstrained (max-width: none).
        this.setPhase(target, 'stable');
        this.setVisualState(target, 'visible');
        return;
      }

      this.transitionTimer = window.setTimeout(() => {
        if (target.getAttribute('visibility-state') !== 'collapsed') {
          // Disable transitions first, then switch to visible so the
          // removal of max-width (→ natural size) is instant, not animated.
          this.setPhase(target, 'stable');
          this.setVisualState(target, 'visible');
        }
        this.transitionTimer = undefined;
      }, durationMs + 20);

      return;
    }

    if (current === 'collapsed' || current === 'collapsing') return;

    // Re-measure the natural content width while the element is still
    // unconstrained (visible, stable) so the CSS var is up to date.
    this.cacheMeasuredSize(target);

    if (durationMs <= 0) {
      this.setVisualState(target, 'collapsed');
      this.setPhase(target, 'stable');
      return;
    }

    // Phase 1 — snapshot: set max-width to measured-width without transition
    // (transitions are gated on 'transitioning' phase, so this is instant).
    this.setPhase(target, 'pre-collapse');
    void target.offsetWidth; // force reflow so the browser registers the value

    // Phase 2 — animate: enable transitions, then in the next frame trigger
    // the collapsing state so CSS transitions from measured-width → 0.
    this.setPhase(target, 'transitioning');
    requestAnimationFrame(() => {
      if (target.getAttribute('visibility-phase') !== 'transitioning') return;

      this.setVisualState(target, 'collapsing');

      this.transitionTimer = window.setTimeout(() => {
        if (target.getAttribute('visibility-state') === 'collapsing') {
          this.setVisualState(target, 'collapsed');
        }
        this.setPhase(target, 'stable');
        this.transitionTimer = undefined;
      }, durationMs + 20);
    });
  }

  @Watch('state')
  handleStateChange(next: LeVisibilityState) {
    this.applyState(next, true);
  }

  componentWillLoad() {
    this.target = this.getTarget();
    this.applyState(this.state, false);
  }

  componentDidLoad() {
    // getBoundingClientRect() returns 0 in componentWillLoad (not yet painted).
    // Re-measure after first layout so the CSS var is ready before the first transition.
    requestAnimationFrame(() => {
      if (this.target) {
        this.cacheMeasuredSize(this.target);
      }
    });
    // Keep measured-width up to date when children resize in the visible state
    // (e.g. child custom elements that finish upgrading after componentDidLoad).
    this.attachResizeObserver();
  }

  disconnectedCallback() {
    this.clearTimer();
    this.resizeObserver?.disconnect();
  }

  render() {
    return <slot></slot>;
  }
}

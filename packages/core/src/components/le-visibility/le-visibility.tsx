import { Component, Element, h, Prop, Watch } from '@stencil/core';

type LeVisibilityState = 'visible' | 'collapsed';
type LeVisibilityPhase = 'stable' | 'transitioning';
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
    return phase !== 'transitioning' && (!state || state === 'visible');
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
        this.setVisualState(target, 'visible');
        this.setPhase(target, 'stable');
        this.cacheMeasuredSize(target);
        return;
      }

      requestAnimationFrame(() => {
        if (target.getAttribute('visibility-state') === 'expanding') {
          this.setVisualState(target, 'visible');
        }
      });

      this.transitionTimer = window.setTimeout(() => {
        if (target.getAttribute('visibility-state') !== 'collapsed') {
          this.setVisualState(target, 'visible');
        }
        this.setPhase(target, 'stable');
        this.cacheMeasuredSize(target);
        this.transitionTimer = undefined;
      }, durationMs + 20);

      return;
    }

    if (current === 'collapsed' || current === 'collapsing') return;

    this.setPhase(target, 'transitioning');
    this.setVisualState(target, 'collapsing');

    if (durationMs <= 0) {
      this.setVisualState(target, 'collapsed');
      this.setPhase(target, 'stable');
      return;
    }

    this.transitionTimer = window.setTimeout(() => {
      if (target.getAttribute('visibility-state') === 'collapsing') {
        this.setVisualState(target, 'collapsed');
      }
      this.setPhase(target, 'stable');
      this.transitionTimer = undefined;
    }, durationMs + 20);
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
  }

  disconnectedCallback() {
    this.clearTimer();
  }

  render() {
    return <slot></slot>;
  }
}

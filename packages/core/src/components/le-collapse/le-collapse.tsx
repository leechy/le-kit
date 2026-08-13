import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';

export type LeCollapseAnimation = 'fade' | 'collapse' | 'fade-collapse';

/**
 * Animated show/hide wrapper.
 *
 * Supports height collapse (auto->0) and/or fading.
 * Can optionally listen to the nearest `le-header` shrink events.
 *
 * @slot - Content to animate
 *
 * @cssprop --le-collapse-duration - Transition duration
 *
 * @csspart region - Collapsible region
 * @csspart content - Inner content
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-collapse',
  styleUrl: 'le-collapse.css',
  shadow: true,
})
export class LeCollapse {
  @Element() el!: HTMLElement;

  /**
   * Since Stencil boolean props default to `false` when the attribute is missing.
   * instead of `open` defaulting to `true`, using a `closed` prop.
   */
  @Prop({ mutable: true, reflect: true }) closed: boolean = false;

  /** Whether the content should scroll down from the top when open. */
  @Prop({ attribute: 'scroll-down', reflect: true }) scrollDown: boolean = false;

  /** Stop fading the content when collapsing/expanding. */
  @Prop({ attribute: 'no-fading', reflect: true }) noFading: boolean = false;

  /** If true, collapse/expand based on the nearest header shrink event. */
  @Prop({ attribute: 'collapse-on-header-shrink', reflect: true }) collapseOnHeaderShrink: boolean =
    false;

  /**
   * Handles `leHeaderShrinkChange` events from the `le-header`.
   * In case multiple headers are present, only the nearest one in the DOM tree is used.
   */
  @Listen('leHeaderShrinkChange', { target: 'window' })
  handleHeaderShrink(ev: Event) {
    const e = ev as CustomEvent<{ shrunk: boolean }>;
    this.headerShrunk = !!e.detail?.shrunk;
  }

  @State() private headerShrunk: boolean = false;
  @State() private isExpanded: boolean = false;

  componentDidLoad() {
    this.applyOpenState();
    if (this.shouldBeOpen()) {
      this.isExpanded = true;
    }
  }

  @Watch('closed')
  protected onClosedChange() {
    this.applyOpenState();
  }

  @Watch('headerShrunk')
  protected onDrivenStateChange() {
    this.applyOpenState();
  }

  @Listen('transitionend')
  protected handleTransitionEnd(ev: TransitionEvent) {
    if (ev.propertyName === 'grid-template-rows') {
      if (this.shouldBeOpen()) {
        this.isExpanded = true;
      }
    }
  }

  private shouldBeOpen() {
    if (this.closed) return false;
    if (this.collapseOnHeaderShrink && this.headerShrunk) return false;
    return true;
  }

  private applyOpenState() {
    const nextOpen = this.shouldBeOpen();
    this.isExpanded = false;
    this.el.toggleAttribute('data-open', nextOpen);

    if (nextOpen) {
      // Fallback if transition duration is 0s or prefers-reduced-motion is active
      const durationStr = window.getComputedStyle(this.el).transitionDuration;
      const duration = parseFloat(durationStr) * (durationStr.endsWith('ms') ? 1 : 1000);
      if (!duration || duration <= 0) {
        this.isExpanded = true;
      }
    }
  }

  render() {
    const isOpen = this.shouldBeOpen();
    return (
      <Host
        data-open={isOpen ? 'true' : 'false'}
        data-expanded={isOpen && this.isExpanded ? 'true' : 'false'}
      >
        <le-component component="le-collapse">
          <div class={{ 'region': true, 'scroll-down': this.scrollDown }} part="region">
            <slot></slot>
          </div>
        </le-component>
      </Host>
    );
  }
}

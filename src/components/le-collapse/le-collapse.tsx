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
  @Element() el: HTMLElement;

  /** Whether the content should be shown. */
  @Prop({ mutable: true, reflect: true }) open: boolean = true;

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

  componentWillLoad() {
    // Stencil boolean props default to `false` when the attribute is missing.
    // For this component, the desired default is open=true.
    if (!this.el.hasAttribute('open')) {
      this.open = true;
    }
  }

  componentDidLoad() {
    this.applyOpenState();
  }

  @Watch('open')
  protected onOpenChange() {
    this.applyOpenState();
  }

  @Watch('headerShrunk')
  protected onDrivenStateChange() {
    this.applyOpenState();
  }

  private shouldBeOpen() {
    if (!this.open) return false;
    if (this.collapseOnHeaderShrink && this.headerShrunk) return false;
    return true;
  }

  private applyOpenState() {
    const nextOpen = this.shouldBeOpen();
    this.el.toggleAttribute('data-open', nextOpen);
  }

  render() {
    return (
      <Host data-open={this.shouldBeOpen() ? 'true' : 'false'}>
        <le-component component="le-collapse">
          <div class="region" part="region">
            <slot></slot>
          </div>
        </le-component>
      </Host>
    );
  }
}

import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { getAllLatestStates, getLatestState, subscribeState } from '../../utils/state-bus';

export type LeCollapseAnimation = 'fade' | 'collapse' | 'fade-collapse';

/**
 * Animated show/hide wrapper.
 *
 * Supports height collapse (auto->0) and/or fading.
 *
 * It can follow the state another component publishes on the state bus with
 * `closed-when="<event>.<field>"`: it is closed while that field is truthy.
 * - `closed-when="le-header:state.shrunk"` — closed while the header is shrunk;
 * - `closed-when="le-side-panel:state.visible" closed-when-target="recipes"` —
 *   closed while the side panel with id `recipes` is visible, i.e. shows its
 *   content as a replacement when the panel is hidden.
 *
 * The current state is read right away, so it works even when the collapse
 * loads after the source published its state.
 *
 * With `collapsed-size` it closes only partially: down to that height (any CSS length,
 * e.g. `3lh` for three lines), with the cut edge faded out. Set it only when the
 * content is taller: the size also applies while open, so shorter content would be
 * stretched to it.
 *
 * @slot - Content to animate
 *
 * @cssprop --le-collapse-duration - Transition duration
 * @cssprop --le-collapse-fade-size - Height of the fade at the cut edge while partially closed (default: 1lh)
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

  /**
   * Closes partially, down to this height instead of zero: any CSS length, e.g. `3lh`.
   * The content stays visible (no fading) and its cut edge fades out.
   */
  @Prop({ attribute: 'collapsed-size', reflect: true }) collapsedSize?: string;

  /** Whether the content should scroll down from the top when open. */
  @Prop({ attribute: 'scroll-down', reflect: true }) scrollDown: boolean = false;

  /** Stop fading the content when collapsing/expanding. */
  @Prop({ attribute: 'no-fading', reflect: true }) noFading: boolean = false;

  /**
   * Closes the collapse while a field of a state-bus state is truthy:
   * `<event>.<field>`, e.g. `le-header:state.shrunk` or `le-side-panel:state.visible`.
   * The bound state is written to `closed`; until it is known, `closed` keeps its
   * initial value — so `<le-collapse closed closed-when="…">` starts closed.
   */
  @Prop({ attribute: 'closed-when', reflect: true }) closedWhen?: string;

  /**
   * Only follow the state published under this key (the source element's id).
   * Without it, any source of the event is followed.
   */
  @Prop({ attribute: 'closed-when-target', reflect: true }) closedWhenTarget?: string;

  @State() private isExpanded: boolean = true;

  private unsubscribeState?: () => void;

  connectedCallback() {
    this.bindState();
  }

  disconnectedCallback() {
    this.unsubscribeState?.();
    this.unsubscribeState = undefined;
  }

  @Watch('closedWhen')
  @Watch('closedWhenTarget')
  protected onBindingChange() {
    this.bindState();
  }

  /** Splits `<event>.<field>` at the last dot; event names may contain `:` and `-`. */
  private parseClosedWhen(): { event: string; field: string } | undefined {
    const value = this.closedWhen?.trim();
    const dot = value ? value.lastIndexOf('.') : -1;
    if (!value || dot <= 0 || dot === value.length - 1) return undefined;
    return { event: value.slice(0, dot), field: value.slice(dot + 1) };
  }

  private bindState() {
    this.unsubscribeState?.();
    this.unsubscribeState = undefined;

    const binding = this.parseClosedWhen();
    if (!binding) return;

    const target = this.closedWhenTarget?.trim();
    const read = (state: unknown) => !!(state as Record<string, unknown> | undefined)?.[binding.field];

    // Until a state is known, `closed` keeps its initial (authored) value.
    const current = target
      ? getLatestState(binding.event, target)
      : getAllLatestStates(binding.event)[0];
    if (current !== undefined) this.closed = read(current);

    this.unsubscribeState = subscribeState(this.el, binding.event, (state, key) => {
      if (target && key !== target) return;
      this.closed = read(state);
    });
  }

  componentWillLoad() {
    this.isExpanded = this.shouldBeOpen();
  }

  componentDidLoad() {
    if (this.shouldBeOpen()) {
      this.isExpanded = true;
    }
  }

  @Watch('closed')
  protected onClosedChange(newValue?: boolean, oldValue?: boolean) {
    if (oldValue === undefined || newValue === oldValue) {
      if (this.shouldBeOpen()) {
        this.isExpanded = true;
      }
      return;
    }
    this.applyOpenState();
  }

  @Listen('transitionend')
  protected handleTransitionEnd(ev: TransitionEvent) {
    if (ev.target !== this.el) return;
    if (ev.propertyName === 'grid-template-rows' || ev.propertyName === 'opacity') {
      if (this.shouldBeOpen()) {
        this.isExpanded = true;
      }
    }
  }

  private shouldBeOpen() {
    if (this.closed) return false;
    return true;
  }

  private applyOpenState() {
    const nextOpen = this.shouldBeOpen();
    if (!nextOpen) {
      this.isExpanded = false;
      return;
    }

    this.isExpanded = false;

    if (this.el && typeof window !== 'undefined') {
      // Fallback if transition duration is 0s or prefers-reduced-motion is active
      const style = window.getComputedStyle?.(this.el);
      const durationStr = style?.transitionDuration || '';
      const duration = durationStr ? parseFloat(durationStr) * (durationStr.endsWith('ms') ? 1 : 1000) : 0;
      if (!duration || duration <= 0) {
        this.isExpanded = true;
      } else {
        // Safety timeout in case transitionend event does not fire
        setTimeout(() => {
          if (this.shouldBeOpen()) {
            this.isExpanded = true;
          }
        }, duration + 50);
      }
    }
  }

  render() {
    const isOpen = this.shouldBeOpen();
    return (
      <Host
        style={this.collapsedSize ? { '--le-collapse-collapsed-size': this.collapsedSize } : undefined}
        data-open={isOpen ? 'true' : 'false'}
        data-expanded={isOpen && this.isExpanded ? 'true' : 'false'}
      >
        <div class={{ 'region': true, 'scroll-down': this.scrollDown }} part="region">
          <slot></slot>
        </div>
      </Host>
    );
  }
}

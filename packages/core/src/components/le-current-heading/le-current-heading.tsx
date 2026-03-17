import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';

/**
 * Shows a "smart" header title based on what has scrolled out of view.
 *
 * When `selector` matches multiple elements, the title becomes the last element
 * (top-to-bottom) that has fully scrolled out above the viewport.
 *
 * @slot - Optional fallback content if no watched title is active
 *
 * @csspart title - The rendered title
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-current-heading',
  styleUrl: 'le-current-heading.css',
  shadow: true,
})
export class LeCurrentHeading {
  @Element() el: HTMLElement;

  /** CSS selector for page title/headings to watch (e.g. `.page-title`, `main h2`). */
  @Prop({ attribute: 'selector' }) selector: string = '';

  @State() private activeText: string | null = null;

  componentWillLoad() {
    this.updateActiveTitle();
  }

  @Watch('selector')
  protected onSelectorChange() {
    this.updateActiveTitle();
  }

  @Listen('scroll', { target: 'window', passive: true })
  protected onScroll() {
    this.updateActiveTitle();
  }

  @Listen('resize', { target: 'window', passive: true })
  protected onResize() {
    this.updateActiveTitle();
  }

  private updateActiveTitle() {
    if (typeof window === 'undefined') return;
    const selector = (this.selector ?? '').trim();
    if (!selector) {
      this.activeText = null;
      return;
    }

    let elements: Element[] = [];
    try {
      elements = Array.from(document.querySelectorAll(selector));
    } catch {
      this.activeText = null;
      return;
    }

    // Pick the last element that is fully above the viewport.
    let nextText: string | null = null;
    for (const element of elements) {
      const rect = (element as HTMLElement).getBoundingClientRect();
      if (rect.height > 0 && rect.bottom <= 0) {
        const t = (element.textContent ?? '').trim();
        if (t) nextText = t;
      }
    }

    // Do not create oscillations: update only when the computed title changes.
    if (nextText !== this.activeText) {
      this.activeText = nextText;
    }
  }

  render() {
    return (
      <Host>
        {this.activeText ? (
          <span class="title" part="title">
            {this.activeText}
          </span>
        ) : (
          <slot></slot>
        )}
      </Host>
    );
  }
}

import { Component, h, Host, Method, Prop } from '@stencil/core';
import type { LeCollapseMeta } from '../../types/toolbar';

/**
 * Flexible spacer for le-toolbar layouts.
 *
 * Default behavior (no width): occupies available free space and shrinks naturally.
 * With numeric `width`: behaves as a fixed-width spacer that can be collapsed by le-toolbar.
 *
 * @cmsEditable true
 * @cmsCategory Layout
 */
@Component({
  tag: 'le-toolbar-spacer',
  styleUrl: 'le-toolbar-spacer.css',
  shadow: true,
})
export class LeToolbarSpacer {
  /**
   * Optional fixed width.
   * Numeric values (e.g. `24`) are treated as px.
   * String values may be any valid CSS width (e.g. `2rem`, `var(--le-spacing-2)`).
   */
  @Prop() width?: number | string;

  private isValidCssWidth(value: string): boolean {
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      return CSS.supports('width', value);
    }

    if (typeof document !== 'undefined') {
      const probe = document.createElement('div');
      probe.style.width = '';
      probe.style.width = value;
      return probe.style.width !== '';
    }

    // If CSS APIs are unavailable (non-browser contexts), keep authored values.
    return true;
  }

  private getFixedWidthValue(): string | undefined {
    if (this.width === undefined || this.width === null) {
      return undefined;
    }

    const raw = String(this.width).trim();
    if (raw === '') {
      return undefined;
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed >= 0 ? `${parsed}px` : undefined;
    }

    return this.isValidCssWidth(raw) ? raw : undefined;
  }

  private isFixedSpacer(): boolean {
    return this.getFixedWidthValue() !== undefined;
  }

  /**
   * Returns collapse meta for toolbar integration.
   */
  @Method()
  async getCollapseMeta(): Promise<LeCollapseMeta> {
    return {
      kind: 'spacer',
      fixed: this.isFixedSpacer(),
    };
  }

  render() {
    const fixedWidthValue = this.getFixedWidthValue();
    const hostClass = fixedWidthValue !== undefined ? 'spacer-fixed' : 'spacer-flex';
    const spacerStyle =
      fixedWidthValue !== undefined
        ? ({ '--le-toolbar-spacer-width': fixedWidthValue } as { [key: string]: string })
        : undefined;

    return (
      <Host class={hostClass} style={spacerStyle}>
        <span class="spacer" part="spacer" aria-hidden="true"></span>
      </Host>
    );
  }
}

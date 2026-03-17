import { Component, h, Host } from '@stencil/core';

/**
 * Placeholder for `le-header`.
 *
 * Reserves space using the global CSS variable `--le-header-height`.
 * The header component updates that variable when it renders.
 *
 * @cssprop --le-header-height - Published header height (px)
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-header-placeholder',
  shadow: false,
})
export class LeHeaderPlaceholder {
  render() {
    return (
      <Host
        aria-hidden="true"
        style={{
          display: 'block',
          height: 'var(--le-header-height, 64px)',
        }}
      />
    );
  }
}

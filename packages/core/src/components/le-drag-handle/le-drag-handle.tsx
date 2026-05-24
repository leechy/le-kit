import { Component, h, Host, Prop } from '@stencil/core';

export type LeDragHandleOrientation = 'vertical' | 'horizontal';
export type LeDragHandlePlacement = 'start' | 'end';

/**
 * Reusable drag handle used by resizable components.
 *
 * @slot - Optional assistive text for screen readers.
 */
@Component({
  tag: 'le-drag-handle',
  styleUrl: 'le-drag-handle.css',
  shadow: true,
})
export class LeDragHandle {
  /** Handle orientation (vertical = width drag, horizontal = height drag). */
  @Prop({ reflect: true }) orientation: LeDragHandleOrientation = 'vertical';

  /** Handle position on the owning edge. */
  @Prop({ reflect: true }) placement: LeDragHandlePlacement = 'end';

  render() {
    return (
      <Host>
        <span class="assistive">
          <slot />
        </span>
        <span class="grip" part="grip" aria-hidden="true" />
      </Host>
    );
  }
}

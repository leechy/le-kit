import { Component, Element, h, Method, Prop } from '@stencil/core';

/**
 * A segment component used as a child of le-segmented-control.
 *
 * Each le-segment defines both the segment button label and the panel content.
 * The parent le-segmented-control component automatically reads these segments and creates
 * the segmented control interface.
 *
 * @cmsEditable true
 * @cmsCategory Navigation
 */
@Component({
  tag: 'le-segment',
})
export class LeSegment {
  @Element() el: HTMLLeSegmentElement;

  /**
   * The label displayed in the tab button.
   */
  @Prop() label!: string;

  /**
   * The value used to identify this tab.
   * Defaults to the label if not provided.
   */
  @Prop() value?: string;

  /**
   * Icon displayed at the start of the tab button.
   * Can be an emoji, URL, or icon class.
   */
  @Prop() iconStart?: string;

  /**
   * Icon displayed at the end of the tab button.
   */
  @Prop() iconEnd?: string;

  /**
   * Whether this tab is disabled.
   */
  @Prop() disabled: boolean = false;

  /**
   * Get the effective value (value or label as fallback)
   */
  @Method()
  async getValue(): Promise<string> {
    return this.value ?? this.label;
  }

  /**
   * Get tab configuration for parent component
   */
  @Method()
  async getSegmentConfig(): Promise<{
    label: string;
    value: string;
    iconStart?: string;
    iconEnd?: string;
    disabled: boolean;
  }> {
    return {
      label: this.label,
      value: this.value ?? this.label,
      iconStart: this.iconStart,
      iconEnd: this.iconEnd,
      disabled: this.disabled,
    };
  }

  render() {
    return <le-component component="le-segment"></le-component>;
  }
}

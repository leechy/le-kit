import { Component, Prop, h, Element, Event, EventEmitter, Fragment } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible button component with multiple variants and states.
 *
 * @slot - Button text content
 * @slot icon-start - Icon before the text
 * @slot icon-end - Icon after the text
 *
 * @cssprop --le-button-bg - Button background color
 * @cssprop --le-button-color - Button text color
 * @cssprop --le-button-border-radius - Button border radius
 * @cssprop --le-button-padding-x - Button horizontal padding
 * @cssprop --le-button-padding-y - Button vertical padding
 *
 * @csspart button - The native button element
 * @csspart content - The button content wrapper
 *
 * @cmsEditable true
 * @cmsCategory Actions
 */
@Component({
  tag: 'le-button',
  styleUrl: 'le-button.default.css',
  shadow: true,
})
export class LeButton {
  @Element() el: HTMLElement;

  /**
   * Button variant style
   * @allowedValues solid | outlined | clear
   */
  @Prop() variant: 'solid' | 'outlined' | 'clear' = 'solid';

  /**
   * Button color theme (uses theme semantic colors)
   * @allowedValues primary | secondary | success | warning | danger | info
   */
  @Prop() color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';

  /**
   * Button size
   * @allowedValues small | medium | large
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether the button is in a selected/active state
   */
  @Prop() selected: boolean = false;

  /**
   * Whether the button takes full width of its container
   */
  @Prop({ reflect: true }) fullWidth: boolean = false;

  /**
   * Whether the button displays only an icon (square aspect ratio)
   */
  @Prop() iconOnly: boolean = false;

  /**
   * Whether the button is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * The button type attribute
   * @allowedValues button | submit | reset
   */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Optional href to make the button act as a link
   */
  @Prop() href?: string;

  /**
   * Link target when href is set
   */
  @Prop() target?: string;

  /**
   * Emitted when the button is clicked
   */
  @Event() leClick: EventEmitter<MouseEvent>;

  private handleClick = (event: MouseEvent) => {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.leClick.emit(event);
  };

  render() {
    const classes = classnames(`variant-${this.variant}`, `color-${this.color}`, `size-${this.size}`, {
      'selected': this.selected,
      'full-width': this.fullWidth,
      'icon-only': this.iconOnly,
      'disabled': this.disabled,
    });

    const TagType = this.href ? 'a' : 'button';
    const attrs = this.href ? { href: this.href, target: this.target, role: 'button' } : { type: this.type, disabled: this.disabled };

    return (
      <le-component component="le-button" hostClass={classes}>
        <TagType class="button" part="button" {...attrs} onClick={this.handleClick}>
          {this.iconOnly ? (
            <span class="icon-start">
              <slot name="icon-only"></slot>
            </span>
          ) : (
            <Fragment>
              <span class="icon-start">
                <slot name="icon-start"></slot>
              </span>
              <le-slot name="" label="Label" description="Button text" type="text" tag="span" class="content" part="content">
                <slot></slot>
              </le-slot>
              <span class="icon-end">
                <slot name="icon-end"></slot>
              </span>
            </Fragment>
          )}
        </TagType>
      </le-component>
    );
  }
}

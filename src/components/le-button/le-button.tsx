import { Component, Prop, h, Element, Fragment, Event, EventEmitter } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible button component with multiple variants and states.
 *
 * @slot - Button text content
 * @slot icon-only - Icon for icon-only buttons
 *
 * @cssprop --le-button-bg - Button background color
 * @cssprop --le-button-color - Button text color
 * @cssprop --le-button-border-radius - Button border radius
 * @cssprop --le-button-padding-x - Button horizontal padding
 * @cssprop --le-button-padding-y - Button vertical padding
 *
 * @csspart button - The native button element
 * @csspart content - The button content wrapper
 * @csspart icon-start - The start icon slot
 * @csspart icon-end - The end icon slot
 *
 * @cmsEditable true
 * @cmsCategory Actions
 */
@Component({
  tag: 'le-button',
  styleUrl: 'le-button.css',
  shadow: true,
})
export class LeButton {
  @Element() el: HTMLElement;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode: 'default' | 'admin';

  /**
   * Button variant style
   * @allowedValues solid | outlined | clear
   */
  @Prop() variant: 'solid' | 'outlined' | 'clear' | 'system' = 'solid';

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
   * Icon only button image or emoji
   * if this prop is set, the button will render only the icon slot
   */
  @Prop() iconOnly?: string | Node;

  /**
   * Start icon image or emoji
   */
  @Prop() iconStart?: string | Node;

  /**
   * End icon image or emoji
   */
  @Prop() iconEnd?: string | Node;

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
   * Alignment of the button label without the end icon
   * @allowedValues start | center | space-between | end
   */
  @Prop() align: 'start' | 'center' | 'space-between' | 'end' = 'center';

  /**
   * Emitted when the button is clicked.
   * This is a custom event that wraps the native click but ensures the target is the le-button.
   */
  @Event({ eventName: 'click' }) leClick: EventEmitter<PointerEvent>;

  private handleClick = (event: PointerEvent) => {
    // We stop the internal button click from bubbling up
    event.stopPropagation();

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    // And emit our own click event from the host element
    this.leClick.emit(event);
  };

  render() {
    console.log('Button with iconEnd:', this.iconEnd);

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
        <TagType class={classnames('le-button-container', `le-button-align-${this.align}`)} part="button" {...attrs} onClick={this.handleClick}>
          {this.iconOnly !== undefined ? (
            <slot name="icon-only">{typeof this.iconOnly === 'string' ? this.iconOnly : null}</slot>
          ) : (
            <Fragment>
              <span class="le-button-label">
                {this.iconStart && (
                  <span class="icon-start" part="icon-start">
                    {this.iconStart}
                  </span>
                )}
                <le-slot name="" description="Button text" type="text" class="content" part="content">
                  <slot></slot>
                </le-slot>
              </span>
              {this.iconEnd && (
                <span class="icon-end" part="icon-end">
                  {this.iconEnd}
                </span>
              )}
            </Fragment>
          )}
        </TagType>
      </le-component>
    );
  }
}

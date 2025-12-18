import {
  Component,
  Prop,
  h,
  Element,
  Fragment,
  Event,
  EventEmitter,
  Host,
  Method,
} from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A flexible tab component with multiple variants and states.
 *
 * @slot - Tab text content
 * @slot icon-only - Icon for icon-only tabs
 *
 * @cssprop --le-tab-bg - Tab background color
 * @cssprop --le-tab-color - Tab text color
 * @cssprop --le-tab-border-radius - Tab border radius
 * @cssprop --le-tab-padding-x - Tab horizontal padding
 * @cssprop --le-tab-padding-y - Tab vertical padding
 *
 * @csspart button - The native button element
 * @csspart content - The tab content wrapper
 * @csspart icon-start - The start icon slot
 * @csspart icon-end - The end icon slot
 *
 * @cmsEditable true
 * @cmsCategory Actions
 */
@Component({
  tag: 'le-tab',
  styleUrl: 'le-tab.css',
  shadow: true,
})
export class LeTab {
  @Element() el: HTMLElement;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode: 'default' | 'admin';

  /**
   * Label if it is not provided via slot
   */
  @Prop() label?: string;

  /**
   * Value of the tab, defaults to label if not provided
   */
  @Prop() value?: string;

  /**
   * Tab variant style
   * @allowedValues solid | underlined | clear | enclosed | icon-only
   */
  @Prop() variant: 'underlined' | 'solid' | 'pills' | 'enclosed' | 'icon-only' = 'underlined';

  /**
   * Position of the tabs when used within a le-tabs component
   * @allowedValues top | bottom | start | end
   */
  @Prop() position: 'top' | 'bottom' | 'start' | 'end' = 'top';

  /**
   * Tab size
   * @allowedValues small | medium | large
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether the tab can get focus
   * needed for accessibility when used in custom tab implementations
   */
  @Prop() focusable: boolean = true;

  /**
   * Whether the tab is in a selected/active state
   */
  @Prop() selected: boolean = false;

  /**
   * Whether the tab takes full width of its container
   */
  @Prop({ reflect: true }) fullWidth: boolean = false;

  /**
   * Icon only tab image or emoji
   * if this prop is set, the tab will render only the icon slot
   */
  @Prop() icon?: string | Node;

  /**
   * Whether to show the label when in icon-only mode
   */
  @Prop() showLabel: boolean = false;

  /**
   * Start icon image or emoji
   */
  @Prop() iconStart?: string | Node;

  /**
   * End icon image or emoji
   */
  @Prop() iconEnd?: string | Node;

  /**
   * Whether the tab is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * Optional href to make the tab act as a link
   */
  @Prop() href?: string;

  /**
   * Link target when href is set
   */
  @Prop() target?: string;

  /**
   * Alignment of the tab label without the end icon
   * @allowedValues start | center | space-between | end
   */
  @Prop() align: 'start' | 'center' | 'space-between' | 'end' = 'center';

  /**
   * Get tab configuration for parent component
   */
  @Method()
  async getTabConfig(): Promise<{
    label: string;
    value: string;
    icon: string | Node;
    disabled: boolean;
  }> {
    return {
      label: this.label,
      value: this.value ?? this.label,
      icon: this.icon,
      disabled: this.disabled,
    };
  }

  /**
   * Emitted when the tab is clicked.
   * This is a custom event that wraps the native click but ensures the target is the le-tab.
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
    const classes = classnames(
      `variant-${this.variant}`,
      `size-${this.size}`,
      `position-${this.position}`,
      {
        'selected': this.selected,
        'full-width': this.fullWidth,
        'icon-only': this.icon !== undefined,
        'disabled': this.disabled,
      },
    );

    const TagType = this.href ? 'a' : 'button';
    const attrs = this.href
      ? { href: this.href, target: this.target, role: 'button' }
      : { disabled: this.disabled };

    return (
      <Host>
        <le-component component="le-tab">
          <TagType
            class={classnames('le-tab-container', `le-tab-align-${this.align}`, classes)}
            part="button"
            {...attrs}
            onClick={this.handleClick}
            tabIndex={this.focusable ? 0 : -1}
          >
            {this.icon !== undefined ? (
              <div class="icon-only">
                <div class="icon">{this.icon}</div>
                {this.showLabel && <span class="icon-label">{this.label}</span>}
              </div>
            ) : (
              <Fragment>
                <span class="le-tab-label">
                  {this.iconStart && (
                    <span class="icon-start" part="icon-start">
                      {this.iconStart}
                    </span>
                  )}
                  <le-slot
                    name=""
                    description="Tab text"
                    type="text"
                    class="content"
                    part="content"
                  >
                    <slot>{this.label}</slot>
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
      </Host>
    );
  }
}

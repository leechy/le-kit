import {
  Component,
  Prop,
  h,
  Element,
  Fragment,
  Event,
  EventEmitter,
  Host,
  State,
  Method,
} from '@stencil/core';
import { classnames, observeNamedSlotPresence, slotHasContent } from '../../utils/utils';
import type { LeOption } from '../../types/options';

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
  @Element() el!: HTMLElement;

  @State() private hasIconStartSlot: boolean = false;
  @State() private hasIconEndSlot: boolean = false;
  @State() private hasIconOnlySlot: boolean = false;

  private disconnectSlotObserver?: () => void;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode?: 'default' | 'admin';

  /**
   * Button variant style
   * @allowedValues solid | outlined | clear
   */
  @Prop() variant: 'solid' | 'outlined' | 'clear' | 'system' = 'solid';

  /**
   * Button color theme (uses theme semantic colors)
   * @allowedValues primary | secondary | success | warning | danger | info
   */
  @Prop() color:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'transparent' = 'primary';

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
   * Visibility state used by responsive containers to animate show/hide transitions.
   * @allowedValues visible | collapsing | collapsed | expanding
   */
  @Prop({ reflect: true }) visibility: 'visible' | 'collapsing' | 'collapsed' | 'expanding' =
    'visible';

  /**
   * Shape of the button when rendered inside grouped containers.
   * @allowedValues start | middle | end | single
   */
  @Prop({ reflect: true }) groupShape: 'start' | 'middle' | 'end' | 'single' = 'single';

  /**
   * Optional per-instance motion preset override.
   * @allowedValues none | soft | fluid | spring
   */
  @Prop({ reflect: true }) motionPreset?: 'none' | 'soft' | 'fluid' | 'spring';

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
  @Event({ eventName: 'click' }) leClick!: EventEmitter<MouseEvent>;

  private handleClick = (event: MouseEvent) => {
    // We stop the internal button click from bubbling up
    event.stopPropagation();

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    // And emit our own click event from the host element
    this.leClick.emit(event);
  };

  private initSlotObserver() {
    if (this.disconnectSlotObserver) {
      return;
    }

    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['icon-start', 'icon-end', 'icon-only'],
      presence => {
        this.hasIconStartSlot = !!presence['icon-start'];
        this.hasIconEndSlot = !!presence['icon-end'];
        this.hasIconOnlySlot = !!presence['icon-only'];
      },
    );
  }

  componentWillLoad() {
    // Seed slot presence before first render to avoid componentDidLoad state-change warnings.
    this.hasIconStartSlot = slotHasContent(this.el, 'icon-start');
    this.hasIconEndSlot = slotHasContent(this.el, 'icon-end');
    this.hasIconOnlySlot = slotHasContent(this.el, 'icon-only');

    this.initSlotObserver();
  }

  componentDidLoad() {
    // Fallback in case shadow DOM was not ready during componentWillLoad.
    this.initSlotObserver();
  }

  disconnectedCallback() {
    this.disconnectSlotObserver?.();
  }

  @Method()
  async getOption(): Promise<LeOption> {
    const textLabel = Array.from(this.el.childNodes)
      .filter(node => {
        if (!(node instanceof HTMLElement)) return true;
        const slotName = node.getAttribute('slot');
        return !slotName;
      })
      .map(node => node.textContent || '')
      .join('')
      .trim();

    const label =
      textLabel || this.el.getAttribute('aria-label') || this.el.textContent?.trim() || '';
    const id = this.el.id || undefined;

    return {
      id,
      label,
      value: this.el.getAttribute('value') || id || label,
      disabled: this.disabled,
      selected: this.selected,
      iconStart: typeof this.iconStart === 'string' ? this.iconStart : undefined,
      iconEnd: typeof this.iconEnd === 'string' ? this.iconEnd : undefined,
      href: this.href,
      target: this.target,
      color: this.color,
      className: this.el.className || undefined,
      part: this.el.getAttribute('part') || undefined,
    };
  }

  render() {
    const hasIconOnly = this.iconOnly !== undefined || this.hasIconOnlySlot;
    const hasIconStart = this.iconStart !== undefined || this.hasIconStartSlot;
    const hasIconEnd = this.iconEnd !== undefined || this.hasIconEndSlot;
    const visibilityState =
      this.visibility === 'collapsed' || this.visibility === 'collapsing' ? 'collapsed' : 'visible';

    const classes = classnames(
      `variant-${this.variant}`,
      `color-${this.color}`,
      `size-${this.size}`,
      {
        'selected': this.selected,
        'full-width': this.fullWidth,
        'icon-only': hasIconOnly,
        'disabled': this.disabled,
      },
    );

    const TagType = this.href ? 'a' : 'button';
    const attrs = this.href
      ? { href: this.href, target: this.target, role: 'button' }
      : { type: this.type, disabled: this.disabled };

    return (
      <Host class={classes}>
        <le-visibility state={visibilityState} mode="width">
          <le-component component="le-button">
            <TagType
              class={classnames('le-button-container', `le-button-align-${this.align}`)}
              part="button"
              {...attrs}
              onClick={this.handleClick}
            >
              <span class={classnames('icon-only', { 'is-visible': hasIconOnly })} part="icon-only">
                <slot name="icon-only">
                  {typeof this.iconOnly === 'string' ? this.iconOnly : null}
                </slot>
              </span>
              {!hasIconOnly && (
                <Fragment>
                  <span class="le-button-label">
                    <span
                      class={classnames('icon-start', { 'is-visible': hasIconStart })}
                      part="icon-start"
                    >
                      <slot name="icon-start">{this.iconStart}</slot>
                    </span>
                    <le-slot
                      name=""
                      description="Button text"
                      type="text"
                      class="content"
                      part="content"
                    >
                      <slot></slot>
                    </le-slot>
                  </span>
                  <span
                    class={classnames('icon-end', { 'is-visible': hasIconEnd })}
                    part="icon-end"
                  >
                    <slot name="icon-end">{this.iconEnd}</slot>
                  </span>
                </Fragment>
              )}
            </TagType>
          </le-component>
        </le-visibility>
      </Host>
    );
  }
}

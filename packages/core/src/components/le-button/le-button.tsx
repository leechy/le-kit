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
  Watch,
} from '@stencil/core';
import { classnames, observeNamedSlotPresence, slotHasContent } from '../../utils/utils';
import {
  dispatchTriggerAction,
  getAllLatestActionStates,
  getLatestActionState,
  parseListIds,
  subscribeActionState,
} from '../../utils/action-bus';
import type { LeOption } from '../../types/options';
import type { LeCollapseMeta } from '../../types/toolbar';
import { TooltipPlacement } from '../..';

/**
 * A flexible button component with multiple variants and states.
 *
 * Views: mark children of any slot with `view="name"` (or `view="a b"`) and set
 * `view` on the button — only the children of the current view are shown.
 * All views share one place, so the button is as large as its largest view and
 * does not move when the view changes; children without `view` are always shown.
 *
 * @slot - Button text content
 * @slot icon-only - Icon for icon-only buttons
 * @slot icon-start - Icon placed in the beginning of the button
 * @slot icon-end - Icon placed in the end of the button
 *
 * @part button - The native `<button>` (or `<a>` when `href` is set): background, border, padding, focus ring
 * @part icon-start - Wrapper of the start icon
 * @part icon-end - Wrapper of the end icon
 * @part icon-only - Wrapper of the icon of an icon-only button
 *
 * @cssprop --le-button-bg - Fill of solid and filled buttons (and of selected outlined / clear ones); outlined and clear stay transparent
 * @cssprop --le-button-bg-hover - Fill on hover (default: --le-button-bg when it is set, the theme hover color otherwise)
 * @cssprop --le-button-color - Button text color
 * @cssprop --le-button-border-radius - Button border radius
 * @cssprop --le-button-padding-text - Distance from the button edge to the text
 * @cssprop --le-button-padding-icon - Distance from the button edge to an icon on that side
 * @cssprop --le-button-icon-gap - Gap between an icon and the text
 * @cssprop --le-button-padding - Overrides the whole padding box (all sides), e.g. for compact triggers
 * @cssprop --le-button-padding-y - Button vertical padding
 * @cssprop --le-motion-view-duration - Duration of the switch between views
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
  @State() private dynamicLabel?: string;
  /** Slots ('' = default) that have children marked with `view`. */
  @State() private viewSlots: string[] = [];

  private disconnectSlotObserver?: () => void;
  private unsubscribeActionState?: () => void;

  /** List whose action state the button currently reflects; triggers go only to it */
  private activeListId?: string;

  /**
   * Action ID that this button triggers when bound to a list.
   * @category Actions
   */
  @Prop({ reflect: true }) action?: string;

  /**
   * Bound list ID(s) (comma-separated list of IDs).
   * If omitted, inherits bind-list from the nearest parent <le-toolbar>.
   * @category Actions
   */
  @Prop({ attribute: 'bind-list', reflect: true }) bindList?: string;

  /**
   * `admin` turns on CMS editing of the button; `default` is normal use
   * @category CMS
   */
  @Prop({ mutable: true, reflect: true }) mode?: 'default' | 'admin';

  /**
   * Button variant style
   * @allowedValues solid | filled | outlined | clear | system
   * @category Appearance
   */
  @Prop() variant: 'solid' | 'filled' | 'outlined' | 'clear' | 'system' = 'outlined';

  /**
   * Shorthand boolean to render button with solid/filled background (matches <le-icon filled> API).
   * @category Appearance
   */
  @Prop({ reflect: true }) filled: boolean = false;

  /**
   * Button color theme (uses theme semantic colors)
   * @allowedValues primary | secondary | success | warning | danger | info
   * @category Appearance
   */
  @Prop() color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'transparent';

  /**
   * Button size
   * @allowedValues small | medium | large
   * @category Appearance
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether the button is in a selected/active state
   * @category State
   */
  @Prop({ reflect: true, mutable: true }) selected: boolean = false;

  /**
   * The value associated with the button (useful when in a button group)
   * @category Link & form
   */
  @Prop({ reflect: true }) value?: string;

  /**
   * Optional label for the button,
   * used for accessibility and tooltips when the button is icon-only.
   * @category Content
   */
  @Prop() label?: string;

  /**
   * Tooltip text to show on hover
   * @category Content
   */
  @Prop() tooltip?: string;

  /**
   * Tooltip position around the button
   * @allowedValues auto | top | bottom | left | right
   * @category Content
   */
  @Prop() tooltipPosition: TooltipPlacement = 'top';

  /**
   * Whether the button takes full width of its container
   * @category Appearance
   */
  @Prop({ reflect: true }) fullWidth: boolean = false;

  /**
   * Visibility state used by responsive containers to animate show/hide transitions.
   * @allowedValues visible | collapsing | collapsed | expanding
   * @category Set by containers
   */
  @Prop({ reflect: true }) visibility: 'visible' | 'collapsing' | 'collapsed' | 'expanding' =
    'visible';

  /**
   * Shape of the button when rendered inside grouped containers.
   * @allowedValues start | middle | end | single
   * @category Set by containers
   */
  @Prop({ reflect: true }) groupShape: 'start' | 'middle' | 'end' | 'single' = 'single';

  /**
   * Optional per-instance motion preset override. `soft | fluid | spring` also set how
   * the label collapses in a toolbar; `fade | slide | scale | blur` only how views switch.
   * @allowedValues none | soft | fluid | spring | fade | slide | scale | blur
   * @category Motion
   */
  @Prop({ reflect: true }) motionPreset?:
    | 'none'
    | 'soft'
    | 'fluid'
    | 'spring'
    | 'fade'
    | 'slide'
    | 'scale'
    | 'blur';

  /**
   * Icon only button image or emoji
   * if this prop is set, the button will render only the icon slot
   * @category Content
   */
  @Prop() iconOnly?: string | Node;

  /**
   * Start icon image or emoji
   * @category Content
   */
  @Prop() iconStart?: string | Node;

  /**
   * Notification count for shorthand icons.
   * Applies to start icon, or icon-only if set.
   * @category Content
   */
  @Prop() iconCount?: number;

  /**
   * Count specifically for iconStart.
   * @category Content
   */
  @Prop() iconStartCount?: number;

  /**
   * Enables responsive collapse to icon-only when the toolbar applies
   * `collapse="icon"`.
   * @category Toolbar
   */
  @Prop({ reflect: true }) collapsible: boolean = false;

  /**
   * Runtime collapse state controlled by responsive containers.
   * @category Set by containers
   */
  @Prop({ reflect: true }) collapse?: string;

  /**
   * Relative collapse priority offset for toolbar stepping.
   * Higher numbers collapse earlier while keeping the button visible longer.
   * @category Toolbar
   */
  @Prop() collapsePriorityOffset: number = 100;

  /**
   * End icon image or emoji
   * @category Content
   */
  @Prop() iconEnd?: string | Node;

  /**
   * Count specifically for iconEnd.
   * @category Content
   */
  @Prop() iconEndCount?: number;

  /**
   * Count specifically for iconOnly.
   * @category Content
   */
  @Prop() iconOnlyCount?: number;

  /**
   * Whether the button is disabled
   * @category State
   */
  @Prop({ mutable: true, reflect: true }) disabled: boolean = false;

  /**
   * The button type attribute
   * @allowedValues button | submit | reset
   * @category Link & form
   */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Optional href to make the button act as a link
   * @category Link & form
   */
  @Prop() href?: string;

  /**
   * Link target when href is set
   * @category Link & form
   */
  @Prop() target?: string;

  /**
   * Alignment of the button label without the end icon
   * @allowedValues start | center | space-between | end
   * @category Appearance
   */
  @Prop() align: 'start' | 'center' | 'space-between' | 'end' = 'center';

  /**
   * Current view: shows the children marked with this `view` and hides the other
   * marked ones. Without it, the first marked child's view is shown.
   * @category State
   */
  @Prop({ reflect: true }) view?: string;

  /**
   * Size of a button with views in the label: `largest` (default) keeps the size of
   * the largest view, so nothing moves; `current` follows the current view and
   * animates the width when the view changes.
   * @allowedValues largest | current
   * @category State
   */
  @Prop({ attribute: 'view-size', reflect: true }) viewSize: 'largest' | 'current' = 'largest';

  private endMorph?: () => void;

  private viewObserver?: MutationObserver;

  @Watch('view')
  protected onViewChange() {
    if (this.viewSize === 'current') this.morphLabel(() => this.applyView(true));
    else this.applyView(true);
  }

  /**
   * view-size="current": animates the label width from the old view to the new one.
   * Both views keep the width they have at rest during the animation (the leaving
   * one its old width, the entering one its new width), and the wrapper clips them,
   * so the text never re-wraps mid-animation.
   */
  private morphLabel(update: () => void) {
    const wrapper = this.el.shadowRoot?.querySelector<HTMLElement>('.le-button-label-visibility');
    const labelViews = () =>
      Array.from(this.el.children).filter(c => c.hasAttribute('view') && !c.hasAttribute('slot')) as HTMLElement[];
    const value = getComputedStyle(this.el).getPropertyValue('--le-motion-view-duration').trim();
    const duration = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) || 0;

    this.endMorph?.();
    if (!wrapper || duration <= 0 || !labelViews().length) {
      update();
      return;
    }

    const from = wrapper.getBoundingClientRect().width;
    const leaving = labelViews().filter(c => !c.hasAttribute('data-view-off'));
    const leavingWidths = leaving.map(c => c.getBoundingClientRect().width);

    update();

    leaving.forEach((c, i) => {
      if (c.hasAttribute('data-view-off')) c.style.width = `${leavingWidths[i]}px`;
    });
    const entering = labelViews().filter(c => !c.hasAttribute('data-view-off'));
    const to = wrapper.getBoundingClientRect().width;
    entering.forEach(c => (c.style.minWidth = `${c.getBoundingClientRect().width}px`));

    wrapper.setAttribute('data-morphing', '');
    wrapper.style.width = `${from}px`;
    void wrapper.offsetWidth;
    wrapper.style.width = `${to}px`;

    const timer = window.setTimeout(() => this.endMorph?.(), duration + 20);
    this.endMorph = () => {
      window.clearTimeout(timer);
      wrapper.removeAttribute('data-morphing');
      wrapper.style.width = '';
      [...leaving, ...entering].forEach(c => {
        c.style.width = '';
        c.style.minWidth = '';
      });
      this.endMorph = undefined;
    };
  }

  /** Shows the marked children of the current view, hides the rest. */
  private applyView(animate: boolean) {
    const marked = Array.from(this.el.children).filter(child => child.hasAttribute('view'));
    const slots = Array.from(new Set(marked.map(child => child.getAttribute('slot') ?? ''))).sort();
    // JSON, not join(): [''] (views only in the label) must differ from [].
    if (JSON.stringify(slots) !== JSON.stringify(this.viewSlots)) this.viewSlots = slots;
    if (!marked.length) return;

    const current = (this.view ?? marked[0].getAttribute('view') ?? '').split(/\s+/).filter(Boolean);
    for (const child of marked) {
      const on = child.getAttribute('view')!.split(/\s+/).some(name => current.includes(name));
      if (!on) {
        child.setAttribute('data-view-off', '');
      } else if (child.hasAttribute('data-view-off')) {
        if (animate) {
          // Enter from the enter point, not from where the view left.
          child.setAttribute('data-view-enter', '');
          void (child as HTMLElement).offsetWidth;
          child.removeAttribute('data-view-enter');
        }
        child.removeAttribute('data-view-off');
      }
    }
  }

  /** Children added or re-marked later get the right visibility too. */
  private observeViews() {
    if (this.viewObserver || typeof MutationObserver === 'undefined') return;
    this.viewObserver = new MutationObserver(() => this.applyView(false));
    this.viewObserver.observe(this.el, { childList: true, attributes: true, attributeFilter: ['view'], subtree: true });
  }

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

    if (this.action) {
      const hasNativeClick = Boolean((this.el as any).onclick || this.el.hasAttribute('onclick'));
      const hasHref = Boolean(this.href);

      if (hasHref || hasNativeClick) {
        console.warn('[le-button] Button has both "action" and "href"/"onclick". Executing only href/onclick.');
        return;
      }

      dispatchTriggerAction(this.el, {
        action: this.action,
        listIds: this.activeListId ? [this.activeListId] : this.getEffectiveListIds(),
      });
    }
  };

  /**
   * Returns collapse meta for toolbar integration.
   */
  @Method()
  async getCollapseMeta(): Promise<LeCollapseMeta> {
    const hasIconOnly = this.iconOnly !== undefined || this.hasIconOnlySlot;
    const hasIconStart = this.iconStart !== undefined || this.hasIconStartSlot;

    if (this.collapsible && hasIconStart && !hasIconOnly) {
      return {
        kind: 'stepping',
        collapseValues: ['icon'],
        collapsePriorityOffset: this.collapsePriorityOffset,
        managesVisibility: true,
      };
    }

    return {
      kind: 'item',
      managesVisibility: true,
    };
  }

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
    this.applyView(false);
    this.observeViews();
  }

  connectedCallback() {
    this.setupActionStateSubscription();
    // Re-attached after a disconnect: observe the views again.
    this.observeViews();
  }

  componentDidLoad() {
    // Fallback in case shadow DOM was not ready during componentWillLoad.
    this.initSlotObserver();
  }

  disconnectedCallback() {
    this.disconnectSlotObserver?.();
    this.unsubscribeActionState?.();
    this.viewObserver?.disconnect();
    this.viewObserver = undefined;
    this.endMorph?.();
  }

  @Watch('action')
  @Watch('bindList')
  handleActionBindingChange() {
    this.setupActionStateSubscription();
  }

  /**
   * Refreshes the action binding and current enabled/disabled state.
   */
  @Method()
  async refreshActionState(): Promise<void> {
    this.setupActionStateSubscription();
  }

  private applyActionState(detail: import('../../types/list').LeListActionStateDetail) {
    if (!this.action) return;
    const effectiveListIds = this.getEffectiveListIds();
    if (effectiveListIds.length > 0 && !effectiveListIds.includes(detail.listId)) {
      return;
    }

    if (detail.unloaded) {
      if (this.activeListId === detail.listId) {
        this.activeListId = undefined;
      }
      this.disabled = true;
      this.dynamicLabel = undefined;
      return;
    }

    this.activeListId = detail.listId;

    const state = detail.actions[this.action];
    if (state) {
      this.disabled = !state.enabled;
      if (state.label && state.label !== state.action.label) {
        this.dynamicLabel = state.label;
      } else {
        this.dynamicLabel = undefined;
      }
    } else {
      this.disabled = true;
      this.dynamicLabel = undefined;
    }
  }

  private setupActionStateSubscription() {
    this.unsubscribeActionState?.();
    this.activeListId = undefined;
    if (!this.action) return;

    // Apply any current known state immediately
    const effectiveListIds = this.getEffectiveListIds();
    const states = effectiveListIds.length > 0
      ? (effectiveListIds.map(id => getLatestActionState(id)).filter(Boolean) as import('../../types/list').LeListActionStateDetail[])
      : getAllLatestActionStates();

    for (const detail of states) {
      this.applyActionState(detail);
    }

    this.unsubscribeActionState = subscribeActionState(this.el, detail => {
      this.applyActionState(detail);
    });
  }

  private getEffectiveListIds(): string[] {
    if (this.bindList) {
      return parseListIds(this.bindList);
    }
    const toolbar = this.el.closest('le-toolbar') as any;
    if (toolbar?.bindList) {
      return parseListIds(toolbar.bindList);
    }
    return [];
  }

  @Method()
  async getOption(): Promise<LeOption> {
    const label = this.getResolvedLabel() || '';
    const id = this.el.id || undefined;

    // Build iconStart: explicit prop → icon-start slot → icon-only slot
    let iconStart: string | undefined;
    if (typeof this.iconStart === 'string') {
      if (this.iconStart.length <= 2) {
        iconStart = this.iconStart;
      } else {
        // assuming that if the string is longer than 2 characters,
        // it's an icon name rather than an emoji
        iconStart = `<le-icon name="${this.iconStart}"></le-icon>`;
      }
    } else if (this.hasIconStartSlot) {
      const slotEl = this.el.querySelector('[slot="icon-start"]');
      if (slotEl) {
        const clone = slotEl.cloneNode(true) as HTMLElement;
        clone.removeAttribute('slot');
        iconStart = clone.outerHTML;
      }
    } else if (this.iconOnly && typeof this.iconOnly === 'string') {
      if (this.iconOnly.length <= 2) {
        iconStart = this.iconOnly;
      } else {
        // assuming that if the string is longer than 2 characters,
        // it's an icon name rather than an emoji
        iconStart = `<le-icon name="${this.iconOnly}"></le-icon>`;
      }
    } else if (this.hasIconOnlySlot) {
      const slotEl = this.el.querySelector('[slot="icon-only"]');
      if (slotEl) {
        const clone = slotEl.cloneNode(true) as HTMLElement;
        clone.removeAttribute('slot');
        iconStart = clone.outerHTML;
      }
    }

    // Build iconEnd from slot when no explicit prop
    let iconEnd: string | undefined;
    if (typeof this.iconEnd === 'string') {
      iconEnd = this.iconEnd;
    } else if (this.hasIconEndSlot) {
      const slotEl = this.el.querySelector('[slot="icon-end"]');
      if (slotEl) {
        const clone = slotEl.cloneNode(true) as HTMLElement;
        clone.removeAttribute('slot');
        iconEnd = clone.outerHTML;
      }
    }

    return {
      id,
      label,
      value: this.value || id || label,
      disabled: this.disabled,
      selected: this.selected,
      iconStart,
      iconEnd,
      href: this.href,
      target: this.target,
      color: this.color,
      className: this.el.className || undefined,
      part: this.el.getAttribute('part') || undefined,
    };
  }

  private getResolvedLabel(): string | undefined {
    const textLabel = Array.from(this.el.childNodes)
      .filter(node => {
        if (!(node instanceof HTMLElement)) return true;
        const slotName = node.getAttribute('slot');
        return !slotName;
      })
      .map(node => node.textContent || '')
      .join('')
      .trim();

    return (
      this.dynamicLabel ||
      this.label ||
      textLabel ||
      this.el.getAttribute('label') ||
      this.el.getAttribute('aria-label') ||
      this.el.textContent?.trim() ||
      undefined
    );
  }

  render() {
    const hasIconOnly = this.iconOnly !== undefined || this.hasIconOnlySlot;
    const hasIconStart = this.iconStart !== undefined || this.hasIconStartSlot;
    const hasIconEnd = this.iconEnd !== undefined || this.hasIconEndSlot;
    const isCollapsedToIcon =
      this.collapsible && this.collapse === 'icon' && hasIconStart && !hasIconOnly;
    const compactTooltipText = this.getResolvedLabel();
    const isCompactPresentation = hasIconOnly || isCollapsedToIcon;
    const tooltipText = this.tooltip || compactTooltipText || '';
    const shouldRenderTooltip =
      !!this.tooltip || (!!compactTooltipText && (this.collapsible || hasIconOnly));
    const tooltipDisabled = !this.tooltip && !isCompactPresentation;

    const isFilled = this.filled || this.variant === 'filled' || this.variant === 'solid';
    const effectiveVariant = isFilled ? 'solid' : this.variant;

    const classes = classnames(
      `variant-${effectiveVariant}`,
      isFilled ? 'variant-filled' : null,
      this.color ? `color-${this.color}` : null,
      `size-${this.size}`,
      {
        'selected': this.selected,
        'full-width': this.fullWidth,
        'icon-only': hasIconOnly,
        'is-collapsed-icon': isCollapsedToIcon,
        // The side with an icon gets the (smaller) icon padding.
        'has-icon-start': hasIconStart && !hasIconOnly && !isCollapsedToIcon,
        'has-icon-end': hasIconEnd && !hasIconOnly && !isCollapsedToIcon,
        'disabled': this.disabled,
        // Only slots with views become a grid of stacked views.
        'views-label': this.viewSlots.includes(''),
        'views-icon-start': this.viewSlots.includes('icon-start'),
        'views-icon-end': this.viewSlots.includes('icon-end'),
      },
    );

    const TagType = this.href ? 'a' : 'button';
    const attrs = this.href
      ? { href: this.href, target: this.target, role: 'button' }
      : { type: this.type, disabled: this.disabled };

    const onlyCount = this.iconOnlyCount ?? (typeof this.iconOnly === 'string' ? this.iconCount : undefined);
    const startCount = this.iconStartCount ?? (typeof this.iconStart === 'string' ? this.iconCount : undefined);
    const endCount = this.iconEndCount ?? (typeof this.iconEnd === 'string' && !this.iconStart ? this.iconCount : undefined);

    const renderButton = () => (
      <TagType
        class={classnames(
          'le-button-container',
          'le-control-focus',
          `le-button-align-${this.align}`,
        )}
        part="button"
        {...attrs}
        onClick={this.handleClick}
      >
        <span class={classnames('icon-only', { 'is-visible': hasIconOnly })} part="icon-only">
          <slot name="icon-only">
            {typeof this.iconOnly === 'string' ? (
              Array.from(this.iconOnly).length <= 2 ? (
                this.iconOnly
              ) : (
                <le-icon name={this.iconOnly} count={onlyCount}></le-icon>
              )
            ) : null}
          </slot>
        </span>
        {!hasIconOnly && (
          <Fragment>
            <span class="le-button-label">
              <span
                class={classnames('icon-start', {
                  'is-visible': hasIconStart || isCollapsedToIcon,
                })}
                part="icon-start"
              >
                <slot name="icon-start">
                  {typeof this.iconStart === 'string' ? (
                    Array.from(this.iconStart).length <= 2 ? (
                      this.iconStart
                    ) : (
                      <le-icon name={this.iconStart} count={startCount}></le-icon>
                    )
                  ) : this.iconStart}
                </slot>
              </span>
              <le-visibility
                class="le-button-label-visibility content"
                state={isCollapsedToIcon ? 'collapsed' : 'visible'}
              >
                {this.dynamicLabel ? (
                  <span>{this.dynamicLabel}</span>
                ) : (
                  <slot></slot>
                )}
              </le-visibility>
            </span>
            <span
              class={classnames('icon-end', { 'is-visible': hasIconEnd && !isCollapsedToIcon })}
              part="icon-end"
            >
              <slot name="icon-end">
                {typeof this.iconEnd === 'string' ? (
                  Array.from(this.iconEnd).length <= 2 ? (
                    this.iconEnd
                  ) : (
                    <le-icon name={this.iconEnd} count={endCount}></le-icon>
                  )
                ) : this.iconEnd}
              </slot>
            </span>
          </Fragment>
        )}
      </TagType>
    );

    return (
      <Host class={classes}>
        {shouldRenderTooltip ? (
          <le-tooltip
            text={tooltipText}
            placement={this.tooltipPosition}
            disabled={tooltipDisabled}
          >
            {renderButton()}
          </le-tooltip>
        ) : (
          renderButton()
        )}
      </Host>
    );
  }
}

import {
  Component,
  Element,
  Event,
  EventEmitter,
  Host,
  Method,
  Prop,
  State,
  h,
} from '@stencil/core';
import { classnames, observeNamedSlotPresence, slotHasContent } from '../../utils/utils';
import { LeKitMode } from '../../global/app';

type TooltipPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';
type TooltipAlign = 'start' | 'center' | 'end';
type TooltipVariant = 'default' | 'success' | 'danger';

@Component({
  tag: 'le-tooltip',
  styleUrl: 'le-tooltip.css',
  shadow: true,
})
export class LeTooltip {
  @Element() el!: HTMLElement;

  /**
   * The mode of Le Kit.
   */
  @Prop({ mutable: true, reflect: true }) mode: LeKitMode = 'default';

  /**
   * Controls whether the tooltip is open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Tooltip text shown when no custom content slot is provided.
   */
  @Prop() text: string = '';

  /**
   * Preferred tooltip placement relative to trigger.
   */
  @Prop() placement: TooltipPlacement = 'auto';

  /**
   * Alignment along the cross axis for the chosen placement.
   */
  @Prop() align: TooltipAlign = 'center';

  /**
   * Visual variant of tooltip.
   */
  @Prop({ reflect: true }) variant: TooltipVariant = 'default';

  /**
   * Disable tooltip interactions and visibility.
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * Delay in milliseconds before showing the tooltip.
   */
  @Prop() showDelay: number = 500;

  /**
   * Delay in milliseconds before hiding the tooltip after leaving trigger/content.
   */
  @Prop() hideDelay: number = 160;

  /**
   * Distance in pixels between trigger and tooltip.
   */
  @Prop() offset: number = 8;

  /**
   * Max width of the tooltip box.
   */
  @Prop() maxWidth: string = '280px';

  /**
   * Emitted when the tooltip opens.
   */
  @Event() leTooltipOpen?: EventEmitter<void>;

  /**
   * Emitted when the tooltip closes.
   */
  @Event() leTooltipClose?: EventEmitter<void>;

  @State() private hasContentSlot: boolean = false;
  @State() private isPositioned: boolean = false;

  private triggerEl?: HTMLElement;
  private tooltipEl?: HTMLElement;
  private scrollParents: Element[] = [];
  private disconnectSlotObserver?: () => void;

  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private touchPressTimer?: ReturnType<typeof setTimeout>;

  private isPressingTouch: boolean = false;
  private isListeningForDismiss: boolean = false;

  private get supportsPopoverApi(): boolean {
    return typeof (HTMLElement.prototype as any).showPopover === 'function';
  }

  private get hasRenderableContent(): boolean {
    return this.text.trim().length > 0 || this.hasContentSlot;
  }

  componentWillLoad() {
    this.hasContentSlot = slotHasContent(this.el, 'content');
    this.disconnectSlotObserver = observeNamedSlotPresence(this.el, ['content'], presence => {
      this.hasContentSlot = !!presence.content;
    });
  }

  componentDidLoad() {
    this.tooltipEl?.addEventListener('toggle', this.handlePopoverToggle as EventListener);
    document.addEventListener('le-tooltip-will-open', this.handleOtherTooltipOpen);

    if (this.open) {
      this.show();
    }
  }

  disconnectedCallback() {
    this.tooltipEl?.removeEventListener('toggle', this.handlePopoverToggle as EventListener);
    document.removeEventListener('le-tooltip-will-open', this.handleOtherTooltipOpen);
    this.disconnectSlotObserver?.();
    this.removeScrollListeners();
    this.removeDismissListeners();
    this.clearTimers();
  }

  /**
   * Shows the tooltip.
   */
  @Method()
  async show() {
    if (this.disabled || !this.hasRenderableContent) {
      return;
    }

    this.clearTimers();

    document.dispatchEvent(
      new CustomEvent('le-tooltip-will-open', {
        detail: { tooltip: this.el },
      }),
    );

    if (this.supportsPopoverApi) {
      this.tooltipEl?.showPopover();
    } else {
      this.handleOpened();
    }
  }

  /**
   * Hides the tooltip.
   */
  @Method()
  async hide() {
    this.clearTimers();

    if (this.supportsPopoverApi) {
      this.tooltipEl?.hidePopover();
    } else {
      this.handleClosed();
    }
  }

  /**
   * Toggles the tooltip.
   */
  @Method()
  async toggle() {
    if (this.open) {
      await this.hide();
    } else {
      await this.show();
    }
  }

  /**
   * Updates tooltip position manually.
   */
  @Method()
  async updatePosition() {
    this._updatePosition();
  }

  private handleOtherTooltipOpen = (event: Event) => {
    const customEvent = event as CustomEvent;
    const openingTooltip = customEvent.detail?.tooltip as HTMLElement | undefined;

    if (!openingTooltip || openingTooltip === this.el) {
      return;
    }

    if (this.open) {
      this.hide();
    }
  };

  private handlePopoverToggle = (event: ToggleEvent) => {
    if (event.newState === 'open') {
      this.handleOpened();
    } else {
      this.handleClosed();
    }
  };

  private handleOpened() {
    this.open = true;
    this.addDismissListeners();
    this.addScrollListeners();

    requestAnimationFrame(() => {
      this._updatePosition();
    });

    this.leTooltipOpen?.emit();
  }

  private handleClosed() {
    this.open = false;
    this.isPositioned = false;
    this.isPressingTouch = false;
    this.removeDismissListeners();
    this.removeScrollListeners();
    this.leTooltipClose?.emit();
  }

  private clearTimers() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    if (this.touchPressTimer) {
      clearTimeout(this.touchPressTimer);
      this.touchPressTimer = undefined;
    }
  }

  private scheduleShow(delay: number) {
    if (this.disabled || !this.hasRenderableContent) {
      return;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    if (this.open) {
      this._updatePosition();
      return;
    }

    if (this.showTimer) {
      clearTimeout(this.showTimer);
    }

    this.showTimer = setTimeout(
      () => {
        this.show();
      },
      Math.max(0, delay),
    );
  }

  private scheduleHide(delay: number) {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }

    if (!this.open) {
      return;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(
      () => {
        this.hide();
      },
      Math.max(0, delay),
    );
  }

  private addDismissListeners() {
    if (this.isListeningForDismiss) return;

    document.addEventListener('pointerdown', this.handleDocumentPointerDown, true);
    document.addEventListener('keydown', this.handleDocumentKeyDown, true);
    this.isListeningForDismiss = true;
  }

  private removeDismissListeners() {
    if (!this.isListeningForDismiss) return;

    document.removeEventListener('pointerdown', this.handleDocumentPointerDown, true);
    document.removeEventListener('keydown', this.handleDocumentKeyDown, true);
    this.isListeningForDismiss = false;
  }

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (!this.open) return;

    const path = (event.composedPath?.() ?? []) as EventTarget[];
    if (path.includes(this.el)) return;

    this.hide();
  };

  private handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (!this.open || event.key !== 'Escape') return;

    event.preventDefault();
    event.stopPropagation();
    this.hide();
  };

  private getScrollParents(element: Element): Element[] {
    const parents: Element[] = [];
    let parent = element.parentElement;

    while (parent) {
      const style = getComputedStyle(parent);
      const overflow = `${style.overflow}${style.overflowY}${style.overflowX}`;
      if (/(auto|scroll)/.test(overflow)) {
        parents.push(parent);
      }
      parent = parent.parentElement;
    }

    return parents;
  }

  private addScrollListeners() {
    if (!this.triggerEl) return;

    this.scrollParents = this.getScrollParents(this.triggerEl);

    this.scrollParents.forEach(parent => {
      parent.addEventListener('scroll', this.handleViewportChange, { passive: true });
    });

    window.addEventListener('scroll', this.handleViewportChange, { passive: true });
    window.addEventListener('resize', this.handleViewportChange, { passive: true });
  }

  private removeScrollListeners() {
    this.scrollParents.forEach(parent => {
      parent.removeEventListener('scroll', this.handleViewportChange);
    });

    window.removeEventListener('scroll', this.handleViewportChange);
    window.removeEventListener('resize', this.handleViewportChange);
    this.scrollParents = [];
  }

  private handleViewportChange = () => {
    if (this.open) {
      this._updatePosition();
    }
  };

  private handleTriggerPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.scheduleShow(this.showDelay);
  };

  private handleTriggerPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.scheduleHide(this.hideDelay);
  };

  private handleContentPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  };

  private handleContentPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.scheduleHide(this.hideDelay);
  };

  private handleTriggerPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;

    this.isPressingTouch = true;
    this.clearTimers();

    this.touchPressTimer = setTimeout(
      () => {
        if (this.isPressingTouch) {
          this.show();
        }
      },
      Math.max(0, this.showDelay),
    );
  };

  private cancelTouchPress = () => {
    this.isPressingTouch = false;

    if (this.touchPressTimer) {
      clearTimeout(this.touchPressTimer);
      this.touchPressTimer = undefined;
    }
  };

  private handleTriggerPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;

    const wasOpen = this.open;
    this.cancelTouchPress();

    if (wasOpen) {
      this.scheduleHide(this.hideDelay);
    }
  };

  private handleTriggerPointerCancel = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;

    this.cancelTouchPress();
    this.scheduleHide(this.hideDelay);
  };

  private handleTriggerPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    this.cancelTouchPress();
  };

  private handleTriggerFocus = () => {
    this.scheduleShow(this.showDelay);
  };

  private handleTriggerBlur = () => {
    this.scheduleHide(this.hideDelay);
  };

  private pickPlacement(
    requested: TooltipPlacement,
    spaceAbove: number,
    spaceBelow: number,
    spaceLeft: number,
    spaceRight: number,
    tooltipWidth: number,
    tooltipHeight: number,
  ): Exclude<TooltipPlacement, 'auto'> {
    const fits = (placement: Exclude<TooltipPlacement, 'auto'>): boolean => {
      switch (placement) {
        case 'top':
          return spaceAbove >= tooltipHeight + this.offset;
        case 'bottom':
          return spaceBelow >= tooltipHeight + this.offset;
        case 'left':
          return spaceLeft >= tooltipWidth + this.offset;
        case 'right':
          return spaceRight >= tooltipWidth + this.offset;
      }
    };

    const fallbackOrder: Array<Exclude<TooltipPlacement, 'auto'>> = [
      'top',
      'bottom',
      'right',
      'left',
    ];

    if (requested !== 'auto') {
      if (fits(requested)) {
        return requested;
      }

      const opposite: Record<
        Exclude<TooltipPlacement, 'auto'>,
        Exclude<TooltipPlacement, 'auto'>
      > = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
      };

      if (fits(opposite[requested])) {
        return opposite[requested];
      }
    }

    for (const candidate of fallbackOrder) {
      if (fits(candidate)) {
        return candidate;
      }
    }

    const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
    if (maxSpace === spaceAbove) return 'top';
    if (maxSpace === spaceBelow) return 'bottom';
    if (maxSpace === spaceRight) return 'right';
    return 'left';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private _updatePosition() {
    if (!this.triggerEl || !this.tooltipEl) return;

    const triggerRect = this.triggerEl.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportPadding = 8;

    const spaceAbove = triggerRect.top - viewportPadding;
    const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding;
    const spaceLeft = triggerRect.left - viewportPadding;
    const spaceRight = viewportWidth - triggerRect.right - viewportPadding;

    const placement = this.pickPlacement(
      this.placement,
      spaceAbove,
      spaceBelow,
      spaceLeft,
      spaceRight,
      tooltipRect.width,
      tooltipRect.height,
    );

    let top = 0;
    let left = 0;

    if (placement === 'top' || placement === 'bottom') {
      if (this.align === 'start') {
        left = triggerRect.left;
      } else if (this.align === 'end') {
        left = triggerRect.right - tooltipRect.width;
      } else {
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      }

      top =
        placement === 'top'
          ? triggerRect.top - tooltipRect.height - this.offset
          : triggerRect.bottom + this.offset;
    } else {
      if (this.align === 'start') {
        top = triggerRect.top;
      } else if (this.align === 'end') {
        top = triggerRect.bottom - tooltipRect.height;
      } else {
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      }

      left =
        placement === 'left'
          ? triggerRect.left - tooltipRect.width - this.offset
          : triggerRect.right + this.offset;
    }

    const maxLeft = Math.max(viewportPadding, viewportWidth - tooltipRect.width - viewportPadding);
    const maxTop = Math.max(viewportPadding, viewportHeight - tooltipRect.height - viewportPadding);

    left = this.clamp(left, viewportPadding, maxLeft);
    top = this.clamp(top, viewportPadding, maxTop);

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
    this.isPositioned = true;
  }

  render() {
    const tooltipStyles: Record<string, string> = {
      maxWidth: this.maxWidth,
      visibility: this.isPositioned ? 'visible' : 'hidden',
    };

    return (
      <Host>
        <le-component component="le-tooltip">
          <span
            class="le-tooltip-trigger"
            ref={el => (this.triggerEl = el)}
            onPointerEnter={this.handleTriggerPointerEnter}
            onPointerLeave={this.handleTriggerPointerLeave}
            onPointerDown={this.handleTriggerPointerDown}
            onPointerUp={this.handleTriggerPointerUp}
            onPointerCancel={this.handleTriggerPointerCancel}
            onPointerMove={this.handleTriggerPointerMove}
            onFocusin={this.handleTriggerFocus}
            onFocusout={this.handleTriggerBlur}
            part="trigger"
          >
            <slot></slot>
          </span>

          <div
            class={classnames('le-tooltip-content', `le-tooltip-variant-${this.variant}`)}
            popover="manual"
            role="tooltip"
            ref={el => (this.tooltipEl = el)}
            style={tooltipStyles}
            data-fallback-open={this.supportsPopoverApi ? undefined : String(this.open)}
            onPointerEnter={this.handleContentPointerEnter}
            onPointerLeave={this.handleContentPointerLeave}
            part="content"
          >
            <slot name="content">{this.text}</slot>
          </div>
        </le-component>
      </Host>
    );
  }
}

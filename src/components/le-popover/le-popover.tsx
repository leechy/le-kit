import { Component, Prop, Method, Event, EventEmitter, State, h, Element, Host } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A popover component for displaying floating content.
 *
 * Uses the native HTML Popover API for proper layering with dialogs
 * and other top-layer elements. Falls back gracefully in older browsers.
 *
 * @slot - Content to display inside the popover
 * @slot trigger - Element that triggers the popover (optional)
 *
 * @csspart trigger - The popover trigger element
 * @csspart content - The popover content wrapper
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-popover',
  styleUrl: 'le-popover.css',
  shadow: true,
})
export class LePopover {
  @Element() el: HTMLElement;

  /**
   * Mode of the popover should be 'default' for internal use
   */
  @Prop({ mutable: true, reflect: true }) mode: 'default' | 'admin';

  /**
   * Whether the popover is currently open
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Position of the popover relative to its trigger
   */
  @Prop() position: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'bottom';

  /**
   * Alignment of the popover
   */
  @Prop() align: 'start' | 'center' | 'end' = 'start';

  /**
   * Optional title for the popover header
   */
  @Prop() popoverTitle?: string;

  /**
   * Whether to show a close button in the header
   */
  @Prop() showClose: boolean = true;

  /**
   * Whether clicking outside closes the popover
   */
  @Prop() closeOnClickOutside: boolean = true;

  /**
   * Whether pressing Escape closes the popover
   */
  @Prop() closeOnEscape: boolean = true;

  /**
   * Offset from the trigger element (in pixels)
   */
  @Prop() offset: number = 8;

  /**
   * Fixed width for the popover (e.g., '300px', '20rem')
   */
  @Prop() width?: string;

  /**
   * Minimum width for the popover (e.g., '200px', '15rem')
   */
  @Prop() minWidth?: string = '200px';

  /**
   * Maximum width for the popover (e.g., '400px', '25rem')
   */
  @Prop() maxWidth?: string;

  /**
   * Should the popover's trigger take full width of its container
   */
  @Prop() triggerFullWidth: boolean = false;

  /**
   * Emitted when the popover opens
   */
  @Event() lePopoverOpen: EventEmitter<void>;

  /**
   * Emitted when the popover closes
   */
  @Event() lePopoverClose: EventEmitter<void>;

  @State() private isPositioned: boolean = false;

  private triggerEl?: HTMLElement;
  private popoverEl?: HTMLElement;
  private uniqueId: string = `le-popover-${Math.random().toString(36).substr(2, 9)}`;
  private scrollParents: Element[] = [];

  componentDidLoad() {
    // Listen for toggle events from the native popover API
    this.popoverEl?.addEventListener('toggle', this.handlePopoverToggle as EventListener);

    // Listen for other popovers opening to close this one
    document.addEventListener('le-popover-will-open', this.handleOtherPopoverOpen);
  }

  disconnectedCallback() {
    this.popoverEl?.removeEventListener('toggle', this.handlePopoverToggle as EventListener);
    document.removeEventListener('le-popover-will-open', this.handleOtherPopoverOpen);
    this.removeScrollListeners();
  }

  /**
   * Find all scrollable parent elements
   */
  private getScrollParents(element: Element): Element[] {
    const scrollParents: Element[] = [];
    let parent = element.parentElement;

    while (parent) {
      const style = getComputedStyle(parent);
      const overflow = style.overflow + style.overflowY + style.overflowX;
      if (/(auto|scroll)/.test(overflow)) {
        scrollParents.push(parent);
      }
      parent = parent.parentElement;
    }

    // Always include window for page scroll
    return scrollParents;
  }

  /**
   * Add scroll listeners to all scrollable parents
   */
  private addScrollListeners() {
    if (!this.triggerEl) return;

    this.scrollParents = this.getScrollParents(this.triggerEl);

    // Listen to each scroll parent
    this.scrollParents.forEach(parent => {
      parent.addEventListener('scroll', this.handleScroll, { passive: true });
    });

    // Also listen to window scroll and resize
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleScroll, { passive: true });
  }

  /**
   * Remove scroll listeners
   */
  private removeScrollListeners() {
    this.scrollParents.forEach(parent => {
      parent.removeEventListener('scroll', this.handleScroll);
    });
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleScroll);
    this.scrollParents = [];
  }

  private handleScroll = () => {
    if (this.open) {
      this.updatePosition();
    }
  };

  private handlePopoverToggle = (event: ToggleEvent) => {
    if (event.newState === 'open') {
      this.open = true;
      this.addScrollListeners();
      this.updatePosition();
      this.lePopoverOpen.emit();
    } else {
      this.open = false;
      this.isPositioned = false;
      this.removeScrollListeners();
      this.lePopoverClose.emit();
    }
  };

  private handleOtherPopoverOpen = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.popover === this.el) return;

    if (this.open) {
      this.hide();
    }
  };

  /**
   * Opens the popover
   */
  @Method()
  async show() {
    document.dispatchEvent(
      new CustomEvent('le-popover-will-open', {
        detail: { popover: this.el },
      }),
    );

    this.popoverEl?.showPopover();
  }

  /**
   * Closes the popover
   */
  @Method()
  async hide() {
    this.popoverEl?.hidePopover();
  }

  /**
   * Toggles the popover
   */
  @Method()
  async toggle() {
    if (this.open) {
      await this.hide();
    } else {
      await this.show();
    }
  }

  private handleTriggerClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.toggle();
  };

  private updatePosition() {
    if (!this.triggerEl || !this.popoverEl) return;

    const triggerRect = this.triggerEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportPadding = 8;

    let position = this.position;
    let align = this.align;

    // Auto-position logic
    const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;
    const spaceRight = viewportWidth - triggerRect.right - viewportPadding;
    const spaceLeft = triggerRect.left - viewportPadding;

    if (position === 'auto') {
      if (spaceBelow >= popoverRect.height + this.offset) {
        position = 'bottom';
      } else if (spaceAbove >= popoverRect.height + this.offset) {
        position = 'top';
      } else if (spaceRight >= popoverRect.width + this.offset) {
        position = 'right';
      } else if (spaceLeft >= popoverRect.width + this.offset) {
        position = 'left';
      } else {
        const maxSpace = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
        if (maxSpace === spaceBelow) position = 'bottom';
        else if (maxSpace === spaceAbove) position = 'top';
        else if (maxSpace === spaceRight) position = 'right';
        else position = 'left';
      }
    }

    // Adjust alignment for horizontal overflow
    if (position === 'top' || position === 'bottom') {
      if (align === 'start' && triggerRect.left + popoverRect.width > viewportWidth - viewportPadding) {
        align = 'end';
      } else if (align === 'end' && triggerRect.right - popoverRect.width < viewportPadding) {
        align = 'start';
      } else if (align === 'center') {
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        if (triggerCenter - popoverRect.width / 2 < viewportPadding) {
          align = 'start';
        } else if (triggerCenter + popoverRect.width / 2 > viewportWidth - viewportPadding) {
          align = 'end';
        }
      }
    }

    // Calculate position
    let top: number = 0;
    let left: number = 0;
    let maxHeight: number | null = null;

    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - this.offset;
        if (top < viewportPadding) {
          maxHeight = triggerRect.top - this.offset - viewportPadding * 2;
          top = viewportPadding;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + this.offset;
        if (top + popoverRect.height > viewportHeight - viewportPadding) {
          maxHeight = viewportHeight - top - viewportPadding;
        }
        break;
      case 'left':
        left = triggerRect.left - popoverRect.width - this.offset;
        top = triggerRect.top;
        if (left < viewportPadding) left = viewportPadding;
        break;
      case 'right':
        left = triggerRect.right + this.offset;
        top = triggerRect.top;
        if (left + popoverRect.width > viewportWidth - viewportPadding) {
          left = viewportWidth - popoverRect.width - viewportPadding;
        }
        break;
    }

    // Calculate horizontal alignment for top/bottom
    if (position === 'top' || position === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - popoverRect.width;
          break;
      }

      // Constrain to viewport
      if (left < viewportPadding) {
        left = viewportPadding;
      } else if (left + popoverRect.width > viewportWidth - viewportPadding) {
        left = viewportWidth - popoverRect.width - viewportPadding;
      }
    }

    // Calculate vertical alignment for left/right
    if (position === 'left' || position === 'right') {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - popoverRect.height;
          break;
      }

      if (top < viewportPadding) top = viewportPadding;
      if (top + popoverRect.height > viewportHeight - viewportPadding) {
        maxHeight = viewportHeight - top - viewportPadding;
      }
    }

    // Apply styles
    this.popoverEl.style.top = `${top}px`;
    this.popoverEl.style.left = `${left}px`;

    if (maxHeight !== null && maxHeight > 100) {
      this.popoverEl.style.maxHeight = `${maxHeight}px`;
      this.popoverEl.style.overflowY = 'auto';
    } else {
      this.popoverEl.style.maxHeight = '';
      this.popoverEl.style.overflowY = '';
    }

    this.isPositioned = true;
  }

  render() {
    const popoverStyles: Record<string, string> = {
      visibility: this.isPositioned ? 'visible' : 'hidden',
    };

    if (this.width) popoverStyles.width = this.width;
    if (this.minWidth) popoverStyles.minWidth = this.minWidth;
    if (this.maxWidth) popoverStyles.maxWidth = this.maxWidth;

    return (
      <Host trigger-full-width={this.triggerFullWidth}>
        <div
          class={classnames('le-popover-trigger', {
            'le-popover-trigger-full-width': this.triggerFullWidth,
          })}
          ref={el => (this.triggerEl = el)}
          onClick={this.handleTriggerClick}
          part="trigger"
        >
          <slot name="trigger">
            <button type="button" class="le-popover-default-trigger">
              <span>⊕</span>
            </button>
          </slot>
        </div>
        <div id={this.uniqueId} class="le-popover-content" popover={this.closeOnClickOutside ? 'auto' : 'manual'} ref={el => (this.popoverEl = el)} style={popoverStyles}>
          {(this.popoverTitle || this.showClose) && (
            <div class="le-popover-header">
              {this.popoverTitle && <span class="le-popover-title">{this.popoverTitle}</span>}
              {this.showClose && (
                <button type="button" class="le-popover-close" onClick={() => this.hide()} aria-label="Close">
                  ×
                </button>
              )}
            </div>
          )}
          <div class="le-popover-body" part="content">
            <slot></slot>
          </div>
        </div>
      </Host>
    );
  }
}

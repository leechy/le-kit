import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  Watch,
  h,
  Host,
} from '@stencil/core';
import type { LeOption } from '../../types/options';
import { parseOptionInput } from '../../utils/utils';
import type { LeNavigationItemSelectDetail } from '../le-navigation/le-navigation';

export interface LeContextMenuSelectDetail {
  id: string;
  item: LeOption;
  originalEvent: MouseEvent | KeyboardEvent;
}

/**
 * Context menu component that displays a vertical navigation menu
 * when the user right-clicks or long-presses on its children.
 *
 * @slot - Trigger content
 */
@Component({
  tag: 'le-context-menu',
  styleUrl: 'le-context-menu.css',
  shadow: true,
})
export class LeContextMenu {
  @Element() el!: HTMLElement;

  private popoverEl?: HTMLLePopoverElement;
  private navigationEl?: HTMLLeNavigationElement;
  private containerEl?: HTMLElement;
  private activeTriggerEl?: HTMLElement;

  private touchTimeout?: any;
  private startX = 0;
  private startY = 0;
  private isLongPressActive = false;
  private readonly LONG_PRESS_DURATION = 500; // ms
  private readonly MOVE_THRESHOLD = 10; // px

  private initialTriggerRect?: DOMRect;
  private initialCoords = { x: 0, y: 0 };
  private isMenuOpen = false;

  /**
   * Whether the context menu is open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Disables right-click and touch interactions.
   */
  @Prop() disabled: boolean = false;

  /**
   * List of menu items represented as options.
   */
  @Prop() items: LeOption[] | string = [];

  /**
   * Whether to show a backdrop behind the menu, lifting the active item.
   */
  @Prop() backdrop: boolean = false;

  /**
   * Behavior of the menu on page scroll:
   * - 'blocked': blocks page scroll
   * - 'menu-close': closes the menu automatically on scroll
   * - 'fixed-menu': menu scrolls with the page (default)
   */
  @Prop() pageScrollBehavior: 'blocked' | 'menu-close' | 'fixed-menu' = 'fixed-menu';

  /**
   * Position of the menu relative to the trigger.
   * If 'mouse', positions next to mouse/touch coords.
   */
  @Prop() position: 'top' | 'bottom' | 'left' | 'right' | 'mouse' = 'mouse';

  /**
   * Alignment of the menu relative to the trigger.
   */
  @Prop() align: 'start' | 'center' | 'end' = 'start';

  @State() private coords = { x: 0, y: 0 };
  @State() private lastTriggerType: 'mouse' | 'touch' = 'mouse';

  /**
   * Emitted when a menu item is selected.
   */
  @Event({ cancelable: true })
  leContextMenuSelect!: EventEmitter<LeContextMenuSelectDetail>;

  /**
   * Emitted when the context menu is closed.
   */
  @Event() leContextMenuClose!: EventEmitter<void>;

  @Watch('open')
  handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const triggerEl = this.activeTriggerEl || this.containerEl;
      if (triggerEl) {
        this.initialTriggerRect = triggerEl.getBoundingClientRect();
      }
      this.initialCoords = { ...this.coords };

      if (this.backdrop && this.activeTriggerEl) {
        this.activeTriggerEl.classList.add('le-context-menu-active-item');
      }
    } else {
      this.initialTriggerRect = undefined;
      const el = this.activeTriggerEl;
      if (el) {
        if (this.backdrop) {
          // Remove class after transition completes
          setTimeout(() => {
            el.classList.remove('le-context-menu-active-item');
          }, 250);
        }
        this.activeTriggerEl = undefined;
      }
    }
  }

  componentDidUpdate() {
    if (this.isMenuOpen) {
      void this.popoverEl?.updatePosition();
    }
  }

  disconnectedCallback() {
    this.removeScrollListener();
  }

  @Method()
  async show(x?: number, y?: number) {
    if (this.disabled) return;
    if (x !== undefined && y !== undefined) {
      this.coords = { x, y };
      this.lastTriggerType = 'mouse';
    } else {
      if (this.containerEl) {
        const rect = this.containerEl.getBoundingClientRect();
        this.coords = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      this.lastTriggerType = 'touch';
    }
    this.open = true;

    requestAnimationFrame(() => {
      void this.popoverEl?.updatePosition();
      void this.navigationEl?.focusActiveItem();
    });
  }

  @Method()
  async hide() {
    this.open = false;
  }

  @Method()
  async toggle(x?: number, y?: number) {
    if (this.open) {
      await this.hide();
    } else {
      await this.show(x, y);
    }
  }

  private parseItems(input: LeOption[] | string): LeOption[] {
    return parseOptionInput(input, 'le-context-menu', 'items');
  }

  private handlePopoverOpen = () => {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;

    if (this.pageScrollBehavior === 'blocked') {
      document.body.style.overflow = 'hidden';
    }

    this.addScrollListener();

    requestAnimationFrame(() => {
      void this.navigationEl?.focusActiveItem();
    });
  };

  private handlePopoverClose = () => {
    if (!this.isMenuOpen) return;
    this.isMenuOpen = false;
    this.open = false;

    if (this.pageScrollBehavior === 'blocked') {
      document.body.style.overflow = '';
    }

    this.removeScrollListener();

    this.leContextMenuClose.emit();
  };

  private handleScroll = () => {
    if (!this.isMenuOpen) return;

    if (this.pageScrollBehavior === 'menu-close') {
      void this.hide();
    } else if (this.pageScrollBehavior === 'fixed-menu') {
      this.updateCoordsOnScroll();
    }
  };

  private updateCoordsOnScroll() {
    if (!this.isMenuOpen) return;

    const triggerEl = this.activeTriggerEl || this.containerEl;
    const isTouch = this.lastTriggerType === 'touch';
    const useElementBox = this.position !== 'mouse' || isTouch;

    let x = this.coords.x;
    let y = this.coords.y;
    let width = 0;
    let height = 0;

    if (useElementBox && triggerEl && this.initialTriggerRect) {
      const currentRect = triggerEl.getBoundingClientRect();
      x = currentRect.left;
      y = currentRect.top;
      width = currentRect.width;
      height = currentRect.height;
    } else if (this.initialTriggerRect && triggerEl) {
      const currentRect = triggerEl.getBoundingClientRect();
      const dx = currentRect.left - this.initialTriggerRect.left;
      const dy = currentRect.top - this.initialTriggerRect.top;
      x = this.initialCoords.x + dx;
      y = this.initialCoords.y + dy;
    }

    // Direct DOM manipulation to avoid Stencil render cycle on scroll and ensure synchronous layout updates
    if (this.popoverEl) {
      this.popoverEl.style.left = `${x}px`;
      this.popoverEl.style.top = `${y}px`;
      this.popoverEl.style.width = `${width}px`;
      this.popoverEl.style.height = `${height}px`;
    }

    void this.popoverEl?.updatePosition();
  }

  private addScrollListener() {
    window.addEventListener('scroll', this.handleScroll, true);
  }

  private removeScrollListener() {
    window.removeEventListener('scroll', this.handleScroll, true);
  }

  private triggerMenu(x: number, y: number, event: MouseEvent | TouchEvent) {
    let target = event.target as HTMLElement;
    while (target && target.parentElement !== this.el && target !== this.el) {
      target = target.parentElement as HTMLElement;
    }

    if (target && target !== this.el) {
      this.activeTriggerEl = target;
    }

    this.lastTriggerType = event.type.startsWith('touch') ? 'touch' : 'mouse';
    this.coords = { x, y };
    this.open = true;

    requestAnimationFrame(() => {
      void this.popoverEl?.updatePosition();
      void this.navigationEl?.focusActiveItem();
    });
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (this.disabled) return;
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.isLongPressActive = false;

    this.clearTouchTimeout();

    this.touchTimeout = setTimeout(() => {
      this.isLongPressActive = true;
      this.triggerMenu(touch.clientX, touch.clientY, e);
    }, this.LONG_PRESS_DURATION);
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.touchTimeout) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;

    if (Math.hypot(dx, dy) > this.MOVE_THRESHOLD) {
      this.clearTouchTimeout();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    this.clearTouchTimeout();
    if (this.isLongPressActive) {
      e.preventDefault();
      setTimeout(() => {
        this.isLongPressActive = false;
      }, 100);
    }
  };

  private clearTouchTimeout() {
    if (this.touchTimeout) {
      clearTimeout(this.touchTimeout);
      this.touchTimeout = undefined;
    }
  }

  private handleContextMenu = (e: MouseEvent) => {
    if (this.disabled) return;
    e.preventDefault();

    if (this.isLongPressActive) {
      return;
    }

    this.triggerMenu(e.clientX, e.clientY, e);
  };

  private handleNavigationSelect = (event: CustomEvent<LeNavigationItemSelectDetail>) => {
    const { item, id, originalEvent } = event.detail;

    originalEvent.stopPropagation();

    if (item.disabled) return;

    if (!item.href && !item.action && (item.children?.length || 0) > 0) {
      return;
    }

    const emitted = this.leContextMenuSelect.emit({
      id: item.id || id,
      item,
      originalEvent,
    });

    if (!emitted.defaultPrevented) {
      this.open = false;
    }
  };

  render() {
    const parsedItems = this.parseItems(this.items);

    const triggerEl = this.activeTriggerEl || this.containerEl;
    const isTouch = this.lastTriggerType === 'touch';
    const useElementBox = this.position !== 'mouse' || isTouch;

    let x = this.coords.x;
    let y = this.coords.y;
    let width = 0;
    let height = 0;

    if (useElementBox && triggerEl && this.initialTriggerRect) {
      const currentRect = triggerEl.getBoundingClientRect();
      x = currentRect.left;
      y = currentRect.top;
      width = currentRect.width;
      height = currentRect.height;
    } else if (this.initialTriggerRect && triggerEl) {
      const currentRect = triggerEl.getBoundingClientRect();
      const dx = currentRect.left - this.initialTriggerRect.left;
      const dy = currentRect.top - this.initialTriggerRect.top;
      x = this.initialCoords.x + dx;
      y = this.initialCoords.y + dy;
    }

    const popoverPosition = this.position === 'mouse' ? (isTouch ? 'bottom' : 'auto') : this.position;
    const popoverAlign = this.position === 'mouse' ? (isTouch ? 'center' : 'start') : this.align;

    return (
      <Host
        has-backdrop={this.backdrop ? 'true' : undefined}
      >
        <div
          ref={el => (this.containerEl = el)}
          class="context-menu-trigger-zone"
          onContextMenu={this.handleContextMenu}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
          onTouchEnd={this.handleTouchEnd}
        >
          <slot />
        </div>

        {this.backdrop && (
          <div
            class="le-context-menu-backdrop"
            onClick={() => this.hide()}
          />
        )}

        <le-popover
          ref={el => (this.popoverEl = el)}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
          open={this.open}
          position={popoverPosition}
          align={popoverAlign}
          showClose={false}
          closeOnClickOutside={true}
          closeOnEscape={true}
          minWidth="160px"
          onLePopoverOpen={this.handlePopoverOpen}
          onLePopoverClose={this.handlePopoverClose}
        >
          <div slot="trigger" style={{ display: 'none' }} />
          {parsedItems.length > 0 && (
            <le-navigation
              ref={el => (this.navigationEl = el)}
              orientation="vertical"
              toggle-position="end"
              items={parsedItems}
              onLeNavItemSelect={this.handleNavigationSelect}
            />
          )}
        </le-popover>
      </Host>
    );
  }
}

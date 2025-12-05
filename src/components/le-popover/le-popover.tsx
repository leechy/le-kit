import { Component, Prop, Method, Event, EventEmitter, h, Element } from '@stencil/core';
import { classnames } from '../../utils/utils';

/**
 * A popover component for displaying floating content.
 * 
 * This component is used internally by le-slot for property editing
 * and component selection. It always renders in default mode regardless
 * of the global mode setting.
 *
 * @slot - Content to display inside the popover
 * @slot trigger - Element that triggers the popover (optional)
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
   * Emitted when the popover opens
   */
  @Event() lePopoverOpen: EventEmitter<void>;

  /**
   * Emitted when the popover closes
   */
  @Event() lePopoverClose: EventEmitter<void>;

  private triggerEl?: HTMLElement;
  private popoverEl?: HTMLElement;

  componentDidLoad() {
    if (this.closeOnClickOutside) {
      document.addEventListener('click', this.handleDocumentClick);
    }
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Opens the popover
   */
  @Method()
  async show() {
    this.open = true;
    // Position update is deferred to componentDidRender
    this.lePopoverOpen.emit();
  }

  componentDidRender() {
    // Update position after render when popoverEl is available
    if (this.open && this.popoverEl) {
      this.updatePosition();
    }
  }

  /**
   * Closes the popover
   */
  @Method()
  async hide() {
    this.open = false;
    this.lePopoverClose.emit();
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

  private handleDocumentClick = (event: MouseEvent) => {
    if (!this.open) return;
    
    const path = event.composedPath();
    if (!path.includes(this.el)) {
      this.hide();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.open) return;
    
    if (event.key === 'Escape') {
      this.hide();
    }
  };

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

    let position = this.position;
    let align = this.align;
    
    // Auto-position: choose best position based on available space
    if (position === 'auto') {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const spaceRight = viewportWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      if (spaceBelow >= popoverRect.height + this.offset) {
        position = 'bottom';
      } else if (spaceAbove >= popoverRect.height + this.offset) {
        position = 'top';
      } else if (spaceRight >= popoverRect.width + this.offset) {
        position = 'right';
      } else if (spaceLeft >= popoverRect.width + this.offset) {
        position = 'left';
      } else {
        position = 'bottom'; // fallback
      }
    }

    // For top/bottom positions, check if popover would overflow horizontally
    // and adjust alignment accordingly
    if (position === 'top' || position === 'bottom') {
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      
      // Check if start alignment would overflow right
      if (align === 'start' && triggerRect.left + popoverRect.width > viewportWidth) {
        align = 'end'; // Switch to end alignment
      }
      // Check if end alignment would overflow left  
      else if (align === 'end' && triggerRect.right - popoverRect.width < 0) {
        align = 'start'; // Switch to start alignment
      }
      // Check if center alignment would overflow either side
      else if (align === 'center') {
        if (triggerCenter - popoverRect.width / 2 < 0) {
          align = 'start';
        } else if (triggerCenter + popoverRect.width / 2 > viewportWidth) {
          align = 'end';
        }
      }
    }

    // For left/right positions, check vertical overflow
    if (position === 'left' || position === 'right') {
      const triggerCenter = triggerRect.top + triggerRect.height / 2;
      
      if (align === 'start' && triggerRect.top + popoverRect.height > viewportHeight) {
        align = 'end';
      } else if (align === 'end' && triggerRect.bottom - popoverRect.height < 0) {
        align = 'start';
      } else if (align === 'center') {
        if (triggerCenter - popoverRect.height / 2 < 0) {
          align = 'start';
        } else if (triggerCenter + popoverRect.height / 2 > viewportHeight) {
          align = 'end';
        }
      }
    }

    const styles: { [key: string]: string } = {};

    // Calculate position based on direction
    switch (position) {
      case 'top':
        styles.bottom = `${triggerRect.height + this.offset}px`;
        styles.top = 'auto';
        break;
      case 'bottom':
        styles.top = `${triggerRect.height + this.offset}px`;
        styles.bottom = 'auto';
        break;
      case 'left':
        styles.right = `${triggerRect.width + this.offset}px`;
        styles.left = 'auto';
        break;
      case 'right':
        styles.left = `${triggerRect.width + this.offset}px`;
        styles.right = 'auto';
        break;
    }

    // Calculate alignment with viewport-aware adjustments
    if (position === 'top' || position === 'bottom') {
      switch (align) {
        case 'start':
          styles.left = '0';
          break;
        case 'center':
          styles.left = '50%';
          styles.transform = 'translateX(-50%)';
          break;
        case 'end':
          styles.right = '0';
          styles.left = 'auto';
          break;
      }
    } else {
      switch (align) {
        case 'start':
          styles.top = '0';
          break;
        case 'center':
          styles.top = '50%';
          styles.transform = 'translateY(-50%)';
          break;
        case 'end':
          styles.bottom = '0';
          styles.top = 'auto';
          break;
      }
    }

    // Apply styles directly to the element to avoid re-render loops
    Object.assign(this.popoverEl.style, styles);
    
    // Make visible after positioning (prevents visual jump)
    this.popoverEl.style.visibility = 'visible';
  }

  render() {
    return (
      <le-component component="le-popover" hostClass={classnames({ 'is-open': this.open })}>
        <div 
          class="le-popover-trigger" 
          ref={(el) => (this.triggerEl = el)}
          onClick={this.handleTriggerClick}
        >
          <le-slot name="trigger" label="Trigger">
            <slot name="trigger">
              <button type="button" class="le-popover-default-trigger">
                ⚙️
              </button>
            </slot>
          </le-slot>
        </div>

        {this.open && (
          <div 
            class="le-popover-content"
            ref={(el) => (this.popoverEl = el)}
            style={{ visibility: 'hidden' }}
          >
            {(this.popoverTitle || this.showClose) && (
              <div class="le-popover-header">
                {this.popoverTitle && (
                  <span class="le-popover-title">{this.popoverTitle}</span>
                )}
                {this.showClose && (
                  <button 
                    type="button" 
                    class="le-popover-close"
                    onClick={() => this.hide()}
                    aria-label="Close"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <div class="le-popover-body">
              <le-slot label="Content">
                <slot></slot>
              </le-slot>
            </div>
          </div>
        )}
      </le-component>
    );
  }
}

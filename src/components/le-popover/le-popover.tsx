import { Component, Prop, Method, Event, EventEmitter, h, Element } from '@stencil/core';
import { classnames } from '../../utils/utils';

// Portal container ID
const PORTAL_CONTAINER_ID = 'le-popover-portal';

/**
 * Get or create the portal container at document body level.
 * Styles are loaded globally via le-popover.portal.css imported in themes/index.css
 */
function getPortalContainer(): HTMLElement {
  let container = document.getElementById(PORTAL_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = PORTAL_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

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
   * Fixed width for the popover (e.g., '300px', '20rem')
   * If set, overrides minWidth and maxWidth
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
   * Emitted when the popover opens
   */
  @Event() lePopoverOpen: EventEmitter<void>;

  /**
   * Emitted when the popover closes
   */
  @Event() lePopoverClose: EventEmitter<void>;

  private triggerEl?: HTMLElement;
  private popoverEl?: HTMLElement;
  private portalEl?: HTMLElement;
  private bodyEl?: HTMLElement;
  private movedNodes: { node: Node; originalParent: Node; originalNextSibling: Node | null }[] = [];

  componentDidLoad() {
    if (this.closeOnClickOutside) {
      document.addEventListener('click', this.handleDocumentClick);
    }
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.handleKeyDown);
    }
    // Listen for other popovers opening to close this one
    document.addEventListener('le-popover-will-open', this.handleOtherPopoverOpen);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('le-popover-will-open', this.handleOtherPopoverOpen);
    // Clean up portal on disconnect
    this.destroyPortal();
  }

  /**
   * Handle when another popover is about to open - close this one
   */
  private handleOtherPopoverOpen = (event: Event) => {
    const customEvent = event as CustomEvent;
    // Don't close if the event is from this popover
    if (customEvent.detail?.popover === this.el) return;
    
    // Close this popover if it's open
    if (this.open) {
      this.hide();
    }
  };

  /**
   * Opens the popover
   */
  @Method()
  async show() {
    // Dispatch event to close other popovers before opening
    document.dispatchEvent(new CustomEvent('le-popover-will-open', {
      detail: { popover: this.el }
    }));
    
    this.open = true;
    this.createPortal();
    this.lePopoverOpen.emit();
  }

  componentDidRender() {
    // Update position after render when portal is available
    if (this.open && this.portalEl) {
      this.updatePosition();
    }
  }

  /**
   * Closes the popover
   */
  @Method()
  async hide() {
    this.open = false;
    this.destroyPortal();
    this.lePopoverClose.emit();
  }

  /**
   * Create the portal element and render popover content into it
   */
  private createPortal() {
    if (this.portalEl) return; // Already created

    const container = getPortalContainer();
    
    // Create the portal wrapper - use absolute positioning
    this.portalEl = document.createElement('div');
    this.portalEl.className = 'le-popover-portal';
    this.portalEl.setAttribute('mode', 'default');
    this.portalEl.style.visibility = 'hidden';
    
    // Create popover content structure
    const content = document.createElement('div');
    content.className = 'le-popover-content le-popover-portal-content';
    
    // Apply width styles
    if (this.width) {
      content.style.width = this.width;
    }
    if (this.minWidth) {
      content.style.minWidth = this.minWidth;
    }
    if (this.maxWidth) {
      content.style.maxWidth = this.maxWidth;
    }
    
    // Add header if needed
    if (this.popoverTitle || this.showClose) {
      const header = document.createElement('div');
      header.className = 'le-popover-header';
      
      if (this.popoverTitle) {
        const title = document.createElement('span');
        title.className = 'le-popover-title';
        title.textContent = this.popoverTitle;
        header.appendChild(title);
      }
      
      if (this.showClose) {
        const closeBtn = document.createElement('le-button');
        closeBtn.type = 'button';
        closeBtn.className = 'le-popover-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.variant = 'system';
        closeBtn.iconOnly = true;
        closeBtn.onclick = () => this.hide();
        closeBtn.innerHTML = '<span slot="icon-only">×</span>';
        header.appendChild(closeBtn);
      }
      
      content.appendChild(header);
    }
    
    // Add body for slotted content
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'le-popover-body';
    
    // MOVE (not clone) the slotted content into the portal body
    // This preserves event handlers and form state
    // Track original parents so we can restore them later
    const slot = this.el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
    if (slot) {
      const assignedNodes = slot.assignedNodes({ flatten: true });
      this.movedNodes = [];
      assignedNodes.forEach(node => {
        // Store original location info before moving
        this.movedNodes.push({
          node,
          originalParent: node.parentNode!,
          originalNextSibling: node.nextSibling
        });
        this.bodyEl!.appendChild(node);
      });
    }
    
    content.appendChild(this.bodyEl);
    this.portalEl.appendChild(content);
    this.popoverEl = content;
    
    container.appendChild(this.portalEl);
    
    // Position immediately
    requestAnimationFrame(() => {
      this.updatePosition();
    });
  }

  /**
   * Destroy the portal element and move content back to original locations
   */
  private destroyPortal() {
    if (this.portalEl) {
      // Move nodes back to their original locations in reverse order
      // This preserves the original DOM structure
      if (this.movedNodes.length > 0) {
        // Restore in reverse order to maintain correct positions
        for (let i = this.movedNodes.length - 1; i >= 0; i--) {
          const { node, originalParent, originalNextSibling } = this.movedNodes[i];
          if (originalParent) {
            if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
              originalParent.insertBefore(node, originalNextSibling);
            } else {
              originalParent.appendChild(node);
            }
          }
        }
        this.movedNodes = [];
      }
      
      this.portalEl.remove();
      this.portalEl = undefined;
      this.popoverEl = undefined;
      this.bodyEl = undefined;
    }
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
    // Check if click was inside the component or the portal
    if (!path.includes(this.el) && (!this.portalEl || !path.includes(this.portalEl))) {
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
    if (!this.triggerEl || !this.popoverEl || !this.portalEl) return;

    const triggerRect = this.triggerEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Padding from viewport edges
    const viewportPadding = 8;
    
    // Reset any previous max-height constraints to measure true size
    this.popoverEl.style.maxHeight = '';
    this.popoverEl.style.overflowY = '';
    
    const popoverRect = this.popoverEl.getBoundingClientRect();

    let position = this.position;
    let align = this.align;
    
    // Calculate available space in each direction
    const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding;
    const spaceAbove = triggerRect.top - viewportPadding;
    const spaceRight = viewportWidth - triggerRect.right - viewportPadding;
    const spaceLeft = triggerRect.left - viewportPadding;
    
    // Auto-position: choose best position based on available space
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
        // Not enough space anywhere - choose the direction with most space
        const maxSpace = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
        if (maxSpace === spaceBelow) position = 'bottom';
        else if (maxSpace === spaceAbove) position = 'top';
        else if (maxSpace === spaceRight) position = 'right';
        else position = 'left';
      }
    }

    // For top/bottom positions, check if popover would overflow horizontally
    // and adjust alignment accordingly
    if (position === 'top' || position === 'bottom') {
      // Check if start alignment would overflow right
      if (align === 'start' && triggerRect.left + popoverRect.width > viewportWidth - viewportPadding) {
        align = 'end';
      }
      // Check if end alignment would overflow left  
      else if (align === 'end' && triggerRect.right - popoverRect.width < viewportPadding) {
        align = 'start';
      }
      // Check if center alignment would overflow either side
      else if (align === 'center') {
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        if (triggerCenter - popoverRect.width / 2 < viewportPadding) {
          align = 'start';
        } else if (triggerCenter + popoverRect.width / 2 > viewportWidth - viewportPadding) {
          align = 'end';
        }
      }
    }

    // For left/right positions, check vertical overflow
    if (position === 'left' || position === 'right') {
      if (align === 'start' && triggerRect.top + popoverRect.height > viewportHeight - viewportPadding) {
        align = 'end';
      } else if (align === 'end' && triggerRect.bottom - popoverRect.height < viewportPadding) {
        align = 'start';
      } else if (align === 'center') {
        const triggerCenter = triggerRect.top + triggerRect.height / 2;
        if (triggerCenter - popoverRect.height / 2 < viewportPadding) {
          align = 'start';
        } else if (triggerCenter + popoverRect.height / 2 > viewportHeight - viewportPadding) {
          align = 'end';
        }
      }
    }

    // Calculate position coordinates
    let top: number = 0;
    let left: number = 0;
    let maxHeight: number | null = null;

    // Position based on direction
    switch (position) {
      case 'top':
        top = triggerRect.top - popoverRect.height - this.offset;
        // If would go above viewport, constrain and add scroll
        if (top < viewportPadding) {
          maxHeight = triggerRect.top - this.offset - viewportPadding * 2;
          top = viewportPadding;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + this.offset;
        // If would go below viewport, constrain and add scroll
        if (top + popoverRect.height > viewportHeight - viewportPadding) {
          maxHeight = viewportHeight - top - viewportPadding;
        }
        break;
      case 'left':
        left = triggerRect.left - popoverRect.width - this.offset;
        // If would go off left edge, constrain
        if (left < viewportPadding) {
          left = viewportPadding;
        }
        break;
      case 'right':
        left = triggerRect.right + this.offset;
        // If would go off right edge, constrain
        if (left + popoverRect.width > viewportWidth - viewportPadding) {
          left = viewportWidth - popoverRect.width - viewportPadding;
        }
        break;
    }

    // Calculate alignment
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
      
      // Constrain horizontal position to viewport
      if (left < viewportPadding) {
        left = viewportPadding;
      } else if (left + popoverRect.width > viewportWidth - viewportPadding) {
        left = viewportWidth - popoverRect.width - viewportPadding;
      }
    } else {
      // left/right positions
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
      
      // Constrain vertical position to viewport and handle overflow
      if (top < viewportPadding) {
        top = viewportPadding;
      }
      if (top + popoverRect.height > viewportHeight - viewportPadding) {
        maxHeight = viewportHeight - top - viewportPadding;
      }
    }

    // Apply max-height and scroll if content is too tall
    if (maxHeight !== null && maxHeight > 0) {
      // Ensure minimum usable height
      const minHeight = 100;
      if (maxHeight < minHeight) {
        maxHeight = minHeight;
        // Adjust top if needed to fit min height
        if (top + maxHeight > viewportHeight - viewportPadding) {
          top = viewportHeight - maxHeight - viewportPadding;
        }
      }
      this.popoverEl.style.maxHeight = `${maxHeight}px`;
      this.popoverEl.style.overflowY = 'auto';
    }

    // Apply absolute positioning with scroll offset
    this.portalEl.style.top = `${top + scrollY}px`;
    this.portalEl.style.left = `${left + scrollX}px`;
    this.portalEl.style.visibility = 'visible';
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
              <le-button type="button" slot="trigger" class="le-popover-default-trigger" variant="system" icon-only>
                <span slot="icon-only">⊕</span>
              </le-button>
            </slot>
          </le-slot>
        </div>
        {/* Container for slot content - content is moved to portal when open */}
        <div class="le-popover-slot-content" style={{ display: 'none' }}>
          <slot></slot>
        </div>
      </le-component>
    );
  }
}

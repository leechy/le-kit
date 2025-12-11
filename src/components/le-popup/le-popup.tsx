import { Component, Prop, Method, Event, EventEmitter, State, Element, h } from '@stencil/core';

/**
 * Popup type determines the buttons shown
 */
export type PopupType = 'alert' | 'confirm' | 'prompt' | 'custom';

/**
 * Popup position on the screen
 */
export type PopupPosition = 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Result returned by the popup when closed
 */
export interface PopupResult {
  confirmed: boolean;
  value?: string;
}

/**
 * A flexible popup/dialog component for alerts, confirms, prompts, and custom content.
 * 
 * Uses the native HTML <dialog> element for proper modal behavior, accessibility,
 * and focus management. Can be used declaratively in HTML or programmatically 
 * via leAlert(), leConfirm(), lePrompt().
 *
 * @slot - Default slot for custom body content
 * @slot header - Custom header content (replaces title)
 * @slot footer - Custom footer content (replaces default buttons)
 * 
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-popup',
  styleUrl: 'le-popup.css',
  shadow: true,
})
export class LePopup {
  @Element() el: HTMLElement;

  /**
   * Whether the popup is currently visible
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Type of popup: alert (OK only), confirm (OK/Cancel), prompt (input + OK/Cancel), custom
   */
  @Prop() type: PopupType = 'alert';

  /**
   * Optional title for the popup header
   */
  @Prop() popupTitle?: string;

  /**
   * Message text to display (for alert/confirm/prompt types)
   */
  @Prop() message?: string;

  /**
   * Whether the popup is modal (blocks interaction with page behind)
   */
  @Prop() modal: boolean = true;

  /**
   * Position of the popup on screen
   */
  @Prop() position: PopupPosition = 'center';

  /**
   * Text for the confirm/OK button
   */
  @Prop() confirmText: string = 'OK';

  /**
   * Text for the cancel button
   */
  @Prop() cancelText: string = 'Cancel';

  /**
   * Placeholder text for prompt input
   */
  @Prop() placeholder: string = '';

  /**
   * Default value for prompt input
   */
  @Prop() defaultValue: string = '';

  /**
   * Whether clicking the backdrop closes the popup (modal only)
   */
  @Prop() closeOnBackdrop: boolean = true;

  /**
   * Internal state for prompt input value
   */
  @State() inputValue: string = '';

  /**
   * Emitted when the popup is confirmed (OK clicked)
   */
  @Event() leConfirm: EventEmitter<PopupResult>;

  /**
   * Emitted when the popup is cancelled (Cancel clicked or dismissed)
   */
  @Event() leCancel: EventEmitter<PopupResult>;

  /**
   * Emitted when the popup opens
   */
  @Event() leOpen: EventEmitter<void>;

  /**
   * Emitted when the popup closes
   */
  @Event() leClose: EventEmitter<PopupResult>;

  private dialogEl?: HTMLDialogElement;
  private inputEl?: HTMLInputElement;
  private resolvePromise?: (result: PopupResult) => void;

  componentWillLoad() {
    this.inputValue = this.defaultValue;
  }

  componentDidLoad() {
    // Native dialog handles Escape key automatically when modal
    // We just need to listen for the cancel event
    this.dialogEl?.addEventListener('cancel', this.handleDialogCancel);
  }

  disconnectedCallback() {
    this.dialogEl?.removeEventListener('cancel', this.handleDialogCancel);
  }

  private handleDialogCancel = (e: Event) => {
    e.preventDefault(); // Prevent default close to handle it ourselves
    this.handleCancel();
  };

  /**
   * Opens the popup and returns a promise that resolves when closed
   */
  @Method()
  async show(): Promise<PopupResult> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.inputValue = this.defaultValue;
      this.open = true;
      
      // Use requestAnimationFrame to ensure the dialog element is rendered
      requestAnimationFrame(() => {
        if (this.dialogEl) {
          if (this.modal) {
            this.dialogEl.showModal();
          } else {
            this.dialogEl.show();
          }
          
          this.leOpen.emit();
          
          // Focus input for prompt type
          if (this.type === 'prompt' && this.inputEl) {
            this.inputEl.focus();
            this.inputEl.select();
          }
        }
      });
    });
  }

  /**
   * Closes the popup with a result
   */
  @Method()
  async hide(confirmed: boolean = false) {
    const result: PopupResult = {
      confirmed,
      value: this.type === 'prompt' ? this.inputValue : undefined,
    };
    
    this.dialogEl?.close();
    this.open = false;
    this.leClose.emit(result);
    
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = undefined;
    }
  }

  private handleConfirm = () => {
    const result: PopupResult = {
      confirmed: true,
      value: this.type === 'prompt' ? this.inputValue : undefined,
    };
    this.leConfirm.emit(result);
    this.hide(true);
  };

  private handleCancel = () => {
    const result: PopupResult = {
      confirmed: false,
      value: undefined,
    };
    this.leCancel.emit(result);
    this.hide(false);
  };

  private handleBackdropClick = (e: MouseEvent) => {
    // Check if click was on the dialog backdrop (outside the dialog box)
    if (this.closeOnBackdrop && e.target === this.dialogEl) {
      const rect = this.dialogEl.getBoundingClientRect();
      const clickedInDialog = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      if (!clickedInDialog) {
        this.handleCancel();
      }
    }
  };

  private handleInputChange = (e: Event) => {
    this.inputValue = (e.target as HTMLInputElement).value;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && this.type !== 'custom') {
      e.preventDefault();
      this.handleConfirm();
    }
  };

  private hasSlot(name: string): boolean {
    return !!this.el.querySelector(`[slot="${name}"]`);
  }

  private renderHeader() {
    if (this.hasSlot('header')) {
      return (
        <div class="le-popup-header" part="header">
          <slot name="header"></slot>
        </div>
      );
    }
    
    if (this.popupTitle) {
      return (
        <div class="le-popup-header" part="header">
          {this.popupTitle}
        </div>
      );
    }
    
    return null;
  }

  private renderBody() {
    return (
      <div class="le-popup-body" part="body">
        {this.message && <p class="le-popup-message">{this.message}</p>}
        
        {this.type === 'prompt' && (
          <input
            type="text"
            class="le-popup-input"
            part="input"
            placeholder={this.placeholder}
            value={this.inputValue}
            onInput={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            ref={(el) => (this.inputEl = el)}
          />
        )}
        
        {/* Default slot for custom content */}
        <le-slot name="" tag="div" description="Custom popup content" type="slot">
          <slot></slot>
        </le-slot>
      </div>
    );
  }

  private renderFooter() {
    if (this.hasSlot('footer')) {
      return (
        <div class="le-popup-footer" part="footer">
          <slot name="footer"></slot>
        </div>
      );
    }
    
    // For custom type without footer slot, don't render default buttons
    if (this.type === 'custom') {
      return null;
    }
    
    return (
      <div class="le-popup-footer" part="footer">
        {(this.type === 'confirm' || this.type === 'prompt') && (
          <button
            class="le-popup-btn le-popup-btn-cancel"
            part="button-cancel"
            onClick={this.handleCancel}
          >
            {this.cancelText}
          </button>
        )}
        <button
          class="le-popup-btn le-popup-btn-confirm"
          part="button-confirm"
          onClick={this.handleConfirm}
        >
          {this.confirmText}
        </button>
      </div>
    );
  }

  render() {
    const positionClass = `le-popup-position-${this.position}`;
    
    return (
      <dialog
        class={`le-popup-dialog ${positionClass}`}
        part="dialog"
        ref={(el) => (this.dialogEl = el)}
        onClick={this.handleBackdropClick}
      >
        <le-component component="le-popup">
          <div class="le-popup-container" part="container">
            {this.renderHeader()}
            {this.renderBody()}
            {this.renderFooter()}
          </div>
        </le-component>
      </dialog>
    );
  }
}

import { Component, Prop, State, h, Host, Element, Event, EventEmitter } from '@stencil/core';
import { classnames, observeModeChanges } from '../../utils/utils';

/**
 * Slot placeholder component for admin/CMS mode.
 *
 * This component renders a visual placeholder for slots when in admin mode,
 * allowing CMS systems to show available drop zones for content or inline editing.
 *
 * In non-admin mode, this component renders nothing and acts as a passthrough.
 *
 * @slot - Default slot for placeholder content or drop zone UI
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-slot',
  styleUrl: 'le-slot.default.css',
  shadow: true,
})
export class LeSlot {
  @Element() el: HTMLElement;

  /**
   * The type of slot content.
   * - `slot`: Default, shows a dropzone for components (default)
   * - `text`: Shows a single-line text input
   * - `textarea`: Shows a multi-line text area
   */
  @Prop() type: 'slot' | 'text' | 'textarea' = 'slot';

  /**
   * The name of the slot this placeholder represents.
   * Should match the slot name in the parent component.
   */
  @Prop() name: string = '';

  /**
   * Label to display in admin mode.
   * If not provided, the slot name will be used.
   */
  @Prop() label?: string;

  /**
   * Description of what content this slot accepts.
   * Shown in admin mode to guide content editors.
   */
  @Prop() description?: string;

  /**
   * Comma-separated list of allowed component tags for this slot.
   * Used by CMS to filter available components.
   *
   * @example "le-card,le-button,le-text"
   */
  @Prop() allowedComponents?: string;

  /**
   * Whether multiple components can be dropped in this slot.
   */
  @Prop() multiple: boolean = true;

  /**
   * Whether this slot is required to have content.
   */
  @Prop() required: boolean = false;

  /**
   * Placeholder text for text/textarea inputs in admin mode.
   */
  @Prop() placeholder?: string;

  /**
   * The HTML tag to create when there's no slotted element.
   * Used with type="text" or type="textarea" to auto-create elements.
   * 
   * @example "h3" - creates <h3 slot="header">content</h3>
   * @example "p" - creates <p slot="content">content</p>
   */
  @Prop() tag?: string;

  /**
   * CSS styles for the slot dropzone container.
   * Useful for layouts - e.g., "flex-direction: row" for horizontal stacks.
   * Only applies in admin mode for type="slot".
   */
  @Prop() slotStyle?: string;

  /**
   * Internal state to track admin mode
   */
  @State() private adminMode: boolean = false;

  /**
   * Internal state for text input value (synced from slot content)
   */
  @State() private textValue: string = '';

  /**
   * Whether the current textValue contains valid HTML
   */
  @State() private isValidHtml: boolean = true;

  /**
   * Available components loaded from Custom Elements Manifest
   */
  @State() private availableComponents: ComponentInfo[] = [];

  /**
   * Whether the component picker popover is open
   */
  @State() private pickerOpen: boolean = false;

  /**
   * Reference to the slot element to access assignedNodes
   */
  private slotRef?: HTMLSlotElement;

  /**
   * The original slotted element (e.g., <h3 slot="header">)
   */
  private slottedElement?: Element;

  /**
   * Emitted when text content changes in admin mode.
   * The event detail contains the new text value and validity.
   */
  @Event() leSlotChange: EventEmitter<{ name: string; value: string; isValid: boolean }>;

  private disconnectModeObserver?: () => void;

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, (mode) => {
      const wasAdmin = this.adminMode;
      this.adminMode = mode === 'admin';
      
      // When entering admin mode, read content from slotted elements
      if (this.adminMode && !wasAdmin) {
        // Need to wait for render to access slot ref
        requestAnimationFrame(() => this.readSlottedContent());
        
        // Load available components for the component picker
        if (this.type === 'slot') {
          this.loadAvailableComponents();
        }
      }
    });
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
  }

  /**
   * Flag to prevent re-reading content right after we updated it
   */
  private isUpdating: boolean = false;

  /**
   * Read content from slotted elements via assignedNodes()
   */
  private readSlottedContent() {
    if (!this.slotRef) return;
    
    // Skip if we just updated the content ourselves
    if (this.isUpdating) {
      this.isUpdating = false;
      return;
    }

    const assignedNodes = this.slotRef.assignedNodes({ flatten: true });
    
    // For text/textarea types, we want to edit the innerHTML of slotted elements
    if (this.type === 'text' || this.type === 'textarea') {
      // Find the first element node (skip text nodes that are just whitespace)
      const elementNode = assignedNodes.find(
        node => node.nodeType === Node.ELEMENT_NODE
      ) as Element | undefined;

      if (elementNode) {
        // Only update textValue if slotted element changed or we don't have one yet
        if (this.slottedElement !== elementNode) {
          this.slottedElement = elementNode;
          this.textValue = elementNode.innerHTML?.trim() || '';
          // console.log(`[le-slot "${this.name}"] Read slotted content:`, this.textValue);
        }
      } else {
        // No element, check for direct text content
        const textContent = assignedNodes
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent)
          .join('')
          .trim();
        
        if (textContent && !this.textValue) {
          this.textValue = textContent;
          // console.log(`[le-slot "${this.name}"] Read text content:`, this.textValue);
        }
      }
    }
  }

  /**
   * Validates if a string contains valid HTML
   */
  private validateHtml(html: string): boolean {
    // Empty string is valid
    if (!html.trim()) return true;
    
    // Create a template element to parse the HTML
    const template = document.createElement('template');
    template.innerHTML = html;
    
    // Check that we don't have obviously broken HTML
    // Count opening and closing tags for common elements
    const openTags = (html.match(/<[a-z][^>]*(?<!\/)>/gi) || []).length;
    const closeTags = (html.match(/<\/[a-z][^>]*>/gi) || []).length;
    const selfClosing = (html.match(/<[a-z][^>]*\/>/gi) || []).length;
    
    // Simple validation: opening tags (minus self-closing) should roughly match closing tags
    // Allow some tolerance for void elements like <br>, <img>, etc.
    const voidElements = (html.match(/<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)[^>]*>/gi) || []).length;
    
    const effectiveOpenTags = openTags - selfClosing - voidElements;
    
    // If difference is too large, HTML is likely broken
    if (Math.abs(effectiveOpenTags - closeTags) > 1) {
      return false;
    }
    
    return true;
  }

  private handleTextInput = (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.textValue = target.value;
    this.isValidHtml = this.validateHtml(this.textValue);
    
    if (this.isValidHtml) {
      // Set flag to prevent slotchange from re-reading what we just wrote
      this.isUpdating = true;
      
      if (this.slottedElement) {
        // Update existing slotted element's innerHTML
        this.slottedElement.innerHTML = this.textValue;
      } else if (this.tag && this.textValue) {
        // No slotted element exists - create one using the specified tag
        this.createSlottedElement();
      } else if (this.textValue) {
        // no tag specified - just replace everything in the host component
        const rootNode = this.el.getRootNode();
        if (rootNode instanceof ShadowRoot) {
          const hostComponent = rootNode.host;
          hostComponent.innerHTML = this.textValue;
        }
      }
    }
    
    this.leSlotChange.emit({ 
      name: this.name, 
      value: this.textValue,
      isValid: this.isValidHtml 
    });
  };

  /**
   * Create a new slotted element when none exists.
   * The element is appended to the host component's light DOM.
   */
  private createSlottedElement() {
    if (!this.tag) return;
    
    // Find the host component (le-card, etc.) by traversing up through shadow DOM
    // le-slot is inside le-card's shadow DOM, so we need to find le-card's host
    const rootNode = this.el.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;
    
    const hostComponent = rootNode.host;
    if (!hostComponent) return;
    
    // Create the new element
    const newElement = document.createElement(this.tag);
    newElement.innerHTML = this.textValue;
    
    // Set the slot attribute if this is a named slot
    if (this.name) {
      newElement.setAttribute('slot', this.name);
    }
    
    // Append to the host component's light DOM
    hostComponent.appendChild(newElement);
    
    // Store reference to the new element
    this.slottedElement = newElement;
    
    // console.log(`[le-slot "${this.name}"] Created new <${this.tag}> element`);
  }

  /**
   * Load available components from Custom Elements Manifest
   */
  private async loadAvailableComponents() {
    try {
      const response = await fetch('/custom-elements.json');
      const manifest = await response.json();
      
      const components: ComponentInfo[] = [];
      const allowedList = this.allowedComponents?.split(',').map(s => s.trim()) || [];
      
      for (const module of manifest.modules) {
        for (const declaration of module.declarations || []) {
          if (declaration.tagName && declaration.customElement) {
            // Skip internal components (le-slot, le-component, le-popover)
            const isInternal = ['le-slot', 'le-component', 'le-popover'].includes(declaration.tagName);
            if (isInternal) continue;
            
            // If allowedComponents is specified, filter by it
            if (allowedList.length > 0 && !allowedList.includes(declaration.tagName)) {
              continue;
            }
            
            components.push({
              tagName: declaration.tagName,
              name: this.formatComponentName(declaration.tagName),
              description: declaration.description || '',
            });
          }
        }
      }
      
      this.availableComponents = components;
    } catch (error) {
      console.warn('[le-slot] Failed to load component manifest:', error);
    }
  }

  /**
   * Format a tag name into a display name
   * e.g., 'le-card' -> 'Card'
   */
  private formatComponentName(tagName: string): string {
    return tagName
      .replace(/^le-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Add a new component to the slot
   */
  private addComponent(tagName: string) {
    // Find the host component by traversing up through shadow DOM
    const rootNode = this.el.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;
    
    const hostComponent = rootNode.host;
    if (!hostComponent) return;
    
    // Create the new component element
    const newElement = document.createElement(tagName);
    
    // Set the slot attribute if this is a named slot
    if (this.name) {
      newElement.setAttribute('slot', this.name);
    }
    
    // Append to the host component's light DOM
    hostComponent.appendChild(newElement);
    
    // Emit change event so the page can save
    this.leSlotChange.emit({
      name: this.name,
      value: hostComponent.innerHTML,
      isValid: true,
    });
  }

  /**
   * Handle slot change event to re-read content when nodes are assigned
   */
  private handleSlotChange = () => {
    this.readSlottedContent();
  };

  render() {
    const displayLabel = this.label || this.name;

    // Always render the same structure, CSS handles visibility via .admin-mode class
    return (
      <Host
        class={{ 
          'admin-mode': this.adminMode,
          'invalid-html': !this.isValidHtml 
        }}
        role={this.adminMode ? 'region' : undefined}
        aria-label={this.adminMode ? `Slot: ${displayLabel}` : undefined}
        data-slot-name={this.name}
        data-slot-type={this.type}
        data-allowed={this.allowedComponents}
        data-multiple={this.multiple}
        data-required={this.required}
      >
        {this.adminMode ? (
          <div class="le-slot-container">
            <div class={classnames('le-slot-header', {
              'le-slot-header-no-label': !displayLabel,
              'le-slot-header-text': this.type === 'text',
              'le-slot-header-error': !this.isValidHtml
            })}>
              {displayLabel && (
                <span class="le-slot-label">
                  {displayLabel}
                  {this.required && <span class="le-slot-required">*</span>}
                </span>
              )}
              {/* {this.description && <le-popover mode="default" showClose={false} align="end" position="bottom">
                <span slot="trigger" class="le-slot-description-icon">ℹ️</span>
                {this.description}
              </le-popover>} */}
              {!this.isValidHtml && <span class="le-slot-invalid">⚠ Invalid HTML</span>}
              {this.type === 'slot' && this.adminMode && (
                <le-popover 
                  mode="default"
                  showClose={true}
                  align="start"
                  position="right"
                  popoverTitle="Add Component"
                  open={this.pickerOpen}
                  onLePopoverOpen={() => this.pickerOpen = true}
                  onLePopoverClose={() => this.pickerOpen = false}
                >
                  <le-button
                    type="button"
                    class="le-slot-button"
                    slot="trigger"
                    variant="clear"
                    size="small"
                    aria-label="Add component"
                    icon-only
                  >
                    <span class="le-slot-add-btn" slot="icon-only">+</span>
                  </le-button>
                  <div class="le-slot-picker">
                    {this.availableComponents.length > 0 ? (
                      <ul class="le-slot-picker-list">
                        {this.availableComponents.map(component => (
                          <li key={component.tagName}>
                            <button
                              class="le-slot-picker-item"
                              onClick={() => {
                                this.addComponent(component.tagName);
                                this.pickerOpen = false;
                              }}
                            >
                              <span class="le-slot-picker-name">{component.name}</span>
                              {component.description && (
                                <span class="le-slot-picker-desc">{component.description}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div class="le-slot-picker-empty">No components available</div>
                    )}
                  </div>
                </le-popover>
              )}
            </div>
            {this.renderContent()}
          </div>
        ) : (
          // In default mode, just pass through the slot - slotted content renders naturally
          // Note: We use unnamed slot here because named slots from parent component
          // are passed as le-slot's light DOM children
          <slot 
            // ref={(el) => this.slotRef = el as HTMLSlotElement}
            // onSlotchange={this.handleSlotChange}
          ></slot>
        )}
      </Host>
    );
  }

  private renderContent() {
    // Create the slot element with ref for reading assignedNodes
    // Wrap in a hidden div since slot elements can't have style prop in Stencil
    // Note: We use unnamed slot here because named slots from parent component
    // are passed as le-slot's light DOM children
    const slotElement = (
      <div class="hidden-slot">
        <slot 
          ref={(el) => this.slotRef = el as HTMLSlotElement}
          onSlotchange={this.handleSlotChange}
        ></slot>
      </div>
    );

    switch (this.type) {
      case 'text':
        return (
          <div class={{ 'le-slot-input': true, 'has-error': !this.isValidHtml }}>
            <input
              type="text"
              value={this.textValue}
              placeholder={this.placeholder || `Enter ${this.label || this.name || 'text'}...`}
              onInput={this.handleTextInput}
              required={this.required}
            />
            {slotElement}
          </div>
        );

      case 'textarea':
        return (
          <div class={{ 'le-slot-input': true, 'has-error': !this.isValidHtml }}>
            <textarea
              value={this.textValue}
              placeholder={this.placeholder || `Enter ${this.label || this.name || 'text'}...`}
              onInput={this.handleTextInput}
              required={this.required}
              rows={3}
            ></textarea>
            {slotElement}
          </div>
        );

      case 'slot':
      default:
        // Parse slotStyle string into style object if provided
        const dropzoneStyle: { [key: string]: string } = {};
        if (this.slotStyle) {
          this.slotStyle.split(';').forEach(rule => {
            const [prop, value] = rule.split(':').map(s => s.trim());
            if (prop && value) {
              // Convert kebab-case to camelCase for style object
              const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
              dropzoneStyle[camelProp] = value;
            }
          });
        }
        return (
          <div class="le-slot-dropzone" style={dropzoneStyle}>
            <slot 
              ref={(el) => this.slotRef = el as HTMLSlotElement}
              onSlotchange={this.handleSlotChange}
            ></slot>
          </div>
        );
    }
  }
}

/**
 * Component info from the manifest
 */
interface ComponentInfo {
  tagName: string;
  name: string;
  description: string;
}

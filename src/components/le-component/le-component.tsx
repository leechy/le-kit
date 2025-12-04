import { Component, Prop, State, h, Host, Element } from '@stencil/core';
import { classnames, observeModeChanges } from '../../utils/utils';

/**
 * Component wrapper for admin mode editing.
 *
 * This component is used internally by other components to provide admin-mode 
 * editing capabilities. It wraps the component's rendered output and shows
 * a settings popover for editing properties.
 *
 * In default mode, it acts as a simple passthrough (display: contents).
 * In admin mode, it shows a border, component name header, and settings popover.
 *
 * The host element is found automatically by traversing up through the shadow DOM.
 *
 * Usage inside a component's render method:
 * ```tsx
 * render() {
 *   return (
 *     <le-component component="le-card">
 *       <Host>...</Host>
 *     </le-component>
 *   );
 * }
 * ```
 *
 * @slot - The component's rendered content
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-component',
  styleUrl: 'le-component.css',
  shadow: true,
})
export class LeComponent {
  @Element() el: HTMLElement;

  /**
   * The tag name of the component (e.g., 'le-card').
   * Used to look up property metadata and display the component name.
   */
  @Prop() component!: string;

  /**
   * Optional display name for the component.
   * If not provided, the tag name will be formatted as the display name.
   */
  @Prop() displayName?: string;

  /**
   * Classes to apply to the host element.
   * Allows parent components to pass their styling classes.
   */
  @Prop() hostClass?: string;

  /**
   * Reference to the host element (found automatically from parent)
   */
  private hostElement?: HTMLElement;

  /**
   * Internal state to track admin mode
   */
  @State() private adminMode: boolean = false;

  /**
   * Component metadata loaded from Custom Elements Manifest
   */
  @State() private componentMeta: ComponentMetadata | null = null;

  /**
   * Current property values of the host component
   */
  @State() private propertyValues: Record<string, any> = {};

  private disconnectModeObserver?: () => void;

  connectedCallback() {
    // Find the host element - le-component is rendered inside the component's shadow DOM,
    // so we need to find the shadow root's host element
    this.findHostElement();

    this.disconnectModeObserver = observeModeChanges(this.el, (mode) => {
      this.adminMode = mode === 'admin';
      // Refresh property values when entering admin mode
      if (this.adminMode) {
        this.readPropertyValues();
      }
    });

    // Load component metadata
    this.loadComponentMetadata();
  }

  /**
   * Find the host element by traversing up through shadow DOM
   */
  private findHostElement() {
    // Get the shadow root that contains this le-component
    const rootNode = this.el.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      // The host of this shadow root is our target component (e.g., le-card)
      this.hostElement = rootNode.host as HTMLElement;
    }
  }

  componentDidLoad() {
    // Read initial property values from the host element
    this.readPropertyValues();
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
  }

  /**
   * Formats a tag name into a display name
   * e.g., 'le-card' -> 'Card'
   */
  private formatDisplayName(tagName: string): string {
    return tagName
      .replace(/^le-/, '') // Remove 'le-' prefix
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Load component metadata from the Custom Elements Manifest
   */
  private async loadComponentMetadata() {
    try {
      // Fetch the manifest - in production this would be bundled or cached
      const response = await fetch('/custom-elements.json');
      const manifest = await response.json();

      // Find the component definition
      for (const module of manifest.modules) {
        for (const declaration of module.declarations || []) {
          if (declaration.tagName === this.component) {
            const attributes = (declaration.attributes || []).filter(
              (attr: AttributeMetadata) => !this.isInternalAttribute(attr.name)
            );
            this.componentMeta = {
              tagName: declaration.tagName,
              description: declaration.description,
              attributes,
            };
            console.log(`[le-component] Loaded metadata for ${this.component}:`, this.componentMeta);
            // Read property values after metadata is loaded
            this.readPropertyValues();
            return;
          }
        }
      }
      console.warn(`[le-component] No metadata found for component: ${this.component}`);
    } catch (error) {
      console.warn(`[le-component] Failed to load metadata for component: ${this.component}`, error);
    }
  }

  /**
   * Check if an attribute is internal (should not be shown in editor)
   */
  private isInternalAttribute(name: string): boolean {
    const internalAttrs = ['mode', 'theme', 'class', 'style', 'id', 'slot'];
    return internalAttrs.includes(name);
  }

  /**
   * Read current property values from the host element
   */
  private readPropertyValues() {
    if (!this.hostElement || !this.componentMeta) return;

    const values: Record<string, any> = {};
    for (const attr of this.componentMeta.attributes) {
      const value = this.hostElement.getAttribute(attr.name);
      values[attr.name] = this.parseAttributeValue(value, attr.type?.text);
    }
    this.propertyValues = values;
  }

  /**
   * Parse an attribute value based on its type
   */
  private parseAttributeValue(value: string | null, type?: string): any {
    if (value === null) return undefined;
    
    if (type === 'boolean') {
      return value !== null && value !== 'false';
    }
    if (type === 'number') {
      return parseFloat(value);
    }
    return value;
  }

  /**
   * Handle property value changes from the editor
   */
  private handlePropertyChange(attrName: string, value: any, type?: string) {
    if (!this.hostElement) return;

    // Update the host element's attribute
    if (type === 'boolean') {
      if (value) {
        this.hostElement.setAttribute(attrName, '');
      } else {
        this.hostElement.removeAttribute(attrName);
      }
    } else if (value === undefined || value === '') {
      this.hostElement.removeAttribute(attrName);
    } else {
      this.hostElement.setAttribute(attrName, String(value));
    }

    // Update local state
    this.propertyValues = { ...this.propertyValues, [attrName]: value };
  }

  /**
   * Render the property editor form
   */
  private renderPropertyEditor() {
    if (!this.componentMeta || this.componentMeta.attributes.length === 0) {
      return <p class="no-properties">No editable properties</p>;
    }

    return (
      <form class="property-editor" onSubmit={(e) => e.preventDefault()}>
        {this.componentMeta.attributes.map(attr => this.renderPropertyField(attr))}
      </form>
    );
  }

  /**
   * Render a single property field based on its type
   */
  private renderPropertyField(attr: AttributeMetadata) {
    const value = this.propertyValues[attr.name];
    const type = attr.type?.text || 'string';

    // Check if type is a union of string literals (e.g., "'default' | 'outlined' | 'elevated'")
    const enumMatch = type.match(/^'[^']+'/);
    if (enumMatch) {
      const options = type.split('|').map(opt => opt.trim().replace(/'/g, ''));
      return (
        <div class="property-field">
          <label htmlFor={`prop-${attr.name}`}>
            {attr.name}
            {attr.description && <span class="property-hint">{attr.description}</span>}
          </label>
          <select
            id={`prop-${attr.name}`}
            onChange={(e) => this.handlePropertyChange(attr.name, (e.target as HTMLSelectElement).value, type)}
          >
            {options.map(opt => (
              <option value={opt} selected={value === opt || (!value && attr.default?.replace(/'/g, '') === opt)}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    // Boolean type
    if (type === 'boolean') {
      return (
        <div class="property-field property-field--checkbox">
          <label htmlFor={`prop-${attr.name}`}>
            <input
              type="checkbox"
              id={`prop-${attr.name}`}
              checked={value === true || value === ''}
              onChange={(e) => this.handlePropertyChange(attr.name, (e.target as HTMLInputElement).checked, type)}
            />
            {attr.name}
          </label>
          {attr.description && <span class="property-hint">{attr.description}</span>}
        </div>
      );
    }

    // Number type
    if (type === 'number') {
      return (
        <div class="property-field">
          <label htmlFor={`prop-${attr.name}`}>
            {attr.name}
            {attr.description && <span class="property-hint">{attr.description}</span>}
          </label>
          <input
            type="number"
            id={`prop-${attr.name}`}
            value={value ?? ''}
            placeholder={attr.default}
            onChange={(e) => this.handlePropertyChange(attr.name, (e.target as HTMLInputElement).value, type)}
          />
        </div>
      );
    }

    // Default: string/text input
    return (
      <div class="property-field">
        <label htmlFor={`prop-${attr.name}`}>
          {attr.name}
          {attr.description && <span class="property-hint">{attr.description}</span>}
        </label>
        <input
          type="text"
          id={`prop-${attr.name}`}
          value={value ?? ''}
          placeholder={attr.default?.replace(/'/g, '')}
          onChange={(e) => this.handlePropertyChange(attr.name, (e.target as HTMLInputElement).value, type)}
        />
      </div>
    );
  }

  render() {
    const name = this.displayName || this.formatDisplayName(this.component);

    // In default mode, just pass through content with host classes
    if (!this.adminMode) {
      return (
        <Host class={classnames(this.component, this.hostClass)}>
          <slot></slot>
        </Host>
      );
    }

    // In admin mode, show wrapper with header and settings
    return (
      <Host class={classnames(this.component, this.hostClass, 'admin-mode')}>
        <div class="le-component-wrapper">
          <div class="le-component-header">
            <span class="le-component-name">{name}</span>
            <le-popover 
              popoverTitle={`${name} Settings`}
              position="bottom"
              align="end"
            >
              {this.renderPropertyEditor()}
            </le-popover>
          </div>
          <div class="le-component-content">
            <slot></slot>
          </div>
        </div>
      </Host>
    );
  }
}

/**
 * Type definitions for component metadata
 */
interface ComponentMetadata {
  tagName: string;
  description?: string;
  attributes: AttributeMetadata[];
}

interface AttributeMetadata {
  name: string;
  fieldName?: string;
  description?: string;
  default?: string;
  type?: {
    text: string;
  };
}

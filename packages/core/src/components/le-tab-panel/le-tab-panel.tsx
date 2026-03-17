import { Component, Prop, h, Element, State, Watch, Method } from '@stencil/core';

/**
 * A tab panel component used as a child of le-tabs.
 *
 * Each le-tab-panel defines both the tab button label and the panel content.
 * The parent le-tabs component automatically reads these panels and creates
 * the tab interface.
 *
 * @slot - Default slot for panel content
 *
 * @cmsEditable true
 * @cmsCategory Navigation
 */
@Component({
  tag: 'le-tab-panel',
  styleUrl: 'le-tab-panel.css',
  shadow: true,
})
export class LeTabPanel {
  @Element() el: HTMLLeTabPanelElement;

  /**
   * The label displayed in the tab button.
   */
  @Prop() label!: string;

  /**
   * The value used to identify this tab.
   * Defaults to the label if not provided.
   */
  @Prop() value?: string;

  /**
   * Icon displayed at the start of the tab button.
   * Can be an emoji, URL, or icon class.
   */
  @Prop() iconStart?: string;

  /**
   * Icon displayed at the end of the tab button.
   */
  @Prop() iconEnd?: string;

  /**
   * Whether this tab is disabled.
   */
  @Prop() disabled: boolean = false;

  /**
   * Whether to render the panel content only when active (lazy loading).
   * When true, content is not rendered until the tab is first selected.
   * When false (default), content is always in DOM but hidden when inactive.
   */
  @Prop() lazy: boolean = false;

  /**
   * Internal: Whether this panel is currently active (set by parent le-tabs)
   */
  @State() active: boolean = false;

  /**
   * Internal: Track if panel has ever been activated (for lazy rendering)
   */
  @State() hasBeenActive: boolean = false;

  @Watch('active')
  activeChanged(isActive: boolean) {
    if (isActive && !this.hasBeenActive) {
      this.hasBeenActive = true;
    }
  }

  /**
   * Get the effective value (value or label as fallback)
   */
  @Method()
  async getValue(): Promise<string> {
    return this.value ?? this.label;
  }

  /**
   * Get tab configuration for parent component
   */
  @Method()
  async getTabConfig(): Promise<{
    label: string;
    value: string;
    iconStart?: string;
    iconEnd?: string;
    disabled: boolean;
  }> {
    return {
      label: this.label,
      value: this.value ?? this.label,
      iconStart: this.iconStart,
      iconEnd: this.iconEnd,
      disabled: this.disabled,
    };
  }

  /**
   * Set the active state (called by parent le-tabs)
   */
  @Method()
  async setActive(isActive: boolean) {
    this.active = isActive;
  }

  /**
   * Check if panel should render content
   */
  private shouldRenderContent(): boolean {
    if (!this.lazy) return true;
    return this.hasBeenActive;
  }

  render() {
    const shouldRender = this.shouldRenderContent();

    return (
      <le-component component="le-tab-panel">
        <div
          class={{
            'tab-panel': true,
            'active': this.active,
            'lazy-hidden': this.lazy && !this.active,
          }}
          role="tabpanel"
          aria-hidden={!this.active ? 'true' : undefined}
          tabIndex={this.active ? 0 : -1}
        >
          <le-slot name="" description="Tab panel content" type="slot">
            {shouldRender && <slot></slot>}
          </le-slot>
        </div>
      </le-component>
    );
  }
}

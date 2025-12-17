import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  h,
  Element,
  Watch,
  Listen,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';
import { classnames } from '../../utils/utils';

interface TabConfig {
  label: string;
  value: string;
  iconStart?: string;
  iconEnd?: string;
  disabled: boolean;
  panel?: HTMLElement & { setActive: (active: boolean) => Promise<void> };
}

/**
 * A flexible tabs component for organizing content into tabbed panels.
 *
 * Supports two modes:
 * 1. **Declarative**: Use `<le-tab-panel>` children to define tabs and content
 * 2. **Programmatic**: Use the `tabs` prop with named slots for content
 *
 * Full keyboard navigation and ARIA support included.
 *
 * @slot - Default slot for le-tab-panel children (declarative mode)
 * @slot panel-{value} - Named slots for panel content (programmatic mode)
 *
 * @cssprop --le-tabs-border-color - Border color for tab list
 * @cssprop --le-tabs-gap - Gap between tabs
 * @cssprop --le-tabs-indicator-color - Active tab indicator color
 * @cssprop --le-tabs-padding-x - Horizontal padding for tab buttons
 * @cssprop --le-tabs-padding-y - Vertical padding for tab buttons
 *
 * @csspart tablist - The tab button container (role="tablist")
 * @csspart tab - Individual tab buttons
 * @csspart tab-active - The currently active tab
 * @csspart panels - Container for panel content
 * @csspart panel - Individual panel containers
 *
 * @cmsEditable true
 * @cmsCategory Navigation
 */
@Component({
  tag: 'le-tabs',
  styleUrl: 'le-tabs.css',
  shadow: true,
})
export class LeTabs {
  @Element() el: HTMLElement;

  /**
   * Array of tab options (programmatic mode).
   * If le-tab-panel children exist, they take precedence.
   */
  @Prop() tabs: LeOption[] = [];

  /**
   * The value of the currently selected tab.
   * If not provided, defaults to the first tab.
   */
  @Prop({ mutable: true }) selected?: LeOptionValue;

  /**
   * Orientation of the tabs.
   * @allowedValues horizontal | vertical
   */
  @Prop() orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Position of the tabs relative to the panels.
   * @allowedValues start | end
   */
  @Prop() position: 'start' | 'end' = 'start';

  /**
   * Tab variant style.
   * @allowedValues underlined | solid | pills | enclosed | icon-only
   */
  @Prop() variant: 'underlined' | 'solid' | 'pills' | 'enclosed' | 'icon-only' = 'underlined';

  /**
   * Whether tabs should stretch to fill available width.
   */
  @Prop() fullWidth: boolean = false;

  /**
   * Size of the tabs.
   * @allowedValues sm | md | lg
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Wrap the tabs if they exceed container width.
   */
  @Prop() wrap: boolean = false;

  /**
   * Internal tab configurations (built from children or tabs prop)
   */
  @State() private tabConfigs: TabConfig[] = [];

  /**
   * Internal state for focused tab index (for keyboard navigation)
   */
  @State() private focusedIndex: number = 0;

  /**
   * Whether we're using declarative mode (le-tab-panel children)
   */
  @State() private isDeclarativeMode: boolean = false;

  /**
   * Emitted when the selected tab changes.
   */
  @Event() leTabChange: EventEmitter<LeOptionSelectDetail>;

  private mutationObserver?: MutationObserver;

  @Watch('selected')
  selectedChanged(newValue: LeOptionValue) {
    const index = this.tabConfigs.findIndex(t => t.value === newValue);
    if (index >= 0) {
      this.focusedIndex = index;
    }
    this.updatePanelStates();
  }

  @Watch('tabs')
  tabsChanged() {
    if (!this.isDeclarativeMode) {
      this.buildTabConfigs();
    }
  }

  @Listen('slotchange')
  handleSlotChange() {
    this.buildTabConfigs();
  }

  componentWillLoad() {
    this.buildTabConfigs();
  }

  connectedCallback() {
    // Watch for dynamic changes to children
    this.mutationObserver = new MutationObserver(() => {
      this.buildTabConfigs();
    });
    this.mutationObserver.observe(this.el, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  disconnectedCallback() {
    this.mutationObserver?.disconnect();
  }

  private async buildTabConfigs() {
    // Check for le-tab-panel children
    const panels = Array.from(this.el.querySelectorAll(':scope > le-tab-panel')) as Array<
      HTMLElement & {
        getTabConfig: () => Promise<TabConfig>;
        setActive: (active: boolean) => Promise<void>;
      }
    >;

    if (panels.length > 0) {
      // Declarative mode - build from children
      this.isDeclarativeMode = true;
      const configs: TabConfig[] = [];

      for (const panel of panels) {
        const config = await panel.getTabConfig();
        configs.push({ ...config, panel });
      }

      this.tabConfigs = configs;
    } else if (this.tabs.length > 0) {
      // Programmatic mode - use tabs prop
      this.isDeclarativeMode = false;
      this.tabConfigs = this.tabs.map(tab => ({
        label: tab.label,
        value: (tab.value !== undefined ? tab.value : tab.label) as string,
        iconStart: tab.iconStart,
        iconEnd: tab.iconEnd,
        disabled: tab.disabled ?? false,
      }));
    } else {
      this.tabConfigs = [];
    }

    // Set default selected
    if (this.selected === undefined && this.tabConfigs.length > 0) {
      const firstEnabled = this.tabConfigs.find(t => !t.disabled);
      if (firstEnabled) {
        this.selected = firstEnabled.value;
      }
    }

    // Initialize focused index
    if (this.selected !== undefined) {
      const index = this.tabConfigs.findIndex(t => t.value === this.selected);
      if (index >= 0) {
        this.focusedIndex = index;
      }
    }

    // Update panel active states
    this.updatePanelStates();
  }

  private async updatePanelStates() {
    if (!this.isDeclarativeMode) return;

    for (const config of this.tabConfigs) {
      if (config.panel) {
        const isActive = config.value === this.selected;
        await config.panel.setActive(isActive);
      }
    }
  }

  private selectTab(config: TabConfig) {
    if (config.disabled) return;

    this.selected = config.value;
    this.leTabChange.emit({
      value: config.value,
      option: {
        label: config.label,
        value: config.value,
        iconStart: config.iconStart,
        iconEnd: config.iconEnd,
        disabled: config.disabled,
      },
    });
  }

  private handleTabClick = (config: TabConfig) => {
    this.selectTab(config);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const { tabConfigs, orientation } = this;
    const isHorizontal = orientation === 'horizontal';

    let newIndex = this.focusedIndex;

    switch (event.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = this.findNextEnabledTab(-1);
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          newIndex = this.findNextEnabledTab(1);
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          event.preventDefault();
          newIndex = this.findNextEnabledTab(-1);
        }
        break;
      case 'ArrowDown':
        if (!isHorizontal) {
          event.preventDefault();
          newIndex = this.findNextEnabledTab(1);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = this.findFirstEnabledTab();
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.findLastEnabledTab();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (tabConfigs[this.focusedIndex]) {
          this.selectTab(tabConfigs[this.focusedIndex]);
        }
        return;
      default:
        return;
    }

    if (newIndex !== this.focusedIndex) {
      this.focusedIndex = newIndex;
      this.focusTab(newIndex);
      // Auto-select on focus (recommended for tabs)
      if (tabConfigs[newIndex]) {
        this.selectTab(tabConfigs[newIndex]);
      }
    }
  };

  private findNextEnabledTab(direction: 1 | -1): number {
    const { tabConfigs } = this;
    let index = this.focusedIndex;
    const length = tabConfigs.length;

    for (let i = 0; i < length; i++) {
      index = (index + direction + length) % length;
      if (!tabConfigs[index].disabled) {
        return index;
      }
    }
    return this.focusedIndex;
  }

  private findFirstEnabledTab(): number {
    return this.tabConfigs.findIndex(t => !t.disabled);
  }

  private findLastEnabledTab(): number {
    for (let i = this.tabConfigs.length - 1; i >= 0; i--) {
      if (!this.tabConfigs[i].disabled) return i;
    }
    return 0;
  }

  private focusTab(index: number) {
    const tablist = this.el.shadowRoot?.querySelector('[role="tablist"]');
    const tab = tablist?.querySelectorAll('[role="tab"]')[index] as HTMLElement;
    tab?.focus();
  }

  render() {
    const { tabConfigs, selected, orientation, variant, fullWidth, size, isDeclarativeMode } = this;

    const classes = {
      'le-tabs': true,
      [`orientation-${orientation}`]: true,
      [`position-${this.position}`]: true,
      [`variant-${variant}`]: true,
      [`size-${size}`]: true,
      'full-width': fullWidth,
    };

    const tabPosition =
      this.orientation === 'vertical'
        ? this.position
        : this.position === 'start'
        ? 'top'
        : 'bottom';

    return (
      <le-component component="le-tabs" hostClass={classnames(classes)}>
        <div class={classes}>
          <div
            class={{
              'tablist': true,
              'wrap-tabs': this.wrap,
            }}
            role="tablist"
            aria-orientation={orientation}
            part="tablist"
            onKeyDown={this.handleKeyDown}
            tabIndex={0}
          >
            {tabConfigs.map(config => {
              const isSelected = config.value === selected;
              const tabId = `tab-${config.value}`;
              const panelId = `panel-${config.value}`;

              return (
                <le-tab
                  key={config.value}
                  id={tabId}
                  class="tab"
                  mode="default"
                  variant={this.variant}
                  selected={isSelected}
                  disabled={config.disabled}
                  size={this.size}
                  position={tabPosition}
                  align={this.orientation === 'vertical' ? 'start' : 'center'}
                  role="tab"
                  part={isSelected ? 'tab tab-active' : 'tab'}
                  aria-selected={isSelected ? 'true' : 'false'}
                  aria-controls={panelId}
                  aria-disabled={config.disabled ? 'true' : undefined}
                  focusable={false}
                  onClick={() => this.handleTabClick(config)}
                  iconStart={config.iconStart}
                  iconEnd={config.iconEnd}
                >
                  <span class="tab-label">{config.label}</span>
                </le-tab>
              );
            })}
          </div>

          <div class="panels" part="panels">
            {isDeclarativeMode ? (
              // Declarative mode - render slot for le-tab-panel children
              <le-slot
                name=""
                description="Tab panels"
                type="slot"
                allowedComponents="le-tab-panel"
              >
                <slot></slot>
              </le-slot>
            ) : (
              // Programmatic mode - render named slots
              tabConfigs.map(config => {
                const isSelected = config.value === selected;
                const tabId = `tab-${config.value}`;
                const panelId = `panel-${config.value}`;

                return (
                  <div
                    key={config.value}
                    id={panelId}
                    class={{
                      'panel': true,
                      'panel-active': isSelected,
                    }}
                    role="tabpanel"
                    part="panel"
                    aria-labelledby={tabId}
                    tabIndex={0}
                    hidden={!isSelected}
                  >
                    <slot name={`panel-${config.value}`}></slot>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </le-component>
    );
  }
}

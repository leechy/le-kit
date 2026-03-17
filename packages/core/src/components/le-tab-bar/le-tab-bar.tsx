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
  Host,
} from '@stencil/core';
import { LeOption, LeOptionValue, LeOptionSelectDetail } from '../../types/options';

interface TabConfig {
  label: string;
  value: string;
  icon?: string;
  href?: string;
  disabled: boolean;
}

/**
 * A presentational tab bar component without panels.
 *
 * Use this for navigation/routing scenarios where you manage the content
 * externally based on the selection events. For tabs with built-in panels,
 * use `le-tabs` instead.
 *
 * @cssprop --le-tab-bar-border-color - Border color
 * @cssprop --le-tab-bar-gap - Gap between tabs
 * @cssprop --le-tab-bar-indicator-color - Active indicator color
 * @cssprop --le-tab-bar-padding-x - Horizontal padding for tabs
 * @cssprop --le-tab-bar-padding-y - Vertical padding for tabs
 *
 * @csspart tablist - The tab button container
 * @csspart tab - Individual tab buttons
 * @csspart tab-active - The currently active tab
 *
 * @cmsEditable true
 * @cmsCategory Navigation
 */
@Component({
  tag: 'le-tab-bar',
  styleUrl: 'le-tab-bar.css',
  shadow: true,
})
export class LeTabBar {
  @Element() el: HTMLElement;

  /**
   * Array of tab options defining the tabs to display.
   */
  @Prop() tabs: LeOption[] = [];

  /**
   * The value of the currently selected tab.
   */
  @Prop({ mutable: true }) selected?: LeOptionValue;

  /**
   * Whether tabs should stretch to fill available width.
   */
  @Prop() fullWidth: boolean = true;

  /**
   * Whether to show labels in icon-only mode.
   */
  @Prop() showLabels: boolean = false;

  /**
   * Position of the tab bar.
   * @allowedValues top | bottom
   */
  @Prop() position: 'top' | 'bottom' = 'top';

  /**
   * Size of the tabs.
   * @allowedValues small | medium | large
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether to show a border below the tab bar.
   */
  @Prop() bordered: boolean = true;

  /**
   * Internal tab configurations (built from children or tabs prop)
   */
  @State() private tabConfigs: TabConfig[] = [];

  /**
   * Whether we're using declarative mode (le-tab-panel children)
   */
  @State() private isDeclarativeMode: boolean = false;

  /**
   * Internal state for focused tab index (for keyboard navigation)
   */
  @State() private focusedIndex: number = 0;

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
    if (this.selected === undefined && this.tabs.length > 0) {
      const firstEnabled = this.tabs.find(tab => !tab.disabled);
      if (firstEnabled) {
        this.selected = this.getTabValue(firstEnabled);
      }
    }
    if (this.selected !== undefined) {
      const index = this.getTabIndex(this.selected);
      if (index >= 0) {
        this.focusedIndex = index;
      }
    }
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
    const tabs = Array.from(this.el.querySelectorAll(':scope > le-tab')) as Array<
      HTMLElement & {
        getTabConfig: () => Promise<TabConfig>;
        setActive: (active: boolean) => Promise<void>;
      }
    >;

    if (tabs.length > 0) {
      // Declarative mode - build from children
      this.isDeclarativeMode = true;
      const configs: TabConfig[] = [];

      for (const tab of tabs) {
        const config = await tab.getTabConfig();
        configs.push({ ...config });
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
  }

  private getTabValue(tab: LeOption): LeOptionValue {
    return tab.value !== undefined ? tab.value : tab.label;
  }

  private getTabIndex(value: LeOptionValue): number {
    return this.tabs.findIndex(tab => this.getTabValue(tab) === value);
  }

  private selectTab(tab: LeOption) {
    if (tab.disabled) return;

    const value = this.getTabValue(tab);
    this.selected = value;
    this.leTabChange.emit({ value, option: tab });
  }

  private handleTabClick = (tab: LeOption) => {
    this.selectTab(tab);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const { tabConfigs } = this;
    let newIndex = this.focusedIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = this.findNextEnabledTab(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = this.findNextEnabledTab(1);
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
    return this.tabConfigs.findIndex(tab => !tab.disabled);
  }

  private findLastEnabledTab(): number {
    for (let i = this.tabConfigs.length - 1; i >= 0; i--) {
      if (!this.tabConfigs[i].disabled) return i;
    }
    return 0;
  }

  render() {
    const { tabConfigs, selected, size, bordered } = this;

    const classes = {
      'le-tab-bar': true,
      'bordered': bordered,
      'position-top': this.position === 'top',
      'position-bottom': this.position === 'bottom',
    };

    return (
      <Host class={classes}>
        <le-component component="le-tab-bar">
          <div
            class="tablist"
            role="tablist"
            aria-orientation="horizontal"
            part="tablist"
            onKeyDown={this.handleKeyDown}
          >
            <le-slot name="" type="slot" allowedComponents="le-tab">
              {tabConfigs.map(tab => {
                const value = this.getTabValue(tab);
                const isSelected = value === selected;

                return (
                  <le-tab
                    key={value}
                    class="tab"
                    role="tab"
                    variant="icon-only"
                    label={tab.label}
                    value={tab.value}
                    icon={tab.icon}
                    href={tab.href}
                    selected={isSelected}
                    disabled={tab.disabled}
                    showLabel={this.showLabels}
                    size={size}
                    part={isSelected ? 'tab tab-active' : 'tab'}
                    aria-selected={isSelected ? 'true' : 'false'}
                    aria-disabled={tab.disabled ? 'true' : undefined}
                    tabIndex={-1}
                    onClick={() => this.handleTabClick(tab)}
                  >
                    <span class="tab-label">{tab.label}</span>
                  </le-tab>
                );
              })}
            </le-slot>
          </div>
        </le-component>
      </Host>
    );
  }
}

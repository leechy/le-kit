import { Component, Prop, State, Element, Method, Watch, h, Host } from '@stencil/core';
import type { LeCollapseMeta } from '../../types/toolbar';
import type { LeOption } from '../../types/options';
import { classnames } from '../../utils/utils';

const formatDimension = (value?: string | number) => {
  if (value === undefined || value === null) return 'auto';
  const trimmed = String(value).trim();
  if (!trimmed) return 'auto';
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed}px`;
  }
  return trimmed;
};

/**
 * A collapsible toolbar item wrapper component that collapses to an icon trigger when space is constrained,
 * and expands with smooth Liquid Glass transitions either automatically or interactively.
 *
 * @slot - Main content (e.g. input, select, custom content)
 * @slot trigger - Custom content to replace the default icon button trigger
 * @slot close-button - Custom content to replace the default close button
 */
@Component({
  tag: 'le-toolbar-item',
  styleUrl: 'le-toolbar-item.css',
  shadow: true,
})
export class LeToolbarItem {
  @Element() el!: HTMLElement;

  @State() private isExpanded: boolean = false;

  private originalPriority: string | null = null;

  /**
   * The current collapse state.
   * Can be 'collapsed' (renders trigger icon) or 'expanded' (renders full slot contents).
   * Typically synced automatically by le-toolbar.
   */
  @Prop({ mutable: true, reflect: true }) collapse?: 'collapsed' | 'expanded';

  /**
   * Icon name for the collapsed button trigger.
   */
  @Prop() icon?: string;

  /**
   * Icon name for the close button.
   */
  @Prop() closeIcon: string = 'clear';

  /**
   * Whether to display the close button in the expanded state.
   */
  @Prop() showClose: boolean = false;

  /**
   * Exclude this item from the overflow menu if it overflows entirely.
   */
  @Prop() excludeFromOverflow: boolean = false;

  /**
   * Optional custom min-width for the expanded content.
   */
  @Prop() minWidth?: string | number;

  /**
   * Optional custom max-width for the expanded content.
   */
  @Prop() maxWidth?: string | number;

  @Watch('collapse')
  handleCollapseChange(newCollapse?: 'collapsed' | 'expanded') {
    if (newCollapse !== 'collapsed') {
      this.isExpanded = false;
    }
  }

  componentWillLoad() {
    this.originalPriority = this.el.getAttribute('priority');
  }

  @Method()
  async expand() {
    this.isExpanded = true;
    this.el.setAttribute('priority', '-10000');
    this.el.setAttribute('data-le-expanded', 'true');
    this.el.removeAttribute('collapse');
  }

  @Method()
  async collapseItem() {
    this.isExpanded = false;
    this.el.removeAttribute('data-le-expanded');
    if (this.originalPriority !== null) {
      this.el.setAttribute('priority', this.originalPriority);
    } else {
      this.el.removeAttribute('priority');
    }
  }

  @Method()
  async getCollapseMeta(): Promise<LeCollapseMeta> {
    return {
      kind: 'stepping',
      collapseValues: ['collapsed'],
      managesVisibility: false,
      excludeFromOverflowMenu: this.excludeFromOverflow,
      overflowOption: this.excludeFromOverflow ? undefined : await this.getOverflowOption(),
    };
  }

  private async getOverflowOption(): Promise<LeOption> {
    const label =
      this.el.getAttribute('label') ||
      this.el.textContent?.trim() ||
      this.el.getAttribute('aria-label') ||
      this.el.id ||
      'Item';

    return {
      id: this.el.id,
      label,
      value: this.el.id,
      disabled: this.el.hasAttribute('disabled'),
      iconStart: this.icon ? `<le-icon name="${this.icon}"></le-icon>` : undefined,
    };
  }

  private handleExpandClick = (ev: any) => {
    ev.stopPropagation();
    void this.expand();
  };

  private handleCollapseClick = (ev: any) => {
    ev.stopPropagation();
    void this.collapseItem();
  };

  private handleHostClick = (ev: any) => {
    const isExpanded = this.isExpanded || this.el.hasAttribute('data-le-expanded');
    const isCurrentlyCollapsed = this.collapse === 'collapsed' && !isExpanded;
    if (isCurrentlyCollapsed) {
      ev.stopPropagation();
      void this.expand();
    }
  };

  render() {
    const isExpanded = this.isExpanded || this.el.hasAttribute('data-le-expanded');
    const isCollapsed = this.collapse === 'collapsed' && !isExpanded;
    const isVirtual = this.el.hasAttribute('data-le-virtual');

    const formattedMinWidth = formatDimension(this.minWidth);
    const formattedMaxWidth = isVirtual ? formattedMinWidth : formatDimension(this.maxWidth);

    const containerStyle = {
      '--le-toolbar-item-expanded-min-width': formattedMinWidth,
      '--le-toolbar-item-expanded-max-width': formattedMaxWidth,
    };

    return (
      <Host
        onClick={this.handleHostClick}
        class={classnames({
          'is-collapsed': isCollapsed,
          'is-expanded': !isCollapsed,
        })}
      >
        <div class="toolbar-item-container" style={containerStyle}>
          {/* Collapsed view (icon/button) */}
          <le-visibility
            state={isCollapsed ? 'visible' : 'collapsed'}
            mode="width"
            class="collapsed-trigger-visibility"
          >
            <div class="collapsed-trigger-wrap">
              <slot name="trigger">
                {this.icon && (
                  <le-button
                    iconOnly=""
                    variant="clear"
                    onClick={this.handleExpandClick}
                  >
                    <le-icon name={this.icon} slot="icon-only" />
                  </le-button>
                )}
              </slot>
            </div>
          </le-visibility>

          {/* Expanded view (slotted element + close button) */}
          <le-visibility
            state={isCollapsed ? 'collapsed' : 'visible'}
            mode="width"
            class="expanded-content-visibility"
          >
            <div class="expanded-content-wrap">
              <div class="content-slot-container">
                <slot />
              </div>
              {this.showClose && isExpanded && (
                <div class="close-button-container">
                  <slot name="close-button">
                    <le-button
                      iconOnly=""
                      variant="clear"
                      onClick={this.handleCollapseClick}
                    >
                      <le-icon name={this.closeIcon} slot="icon-only" />
                    </le-button>
                  </slot>
                </div>
              )}
            </div>
          </le-visibility>
        </div>
      </Host>
    );
  }

  @Method()
  async whenLayoutSettled(): Promise<void> {
    const visibilities = Array.from(this.el.shadowRoot?.querySelectorAll('le-visibility') ?? []) as any[];
    await Promise.all(
      visibilities.map(async vis => {
        if (vis.componentOnReady) {
          await vis.componentOnReady();
        }
      }),
    );
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

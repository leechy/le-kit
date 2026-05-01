import { Component, Prop, Event, EventEmitter, Method, Watch, h, Host } from '@stencil/core';
import type { LeOption } from '../../types/options';
import { parseOptionInput } from '../../utils/utils';
import type { LeNavigationItemSelectDetail } from '../le-navigation/le-navigation';

export type LeOverflowMenuItem = LeOption;

export interface LeOverflowMenuItemSelectDetail {
  id: string;
  item: LeOverflowMenuItem;
  originalEvent: MouseEvent | KeyboardEvent;
}

@Component({
  tag: 'le-overflow-menu',
  styleUrl: 'le-overflow-menu.css',
  shadow: true,
})
export class LeOverflowMenu {
  private popoverEl?: HTMLLePopoverElement;

  private navigationEl?: HTMLLeNavigationElement;

  private triggerEl?: HTMLElement;

  /**
   * Whether the menu popover is open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Disables trigger interactions.
   */
  @Prop() disabled: boolean = false;

  /**
   * Popover position.
   */
  @Prop() position: 'top' | 'right' | 'bottom' | 'left' = 'bottom';

  /**
   * Popover alignment relative to trigger.
   */
  @Prop() align: 'start' | 'center' | 'end' = 'end';

  /**
   * Popover offset in px.
   */
  @Prop() offset: number = 8;

  /**
   * Minimum popover width.
   */
  @Prop() minWidth: string = '160px';

  /**
   * Fallback icon name for trigger.
   */
  @Prop() icon: string = 'ellipsis-horizontal';

  /**
   * Aria label for fallback trigger button.
   */
  @Prop() triggerAriaLabel: string = 'Open menu';

  /**
   * Part name for fallback trigger button.
   */
  @Prop() triggerPart: string = 'trigger-button';

  /**
   * List of menu items represented as options.
   */
  @Prop() items: LeOverflowMenuItem[] | string = [];

  @Event({ cancelable: true })
  leOverflowMenuItemSelect!: EventEmitter<LeOverflowMenuItemSelectDetail>;

  @Event() leOverflowMenuClose!: EventEmitter<void>;

  @Watch('open')
  handleOpenChange(nextOpen: boolean) {
    if (!this.popoverEl || this.popoverEl.open === nextOpen) {
      return;
    }

    if (nextOpen) {
      void this.popoverEl.show();
    } else {
      void this.popoverEl.hide();
    }
  }

  componentWillLoad() {}

  @Method()
  async show() {
    if (this.disabled) return;
    await this.popoverEl?.show();
  }

  @Method()
  async hide() {
    await this.popoverEl?.hide();
  }

  @Method()
  async toggle() {
    if (this.disabled) return;
    await this.popoverEl?.toggle();
  }

  private parseItems(input: LeOverflowMenuItem[] | string): LeOverflowMenuItem[] {
    return parseOptionInput(input, 'le-overflow-menu', 'items');
  }

  private handlePopoverOpen = () => {
    if (this.open) return;
    this.open = true;

    requestAnimationFrame(() => {
      void this.navigationEl?.focusActiveItem();
    });
  };

  private handlePopoverClose = () => {
    if (!this.open) return;
    this.open = false;
    this.leOverflowMenuClose.emit();

    requestAnimationFrame(() => {
      this.triggerEl?.focus();
    });
  };

  private handleItemClick = (event: MouseEvent | KeyboardEvent, item: LeOverflowMenuItem) => {
    if (item.disabled) return;

    const emitted = this.leOverflowMenuItemSelect.emit({
      id: item.id || String(item.value ?? item.label),
      item,
      originalEvent: event,
    });

    if (!emitted.defaultPrevented) {
      this.open = false;
    }
  };

  private handleNavigationSelect = (event: CustomEvent<LeNavigationItemSelectDetail>) => {
    const { item, id, originalEvent } = event.detail;

    // Keep event local to this component, but preserve native link navigation.
    originalEvent.stopPropagation();

    this.handleItemClick(originalEvent, {
      ...item,
      id: item.id || id,
    });
  };

  private renderItems(items: LeOverflowMenuItem[]) {
    return (
      <le-navigation
        ref={el => (this.navigationEl = el)}
        orientation="vertical"
        items={items}
        onLeNavItemSelect={this.handleNavigationSelect}
      />
    );
  }

  render() {
    const parsedItems = this.parseItems(this.items);
    if (parsedItems.length === 0) {
      return <Host />;
    }

    return (
      <Host>
        <le-popover
          ref={el => (this.popoverEl = el)}
          mode="default"
          offset={8}
          showClose={false}
          closeOnClickOutside={true}
          closeOnEscape={true}
          open={this.open}
          position={this.position}
          align={this.align}
          minWidth={this.minWidth}
          onLePopoverOpen={this.handlePopoverOpen}
          onLePopoverClose={this.handlePopoverClose}
        >
          <div
            ref={el => (this.triggerEl = el)}
            slot="trigger"
            part="trigger"
            onClick={
              this.disabled
                ? (event: MouseEvent) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                : undefined
            }
          >
            <slot name="trigger">
              <le-button
                variant="clear"
                disabled={this.disabled}
                aria-label={this.triggerAriaLabel}
                part={this.triggerPart}
              >
                <le-icon slot="icon-only" class="more-icon" name={this.icon} />
              </le-button>
            </slot>
          </div>
          {this.renderItems(parsedItems)}
        </le-popover>
      </Host>
    );
  }
}

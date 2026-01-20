import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Watch,
  h,
  Host,
  Fragment,
} from '@stencil/core';
import { LeOption } from '../../types/options';
import { classnames, generateId } from '../../utils/utils';

export interface LeBreadcrumbSelectDetail {
  item: LeOption;
  id: string;
  href?: string;
  originalEvent: MouseEvent | KeyboardEvent;
}

@Component({
  tag: 'le-breadcrumbs',
  styleUrl: 'le-breadcrumbs.css',
  shadow: true,
})
export class LeBreadcrumbs {
  @Element() el: HTMLElement;

  /**
   * Breadcrumb items (supports JSON string).
   */
  @Prop() items: LeOption[] | string = [];

  /**
   * Accessible label for the breadcrumbs navigation.
   */
  @Prop() label: string = 'Breadcrumbs';

  /**
   * Separator icon name (used if no separator slot is provided).
   */
  @Prop() separatorIcon: string = 'chevron-right';

  /**
   * Overflow behavior: collapse (default), wrap, or scroll.
   */
  @Prop() overflowMode: 'collapse' | 'wrap' | 'scroll' = 'collapse';

  /**
   * Minimum visible items before collapsing.
   */
  @Prop() minVisibleItems: number = 2;

  /**
   * Emitted when a breadcrumb item is selected.
   */
  @Event({ cancelable: true }) leBreadcrumbSelect: EventEmitter<LeBreadcrumbSelectDetail>;

  @State() private hiddenIndices: number[] = [];
  @State() private separatorTemplate: string = '';

  private listEl?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private instanceId: string = generateId('le-breadcrumbs');
  private recomputeQueued: boolean = false;

  componentDidLoad() {
    this.setupResizeObserver();
    this.scheduleOverflowRecompute();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
  }

  @Watch('items')
  @Watch('overflowMode')
  @Watch('minVisibleItems')
  handleInputsChange() {
    this.scheduleOverflowRecompute();
  }

  private setupResizeObserver() {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;
    this.resizeObserver = new ResizeObserver(() => this.scheduleOverflowRecompute());
    this.resizeObserver.observe(this.el);
  }

  private get parsedItems(): LeOption[] {
    if (typeof this.items === 'string') {
      try {
        return JSON.parse(this.items);
      } catch {
        return [];
      }
    }
    return this.items;
  }

  private getItemId(item: LeOption, index: number): string {
    return item.id ?? `${this.instanceId}:${index}`;
  }

  private handleSeparatorSlotChange = (ev: Event) => {
    const slot = ev.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    const html = nodes
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          return (node as HTMLElement).outerHTML || '';
        }
        return '';
      })
      .join('')
      .trim();

    this.separatorTemplate = html;
    this.scheduleOverflowRecompute();
  };

  private scheduleOverflowRecompute() {
    if (this.overflowMode !== 'collapse') {
      if (this.hiddenIndices.length) {
        this.hiddenIndices = [];
      }
      return;
    }

    if (this.recomputeQueued) return;
    this.recomputeQueued = true;
    requestAnimationFrame(() => this.recomputeOverflow());
  }

  private nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  private async recomputeOverflow() {
    this.recomputeQueued = false;

    if (this.overflowMode !== 'collapse') {
      return;
    }

    const items = this.parsedItems;
    if (!this.listEl || items.length <= Math.max(2, this.minVisibleItems)) {
      if (this.hiddenIndices.length) {
        this.hiddenIndices = [];
      }
      return;
    }

    // Reset hidden items first
    if (this.hiddenIndices.length) {
      this.hiddenIndices = [];
      await this.nextFrame();
    }

    const containerWidth = this.listEl.clientWidth;
    if (!containerWidth) return;

    const candidates = items.map((_, idx) => idx).slice(1, -1);
    const hidden: number[] = [];

    let attempts = 0;
    while (
      this.listEl.scrollWidth > containerWidth &&
      attempts < candidates.length &&
      items.length - hidden.length > this.minVisibleItems
    ) {
      const next = candidates.shift();
      if (next === undefined) break;
      hidden.push(next);
      this.hiddenIndices = [...hidden];
      await this.nextFrame();
      attempts += 1;
    }

    // If still overflowing, hide first then last as a last resort
    if (
      this.listEl.scrollWidth > containerWidth &&
      items.length - hidden.length > this.minVisibleItems
    ) {
      if (!hidden.includes(0)) {
        hidden.unshift(0);
        this.hiddenIndices = [...hidden];
        await this.nextFrame();
      }
    }

    if (
      this.listEl.scrollWidth > containerWidth &&
      items.length - hidden.length > this.minVisibleItems
    ) {
      const lastIndex = items.length - 1;
      if (!hidden.includes(lastIndex)) {
        hidden.push(lastIndex);
        this.hiddenIndices = [...hidden];
        await this.nextFrame();
      }
    }
  }

  private handleItemClick = (item: LeOption, id: string, ev: MouseEvent) => {
    const href = (item as any).href || (item as any).url;
    this.leBreadcrumbSelect.emit({ item, id, href, originalEvent: ev });
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    const focusables = Array.from(
      this.el.shadowRoot?.querySelectorAll<HTMLElement>('a,button,[tabindex="0"]') || [],
    );

    if (focusables.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = focusables.findIndex(el => el === current);
    if (idx === -1) return;

    ev.preventDefault();
    const nextIdx = ev.key === 'ArrowRight' ? idx + 1 : idx - 1;
    const target = focusables[(nextIdx + focusables.length) % focusables.length];
    target?.focus();
  };

  private renderSeparator() {
    console.log('separatorTemplate', this.separatorTemplate || 'no-template', this.separatorIcon);
    if (this.separatorTemplate) {
      return <span class="separator" aria-hidden="true" innerHTML={this.separatorTemplate}></span>;
    }

    return (
      <span class="separator" aria-hidden="true">
        <le-icon name={this.separatorIcon} />
      </span>
    );
  }

  private renderItem(item: LeOption, index: number) {
    const id = this.getItemId(item, index);
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isCurrent = !!item.selected;

    const itemClass = classnames('item', { current: isCurrent });
    const icontent = item.icon || item.iconStart;
    const content = (
      <le-button
        slot={hasChildren ? 'trigger' : undefined}
        variant="clear"
        color="secondary"
        class={itemClass}
        onClick={ev => this.handleItemClick(item, id, ev)}
        aria-haspopup="menu"
        aria-current={isCurrent ? 'page' : null}
        part={item.part}
        iconStart={icontent}
      >
        <span class="item-label">{item.label}</span>
      </le-button>
    );

    if (hasChildren) {
      return (
        <le-popover position="bottom" align="start" show-close="false" class="item-popover">
          {content}
          <le-navigation
            orientation="vertical"
            items={item.children as LeOption[]}
            style={{ minWidth: '200px' }}
          ></le-navigation>
        </le-popover>
      );
    }

    return content;
  }

  private renderMore(hiddenItems: LeOption[]) {
    if (hiddenItems.length === 0) return null;

    return (
      <le-popover position="bottom" align="start" show-close="false">
        <button slot="trigger" class="more-trigger" type="button" aria-haspopup="menu">
          <slot name="more-trigger">
            <le-icon name="ellipsis-horizontal" />
          </slot>
        </button>
        <le-navigation
          orientation="vertical"
          items={hiddenItems}
          style={{ minWidth: '200px' }}
        ></le-navigation>
      </le-popover>
    );
  }

  render() {
    const items = this.parsedItems;
    const indexedItems = items.map((item, index) => ({ item, index }));
    const hiddenSet = new Set(this.hiddenIndices);
    const hiddenItems = indexedItems.filter(({ index }) => hiddenSet.has(index));
    const visibleItems = indexedItems.filter(({ index }) => !hiddenSet.has(index));
    const shouldCollapse = this.overflowMode === 'collapse' && hiddenItems.length > 0;

    const firstVisible = visibleItems[0];
    const remainingVisible = visibleItems.slice(1);
    const firstHidden = hiddenSet.has(0);

    return (
      <Host onKeyDown={this.handleKeyDown}>
        <nav class="breadcrumbs" aria-label={this.label}>
          <slot name="start"></slot>

          <div
            class={classnames('list', {
              wrap: this.overflowMode === 'wrap',
              scroll: this.overflowMode === 'scroll',
            })}
            ref={el => (this.listEl = el as HTMLElement)}
          >
            {!firstHidden && firstVisible
              ? this.renderItem(firstVisible.item, firstVisible.index)
              : null}

            {shouldCollapse && !firstHidden && firstVisible ? this.renderSeparator() : null}
            {shouldCollapse ? this.renderMore(hiddenItems.map(h => h.item)) : null}

            {(firstHidden ? visibleItems : remainingVisible).map(({ item, index }, i) => (
              <Fragment>
                {this.renderSeparator()}
                <span class="crumb" key={`${item.label}-${index}-${i}`}>
                  {this.renderItem(item, index)}
                </span>
              </Fragment>
            ))}
          </div>

          <slot name="end"></slot>
        </nav>

        <span class="hidden-slot" aria-hidden="true">
          <slot name="separator" onSlotchange={this.handleSeparatorSlotChange}></slot>
        </span>
      </Host>
    );
  }
}

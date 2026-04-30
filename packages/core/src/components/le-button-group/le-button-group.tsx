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
} from '@stencil/core';
import { generateId } from '../../utils/utils';
import { LeOverflowMenuItemSelectDetail } from '../le-overflow-menu/le-overflow-menu';
import type { LeOption } from '../../types/options';

interface RankedButton {
  id: string;
  element: HTMLElement;
  index: number;
  priority: number;
}

/**
 * Groups multiple `le-button` elements and optionally collapses low-priority actions
 * into an overflow "more" menu.
 *
 * @slot - Group button elements (`le-button` children)
 * @slot more - Custom icon/content for the overflow trigger button
 *
 * @csspart group - The grouped buttons frame
 * @csspart more-button - The overflow trigger button
 *
 * @cmsEditable true
 * @cmsCategory Actions
 */
@Component({
  tag: 'le-button-group',
  styleUrl: 'le-button-group.css',
  shadow: true,
})
export class LeButtonGroup {
  @Element() el!: HTMLElement;

  /**
   * Collapse mode.
   *
   * - `true`: show only the top-priority button
   * - positive number: show top N buttons
   * - `0`: show only the more button
   * - negative number: hide abs(N) lowest-priority buttons
   *
   * Non-integers are rounded with `Math.round`.
   */
  @Prop() collapse?: boolean | number | string;

  @State() private overflowItems: LeOption[] = [];

  @State() private hasOverflow: boolean = false;

  private mutationObserver?: MutationObserver;

  private instanceId: string = generateId('le-button-group');

  private syncingLayout: boolean = false;

  private pendingSync: boolean = false;

  private buttonMap: Map<string, HTMLElement> = new Map();

  @Event() leOverflowSelect!: EventEmitter<{ id: string }>;

  @Watch('collapse')
  handleCollapseChange() {
    void this.syncLayout();
  }

  componentWillLoad() {
    void this.syncLayout();
  }

  componentDidLoad() {
    // Ensure layout is synced after first paint, when all light-DOM children are upgraded.
    requestAnimationFrame(() => void this.syncLayout());
  }

  connectedCallback() {
    this.mutationObserver = new MutationObserver(() => {
      void this.syncLayout();
    });

    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['priority', 'disabled', 'id', 'slot'],
    });
  }

  disconnectedCallback() {
    this.mutationObserver?.disconnect();
  }

  private getButtonChildren(): HTMLElement[] {
    return Array.from(this.el.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        node.tagName.toLowerCase() === 'le-button' &&
        !node.hasAttribute('slot'),
    );
  }

  private getButtonId(button: HTMLElement, index: number): string {
    const existing = button.dataset.leButtonGroupId;
    if (existing) return existing;

    const id = button.id || `${this.instanceId}-item-${index}`;
    button.dataset.leButtonGroupId = id;
    return id;
  }

  private getButtonPriority(button: HTMLElement, index: number): number {
    const raw = button.getAttribute('priority');

    if (raw === null || raw === undefined || raw.trim() === '') {
      return 1000 + index;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return 1000 + index;
    }

    return parsed;
  }

  private parseCollapseValue(totalButtons: number): { active: boolean; visibleCount: number } {
    if (
      this.collapse === undefined ||
      this.collapse === null ||
      this.collapse === false ||
      this.collapse === 'false'
    ) {
      return { active: false, visibleCount: totalButtons };
    }

    if (this.collapse === true || this.collapse === '' || this.collapse === 'true') {
      return { active: true, visibleCount: Math.min(1, totalButtons) };
    }

    const numeric = Number(this.collapse);

    if (!Number.isFinite(numeric)) {
      return { active: true, visibleCount: Math.min(1, totalButtons) };
    }

    const rounded = Math.round(numeric);

    if (rounded > 0) {
      return { active: true, visibleCount: Math.min(rounded, totalButtons) };
    }

    if (rounded === 0) {
      return { active: true, visibleCount: 0 };
    }

    const visibleCount = Math.max(0, totalButtons - Math.abs(rounded));
    return { active: true, visibleCount };
  }

  private async buildOverflowOption(item: RankedButton): Promise<LeOption> {
    const buttonLike = item.element as HTMLElement & {
      getOption?: () => Promise<LeOption>;
    };

    if (typeof buttonLike.getOption === 'function') {
      try {
        const option = await buttonLike.getOption();
        return {
          ...option,
          id: option.id || item.id,
          value: option.value ?? option.id ?? option.label,
          disabled: option.disabled ?? item.element.hasAttribute('disabled'),
        };
      } catch {
        // Fall back to a lightweight extraction if custom method fails.
      }
    }

    const label =
      item.element.getAttribute('label') ||
      item.element.textContent?.trim() ||
      item.element.getAttribute('aria-label') ||
      item.id;

    return {
      id: item.id,
      label,
      value: item.id,
      disabled: item.element.hasAttribute('disabled'),
      className: item.element.className || undefined,
      part: item.element.getAttribute('part') || undefined,
      href: item.element.getAttribute('href') || undefined,
      target: item.element.getAttribute('target') || undefined,
    };
  }

  private async syncLayout() {
    if (this.syncingLayout) {
      this.pendingSync = true;
      return;
    }

    this.syncingLayout = true;
    this.pendingSync = false;

    try {
      const buttons = this.getButtonChildren();
      const ranked: RankedButton[] = buttons
        .map((button, index) => ({
          id: this.getButtonId(button, index),
          element: button,
          index,
          priority: this.getButtonPriority(button, index),
        }))
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.index - b.index;
        });

      this.buttonMap = new Map(ranked.map(item => [item.id, item.element]));

      const { active, visibleCount } = this.parseCollapseValue(ranked.length);

      const visibleIds = new Set<string>(
        active ? ranked.slice(0, visibleCount).map(item => item.id) : ranked.map(item => item.id),
      );

      const visibleDomIds = buttons
        .map((button, index) => this.getButtonId(button, index))
        .filter(id => visibleIds.has(id));

      const firstVisibleDomId = visibleDomIds[0];
      const lastVisibleDomId = visibleDomIds[visibleDomIds.length - 1];

      ranked.forEach(item => {
        const visible = visibleIds.has(item.id);
        item.element.setAttribute('visibility', visible ? 'visible' : 'collapsed');

        item.element.removeAttribute('data-le-group-overflow');
        item.element.removeAttribute('data-le-group-visible');
        item.element.removeAttribute('data-le-group-pos');

        if (visibleDomIds.length <= 1) {
          item.element.setAttribute('group-shape', 'single');
        } else if (visible) {
          if (item.id === firstVisibleDomId) {
            item.element.setAttribute('group-shape', 'start');
          } else if (item.id === lastVisibleDomId) {
            item.element.setAttribute('group-shape', 'end');
          } else {
            item.element.setAttribute('group-shape', 'middle');
          }
        } else {
          item.element.setAttribute('group-shape', 'middle');
        }
      });

      const overflowRanked = ranked.filter(item => !visibleIds.has(item.id));
      const overflow = await Promise.all(
        overflowRanked
          .slice()
          .sort((a, b) => a.index - b.index)
          .map(item => this.buildOverflowOption(item)),
      );

      const hasOverflow = overflow.length > 0;

      // Avoid unnecessary state writes that can trigger re-renders and extra observer churn.
      const prevIds = this.overflowItems.map(item => item.id).join('|');
      const nextIds = overflow.map(item => item.id).join('|');

      if (prevIds !== nextIds) {
        this.overflowItems = overflow;
      }

      if (this.hasOverflow !== hasOverflow) {
        this.hasOverflow = hasOverflow;
      }
    } finally {
      this.syncingLayout = false;
      if (this.pendingSync) {
        this.pendingSync = false;
        void this.syncLayout();
      }
    }
  }

  private handleOverflowSelect = (event: CustomEvent<LeOverflowMenuItemSelectDetail>) => {
    const { id } = event.detail;
    const original = this.buttonMap.get(id);

    this.leOverflowSelect.emit({ id });

    if (!original || original.hasAttribute('disabled')) {
      return;
    }

    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    original.dispatchEvent(click);
  };

  render() {
    return (
      <Host>
        <le-component component="le-button-group">
          <div class="button-group" part="group">
            <slot />
            {this.hasOverflow && (
              <le-overflow-menu
                class="button-group-overflow"
                items={this.overflowItems}
                icon="chevron-down"
                triggerAriaLabel="More actions"
                triggerPart="more-button"
                onLeOverflowMenuItemSelect={this.handleOverflowSelect}
              ></le-overflow-menu>
            )}
          </div>
        </le-component>
      </Host>
    );
  }
}

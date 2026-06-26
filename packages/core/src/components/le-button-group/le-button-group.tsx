import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  Watch,
  h,
  Host,
} from '@stencil/core';
import { generateId, nextFrame } from '../../utils/utils';
import { LeOverflowMenuItemSelectDetail } from '../le-overflow-menu/le-overflow-menu';
import type { LeOption, LeOptionSelectDetail, LeMultiOptionSelectDetail } from '../../types/options';
import type { LeCollapseMeta } from '../../types/toolbar';

interface RankedButton {
  id: string;
  element: HTMLElement;
  index: number;
  priority: number;
}

export interface LeButtonGroupItemsMeta {
  label: string;
  items: LeOption[];
  visibleCounts: number[];
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
   * Optional label used when the whole group is represented as a parent item
   * inside another component's overflow menu.
   */
  @Prop() label?: string;

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

  /**
   * When true, icons from collapsed buttons are shown in the overflow navigation list.
   */
  @Prop({ reflect: true }) overflowIcons: boolean = false;

  /**
   * Disabled attribute, when the button group is disabled,
   * all buttons inside will be disabled and the overflow menu will not be accessible.
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * Visibility state used by responsive containers such as le-toolbar.
   * @allowedValues visible | collapsing | collapsed | expanding
   */
  @Prop({ reflect: true }) visibility: 'visible' | 'collapsing' | 'collapsed' | 'expanding' =
    'visible';

  /**
   * Selection type: radio (single select) or checkbox (multi select)
   */
  @Prop() type?: 'radio' | 'checkbox';

  /**
   * Selected value(s). If type is 'radio', value is a string. If type is 'checkbox', value is a string or string[].
   */
  @Prop({ reflect: true, mutable: true }) value?: string | string[];

  @State() private overflowItems: LeOption[] = [];

  @State() private hasOverflow: boolean = false;

  @State() private buttonSlots: string[] = [];

  private mutationObserver?: MutationObserver;

  private instanceId: string = generateId('le-button-group');

  private syncingLayout: boolean = false;

  private pendingSync: boolean = false;

  private hasAuthorCollapse: boolean = false;

  private buttonMap: Map<string, HTMLElement> = new Map();

  @Event() leOverflowSelect!: EventEmitter<{ id: string }>;

  @Event() leChange!: EventEmitter<LeOptionSelectDetail | LeMultiOptionSelectDetail>;

  @Watch('collapse')
  handleCollapseChange() {
    void this.syncLayout();
  }

  @Watch('overflowIcons')
  handleOverflowIconsChange() {
    void this.syncLayout();
  }

  @Watch('disabled')
  handleDisabledChange(newValue: boolean) {
    this.setDisabledState(newValue);
  }

  @Watch('value')
  handleValueChange() {
    this.syncSelectionFromValue();
    void this.syncLayout();
  }

  @Watch('type')
  handleTypeChange() {
    this.syncSelectionFromValue();
    void this.syncLayout();
  }

  componentWillLoad() {
    // Capture whether collapse was authored up-front. Runtime collapse updates
    // from le-toolbar should not change this semantic.
    this.hasAuthorCollapse =
      this.collapse !== undefined &&
      this.collapse !== null &&
      this.collapse !== false &&
      this.collapse !== 'false';

    this.setDisabledState(this.disabled);
    this.syncSelectionFromValue();
    void this.syncLayout();
  }

  componentDidLoad() {
    this.syncSelectionFromValue();
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
      attributeFilter: ['priority', 'disabled', 'id', 'slot', 'selected', 'value'],
    });
  }

  disconnectedCallback() {
    this.mutationObserver?.disconnect();
  }

  @Method()
  async getItemsMeta(): Promise<LeButtonGroupItemsMeta> {
    const items = await this.getToolbarOverflowItems();
    return {
      label: this.getGroupLabel(),
      items,
      visibleCounts: this.getToolbarVisibleCountsSync(),
    };
  }

  @Method()
  async getToolbarOverflowGroupOption(): Promise<LeOption> {
    const meta = await this.getItemsMeta();
    return {
      id: this.el.id || this.instanceId,
      label: meta.label,
      value: this.el.id || this.instanceId,
      open: true,
      children: meta.items,
    };
  }

  @Method()
  async whenLayoutSettled(): Promise<void> {
    await this.syncLayout();
    await nextFrame();

    const overflowMenu = this.el.shadowRoot?.querySelector('le-overflow-menu') as
      | (HTMLElement & { componentOnReady?: () => Promise<unknown> })
      | null;

    if (overflowMenu?.componentOnReady) {
      await overflowMenu.componentOnReady();
      await nextFrame();
    }
  }

  @Method()
  async getToolbarOverflowItems(): Promise<LeOption[]> {
    const buttons = this.getButtonChildren();
    const ranked: RankedButton[] = buttons
      .map((button, index) => ({
        id: this.getButtonId(button, index),
        element: button,
        index,
        priority: this.getButtonPriority(button, index),
      }))
      .sort((a, b) => a.index - b.index);

    return Promise.all(ranked.map(item => this.buildOverflowOption(item)));
  }

  /**
   * Returns collapse meta for toolbar integration.
   */
  @Method()
  async getCollapseMeta(): Promise<LeCollapseMeta> {
    // If collapse was authored, treat as item (fully collapsed/expanded only).
    // Runtime values set by le-toolbar during stepping must not flip behavior.
    if (this.hasAuthorCollapse) {
      return {
        kind: 'item',
        managesVisibility: true,
      };
    }
    const visibleCounts = this.getToolbarVisibleCountsSync();
    return {
      kind: 'stepping',
      collapseValues: visibleCounts.map(String),
      managesVisibility: true,
    };
  }

  private getButtonChildren(): HTMLElement[] {
    return Array.from(this.el.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node.tagName.toLowerCase() === 'le-button',
    );
  }

  private syncButtonSlots(buttons: HTMLElement[]): string[] {
    const slotNames = buttons.map((button, index) => {
      const slotName = `__le-button-group-item-${index}`;
      if (button.getAttribute('slot') !== slotName) {
        button.setAttribute('slot', slotName);
      }
      return slotName;
    });

    const changed =
      slotNames.length !== this.buttonSlots.length ||
      slotNames.some((slot, idx) => this.buttonSlots[idx] !== slot);

    if (changed) {
      this.buttonSlots = slotNames;
    }

    return slotNames;
  }

  private getVisibilityState(value: string | null): 'visible' | 'collapsed' {
    return value === 'collapsed' || value === 'collapsing' ? 'collapsed' : 'visible';
  }

  private setDisabledState(disabled: boolean) {
    const buttons = this.getButtonChildren();
    buttons.forEach(button => {
      (button as HTMLButtonElement).disabled = disabled;
    });
    // toggle the buttons in the overflow menu
    this.overflowItems = this.overflowItems.map(item => ({
      ...item,
      disabled,
    }));
  }

  private getGroupLabel(): string {
    return (
      this.label ||
      this.el.getAttribute('label') ||
      this.el.getAttribute('aria-label') ||
      this.el.getAttribute('title') ||
      this.getButtonChildren()[0]?.getAttribute('aria-label') ||
      this.getButtonChildren()[0]?.getAttribute('label') ||
      'Group'
    );
  }

  private isFullyCollapsed(): boolean {
    return this.collapse === 'collapse';
  }

  private getToolbarVisibleCountsSync(): number[] {
    const totalButtons = this.getButtonChildren().length;
    const steps: number[] = [];

    for (let visibleCount = totalButtons - 1; visibleCount >= 1; visibleCount -= 1) {
      steps.push(visibleCount);
    }

    return steps;
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
    let priority = 1000 + index;

    if (raw !== null && raw !== undefined && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        priority = parsed;
      }
    }

    const isSelected = (button as any).selected || button.hasAttribute('selected');
    if (isSelected) {
      priority -= 10000;
    }

    return priority;
  }

  private parseCollapseValue(totalButtons: number): { active: boolean; visibleCount: number } {
    if (this.isFullyCollapsed()) {
      return { active: true, visibleCount: 0 };
    }

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
          // Strip icons when overflowIcons prop is off
          iconStart: this.overflowIcons ? option.iconStart : undefined,
          iconEnd: this.overflowIcons ? option.iconEnd : undefined,
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

    // Extract icon from slot when overflowIcons is enabled
    let iconStart: string | undefined;
    if (this.overflowIcons) {
      const iconStartEl = item.element.querySelector('[slot="icon-start"]');
      const iconOnlyEl = item.element.querySelector('[slot="icon-only"]');
      const sourceEl = iconStartEl ?? iconOnlyEl;
      if (sourceEl) {
        const clone = sourceEl.cloneNode(true) as HTMLElement;
        clone.removeAttribute('slot');
        iconStart = clone.outerHTML;
      } else {
        iconStart = item.element.getAttribute('icon-start') || undefined;
      }
    }

    return {
      id: item.id,
      label,
      value: item.id,
      disabled: item.element.hasAttribute('disabled'),
      className: item.element.className || undefined,
      part: item.element.getAttribute('part') || undefined,
      color: item.element.getAttribute('color') || undefined,
      href: item.element.getAttribute('href') || undefined,
      target: item.element.getAttribute('target') || undefined,
      iconStart,
    };
  }

  private getButtonValue(button: HTMLElement): string {
    const btn = button as any;
    const val = btn.value || button.getAttribute('value');
    if (val !== undefined && val !== null) {
      return String(val);
    }

    const id = button.id;
    const label = btn.label || button.getAttribute('label') || button.getAttribute('aria-label') || button.textContent?.trim();
    return id || label || '';
  }

  private syncSelectionFromValue() {
    if (!this.type) {
      return;
    }

    const buttons = this.getButtonChildren();

    if (this.type === 'radio') {
      const targetValue = this.value;
      buttons.forEach(button => {
        const btnValue = this.getButtonValue(button);
        const isSelected = btnValue === targetValue;
        (button as any).selected = isSelected;
      });
    } else if (this.type === 'checkbox') {
      let targetValues: string[] = [];
      if (Array.isArray(this.value)) {
        targetValues = this.value;
      } else if (typeof this.value === 'string') {
        const trimmed = this.value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            targetValues = JSON.parse(trimmed);
          } catch {
            targetValues = [this.value];
          }
        } else {
          targetValues = [this.value];
        }
      }

      buttons.forEach(button => {
        const btnValue = this.getButtonValue(button);
        const isSelected = targetValues.includes(btnValue);
        (button as any).selected = isSelected;
      });
    }
  }

  private handleFieldsetClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const button = target.closest('le-button');

    if (!button || !this.el.contains(button)) {
      return;
    }

    if (this.disabled || button.hasAttribute('disabled') || (button as any).disabled) {
      return;
    }

    if (this.type === 'radio') {
      await this.selectRadioButton(button);
    } else if (this.type === 'checkbox') {
      await this.toggleCheckboxButton(button);
    }
  };

  private async selectRadioButton(clickedButton: HTMLElement) {
    const btnValue = this.getButtonValue(clickedButton);

    // If already selected, do nothing
    if ((clickedButton as any).selected) {
      return;
    }

    const buttons = this.getButtonChildren();
    buttons.forEach(button => {
      (button as any).selected = button === clickedButton;
    });

    this.value = btnValue;

    // Trigger layout sync synchronously so state and styles are updated immediately!
    void this.syncLayout();

    const option = typeof (clickedButton as any).getOption === 'function'
      ? await (clickedButton as any).getOption()
      : { value: btnValue, label: clickedButton.textContent?.trim() || '' };

    this.leChange.emit({
      value: btnValue,
      option,
    });
  }

  private async toggleCheckboxButton(clickedButton: HTMLElement) {
    const currentSelected = !(clickedButton as any).selected;
    (clickedButton as any).selected = currentSelected;

    const buttons = this.getButtonChildren();
    const selectedButtons = buttons.filter(btn => (btn as any).selected);
    const newValues = selectedButtons.map(btn => this.getButtonValue(btn));

    this.value = newValues;

    // Trigger layout sync synchronously so state and styles are updated immediately!
    void this.syncLayout();

    const options = await Promise.all(
      selectedButtons.map(async btn => {
        return typeof (btn as any).getOption === 'function'
          ? await (btn as any).getOption()
          : { value: this.getButtonValue(btn), label: btn.textContent?.trim() || '' };
      })
    );

    this.leChange.emit({
      values: newValues,
      options,
    });
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
      this.syncButtonSlots(buttons);

      if (this.isFullyCollapsed()) {
        buttons.forEach(button => {
          button.setAttribute('visibility', 'collapsed');
        });

        if (this.overflowItems.length > 0) {
          this.overflowItems = [];
        }

        if (this.hasOverflow) {
          this.hasOverflow = false;
        }

        return;
      }

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
      <Host onClick={this.handleFieldsetClick}>
        <le-component component="le-button-group">
          <fieldset class="button-group" part="group">
            {this.buttonSlots.map(slotName => {
              const button = this.getButtonChildren().find(
                candidate => candidate.getAttribute('slot') === slotName,
              );
              const state = this.getVisibilityState(button?.getAttribute('visibility') ?? null);
              const groupShape = button?.getAttribute('group-shape');

              return (
                <le-visibility
                  class={{
                    'button-group-item-visibility': true,
                    'is-collapsed': state === 'collapsed',
                    'is-middle': groupShape === 'middle',
                    'is-end': groupShape === 'end',
                  }}
                  state={state}
                  mode="width"
                >
                  <slot name={slotName} />
                </le-visibility>
              );
            })}

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
          </fieldset>
        </le-component>
      </Host>
    );
  }
}

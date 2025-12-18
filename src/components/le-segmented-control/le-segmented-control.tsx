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

interface SegmentConfig {
  label: string;
  value: string;
  iconStart?: string;
  iconEnd?: string;
  disabled: boolean;
}

/**
 * A segmented control component (iOS-style toggle buttons).
 *
 * Perfect for toggling between a small set of related options.
 *
 * @cssprop --le-segmented-bg - Background color of the control
 * @cssprop --le-segmented-padding - Padding around segments
 * @cssprop --le-segmented-gap - Gap between segments
 * @cssprop --le-segmented-radius - Border radius of the control
 *
 * @csspart container - The main container
 * @csspart segment - Individual segment buttons
 * @csspart segment-active - The currently active segment
 *
 * @cmsEditable true
 * @cmsCategory Form
 */
@Component({
  tag: 'le-segmented-control',
  styleUrl: 'le-segmented-control.css',
  shadow: true,
})
export class LeSegmentedControl {
  @Element() el: HTMLElement;

  private containerRef?: HTMLElement;

  /**
   * Array of options for the segmented control.
   */
  @Prop() options: LeOption[] = [];

  /**
   * The value of the currently selected option.
   */
  @Prop({ mutable: true }) value?: LeOptionValue;

  /**
   * Size of the control.
   * @allowedValues small | medium | large
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Scroll behavior for overflowing tabs.
   * @allowedValues auto | hidden | visible | scroll
   */
  @Prop() overflow: 'auto' | 'hidden' | 'visible' | 'scroll' = 'auto';

  /**
   * Whether the control should take full width.
   */
  @Prop() fullWidth: boolean = false;

  /**
   * Whether the control is disabled.
   */
  @Prop() disabled: boolean = false;

  /**
   * Internal tab configurations (built from children or tabs prop)
   */
  @State() private segmentConfigs: SegmentConfig[] = [];

  /**
   * Internal state for focused index (keyboard navigation)
   */
  @State() private focusedIndex: number = 0;

  /**
   * Whether we're using declarative mode (le-segment children)
   */
  @State() private isDeclarativeMode: boolean = false;

  /**
   * Emitted when the selection changes.
   */
  @Event() leChange: EventEmitter<LeOptionSelectDetail>;

  private mutationObserver?: MutationObserver;

  @Watch('options')
  tabsChanged() {
    if (!this.isDeclarativeMode) {
      this.buildSegmentsConfigs();
    }
  }

  @Listen('slotchange')
  handleSlotChange() {
    this.buildSegmentsConfigs();
  }

  componentWillLoad() {
    this.buildSegmentsConfigs();
    if (this.value === undefined && this.options.length > 0) {
      const firstEnabled = this.options.find(opt => !opt.disabled);
      if (firstEnabled) {
        this.value = this.getOptionValue(firstEnabled);
      }
    }
    if (this.value !== undefined) {
      const index = this.getOptionIndex(this.value);
      if (index >= 0) {
        this.focusedIndex = index;
      }
    }
  }

  connectedCallback() {
    // Watch for dynamic changes to children
    this.mutationObserver = new MutationObserver(() => {
      this.buildSegmentsConfigs();
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

  private async buildSegmentsConfigs() {
    // Check for le-segment children
    const segments = Array.from(this.el.querySelectorAll(':scope > le-segment')) as Array<
      HTMLElement & {
        getSegmentConfig: () => Promise<SegmentConfig>;
        setActive: (active: boolean) => Promise<void>;
      }
    >;

    if (segments.length > 0) {
      // Declarative mode - build from children
      this.isDeclarativeMode = true;
      const configs: SegmentConfig[] = [];

      for (const segment of segments) {
        const config = await segment.getSegmentConfig();
        configs.push({ ...config });
      }

      this.segmentConfigs = configs;
    } else if (this.options.length > 0) {
      // Programmatic mode - use options prop
      this.isDeclarativeMode = false;
      this.segmentConfigs = this.options.map(option => ({
        label: option.label,
        value: (option.value !== undefined ? option.value : option.label) as string,
        iconStart: option.iconStart,
        iconEnd: option.iconEnd,
        disabled: option.disabled ?? false,
      }));
    } else {
      this.segmentConfigs = [];
    }

    // Set default selected
    if (this.value === undefined && this.segmentConfigs.length > 0) {
      const firstEnabled = this.segmentConfigs.find(t => !t.disabled);
      if (firstEnabled) {
        this.value = firstEnabled.value;
      }
    }

    // Initialize focused index
    if (this.value !== undefined) {
      const index = this.segmentConfigs.findIndex(t => t.value === this.value);
      if (index >= 0) {
        this.focusedIndex = index;
      }
    }
  }

  private getOptionValue(option: LeOption): LeOptionValue {
    return option.value !== undefined ? option.value : option.label;
  }

  private getOptionIndex(value: LeOptionValue): number {
    return this.options.findIndex(opt => this.getOptionValue(opt) === value);
  }

  private selectOption(option: LeOption) {
    if (option.disabled || this.disabled) return;

    const value = this.getOptionValue(option);
    this.value = value;

    // update focused index
    const index = this.segmentConfigs.findIndex(seg => seg.value === value);
    if (index >= 0) {
      this.focusedIndex = index;
    }

    this.leChange.emit({ value, option });
  }

  private handleClick = (option: LeOption) => {
    this.selectOption(option);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const { segmentConfigs } = this;
    let newIndex = this.focusedIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = this.findNextEnabled(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = this.findNextEnabled(1);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = this.findFirstEnabled();
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.findLastEnabled();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (segmentConfigs[this.focusedIndex]) {
          this.selectOption(segmentConfigs[this.focusedIndex]);
        }
        return;
      default:
        return;
    }

    if (newIndex !== this.focusedIndex) {
      this.focusedIndex = newIndex;
      this.focusSegment(newIndex);
      if (segmentConfigs[newIndex]) {
        this.selectOption(segmentConfigs[newIndex]);
      }
    }
  };

  private findNextEnabled(direction: 1 | -1): number {
    const { segmentConfigs } = this;
    let index = this.focusedIndex;
    const length = segmentConfigs.length;

    for (let i = 0; i < length; i++) {
      index = (index + direction + length) % length;
      if (!segmentConfigs[index].disabled) {
        return index;
      }
    }
    return this.focusedIndex;
  }

  private findFirstEnabled(): number {
    return this.segmentConfigs.findIndex(opt => !opt.disabled);
  }

  private findLastEnabled(): number {
    for (let i = this.segmentConfigs.length - 1; i >= 0; i--) {
      if (!this.segmentConfigs[i].disabled) return i;
    }
    return 0;
  }

  private focusSegment(index: number) {
    const container = this.containerRef;
    const segment = container?.querySelectorAll('.segment')[index] as HTMLElement;
    segment?.focus();
  }

  render() {
    const { segmentConfigs, value, size, fullWidth, disabled } = this;

    const classes = {
      'le-segmented-control': true,
      [`size-${size}`]: true,
      [`overflow-${this.overflow}`]: true,
      'full-width': fullWidth,
      'disabled': disabled,
    };

    return (
      <Host class={`overflow-${this.overflow}`}>
        <le-component component="le-segmented-control">
          <div
            class={classes}
            ref={el => (this.containerRef = el)}
            role="radiogroup"
            part="container"
            onKeyDown={this.handleKeyDown}
            tabIndex={0}
          >
            {segmentConfigs.map(option => {
              const optValue = this.getOptionValue(option);
              const isSelected = optValue === value;
              const isDisabled = option.disabled || disabled;

              return (
                <le-tab
                  key={optValue}
                  class="segment"
                  role="radio"
                  variant="enclosed"
                  selected={isSelected}
                  disabled={isDisabled}
                  focusable={false}
                  size={size}
                  part={isSelected ? 'segment segment-active' : 'segment'}
                  aria-checked={isSelected ? 'true' : 'false'}
                  aria-disabled={isDisabled ? 'true' : undefined}
                  onClick={() => this.handleClick(option)}
                  iconStart={option.iconStart}
                  iconEnd={option.iconEnd}
                >
                  <span class="segment-label">{option.label}</span>
                </le-tab>
              );
            })}
          </div>
        </le-component>
      </Host>
    );
  }
}

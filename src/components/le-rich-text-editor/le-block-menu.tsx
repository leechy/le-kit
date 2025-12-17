import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Method,
  State,
  h,
  Host,
  Watch,
  Element,
} from '@stencil/core';
import { BlockType, BlockTypeConfig, DEFAULT_BLOCK_CONFIGS } from '../../types/blocks';

/**
 * Block menu (command palette) for the rich text editor.
 * Triggered by "/" at the start of a block or clicking the block type icon.
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-block-menu',
  styleUrl: 'le-block-menu.css',
  shadow: true,
})
export class LeBlockMenu {
  @Element() el: HTMLElement;
  /**
   * Whether the menu is visible.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Position to show the menu at.
   */
  @Prop() position: { x: number; y: number } = { x: 0, y: 0 };

  /**
   * Available block types.
   */
  @Prop() blockTypes: BlockTypeConfig[] = DEFAULT_BLOCK_CONFIGS;

  /**
   * Emitted when a block type is selected.
   */
  @Event() leBlockTypeSelect: EventEmitter<{ type: BlockType; config: BlockTypeConfig }>;

  /**
   * Emitted when the menu is closed.
   */
  @Event() leMenuClose: EventEmitter<void>;

  @State() private searchQuery: string = '';
  @State() private filteredTypes: BlockTypeConfig[] = [];
  @State() private focusedIndex: number = 0;

  private menuEl?: HTMLElement;
  private searchInputEl?: HTMLInputElement;

  @Watch('open')
  handleOpenChange() {
    if (this.open) {
      this.searchQuery = '';
      this.filteredTypes = this.blockTypes;
      this.focusedIndex = 0;
      setTimeout(() => this.searchInputEl?.focus(), 50);
    }
  }

  @Watch('searchQuery')
  handleSearchChange() {
    this.filterTypes();
    this.focusedIndex = 0;
  }

  componentWillLoad() {
    this.filteredTypes = this.blockTypes;
  }

  private filterTypes() {
    if (!this.searchQuery) {
      this.filteredTypes = this.blockTypes;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredTypes = this.blockTypes.filter(
      type =>
        type.label.toLowerCase().includes(query) ||
        type.description?.toLowerCase().includes(query) ||
        type.shortcut?.toLowerCase().includes(query),
    );
  }

  /**
   * Show the menu.
   */
  @Method()
  async show() {
    this.open = true;
  }

  /**
   * Hide the menu.
   */
  @Method()
  async hide() {
    this.open = false;
    this.searchQuery = '';
    this.leMenuClose.emit();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.filteredTypes.length - 1);
        this.scrollToFocused();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollToFocused();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.filteredTypes[this.focusedIndex]) {
          this.selectBlockType(this.filteredTypes[this.focusedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.hide();
        break;
    }
  };

  private scrollToFocused() {
    const focusedEl = this.menuEl?.querySelector(`[data-index="${this.focusedIndex}"]`);
    focusedEl?.scrollIntoView({ block: 'nearest' });
  }

  private selectBlockType(config: BlockTypeConfig) {
    this.leBlockTypeSelect.emit({ type: config.type, config });
    this.hide();
  }

  private handleClickOutside = (e: MouseEvent) => {
    if (this.open && this.menuEl && !this.menuEl.contains(e.target as Node)) {
      this.hide();
      this.leMenuClose.emit();
    }
  };

  connectedCallback() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  disconnectedCallback() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private renderBlockTypeItem(config: BlockTypeConfig, index: number) {
    return (
      <button
        type="button"
        class={{
          'block-type-item': true,
          'is-focused': index === this.focusedIndex,
        }}
        data-index={index}
        onClick={() => this.selectBlockType(config)}
        onMouseEnter={() => (this.focusedIndex = index)}
      >
        <span class="block-type-icon">{config.icon}</span>
        <div class="block-type-content">
          <span class="block-type-label">{config.label}</span>
          {config.description && <span class="block-type-description">{config.description}</span>}
        </div>
        {config.shortcut && <span class="block-type-shortcut">{config.shortcut}</span>}
      </button>
    );
  }

  render() {
    return (
      <Host class={{ 'is-open': this.open }}>
        {this.open && (
          <div
            ref={el => (this.menuEl = el)}
            class="block-menu-container"
            style={{
              left: `${this.position.x}px`,
              top: `${this.position.y}px`,
            }}
          >
            <div class="block-menu" onKeyDown={this.handleKeyDown}>
              <div class="menu-search">
                <input
                  ref={el => (this.searchInputEl = el)}
                  type="text"
                  class="search-input"
                  placeholder="Filter..."
                  value={this.searchQuery}
                  onInput={e => (this.searchQuery = (e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="menu-list" style={{ maxHeight: 'var(--le-editor-menu-max-height)' }}>
                {this.filteredTypes.length > 0 ? (
                  this.filteredTypes.map((config, index) => this.renderBlockTypeItem(config, index))
                ) : (
                  <div class="menu-empty">No matching blocks</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Host>
    );
  }
}

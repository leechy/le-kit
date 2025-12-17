import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  h,
  Host,
  Watch,
} from '@stencil/core';
import { LeBlock, BlockType, BlockTypeConfig, DEFAULT_BLOCK_CONFIGS } from '../../types/blocks';

/**
 * Internal component representing a single block in the rich text editor.
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-editor-block',
  styleUrl: 'le-editor-block.css',
  shadow: true,
})
export class LeEditorBlock {
  @Element() el: HTMLElement;

  /**
   * The block data.
   */
  @Prop() block: LeBlock;

  /**
   * Whether this block is currently focused.
   */
  @Prop({ reflect: true }) focused: boolean = false;

  /**
   * Whether the editor is in readonly mode.
   */
  @Prop() readonly: boolean = false;

  /**
   * For numbered lists, which number to start at (1-based).
   */
  @Prop() listStart: number = 1;

  /**
   * Emitted when the block content changes.
   */
  @Event() leBlockChange: EventEmitter<{ block: LeBlock; content: string }>;

  /**
   * Emitted when Enter is pressed (request new block).
   */
  @Event() leBlockEnter: EventEmitter<{ block: LeBlock; cursorAtEnd: boolean }>;

  /**
   * Emitted when Backspace is pressed at start of block.
   */
  @Event() leBlockBackspace: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when Delete is pressed at end of block.
   */
  @Event() leBlockDelete: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when arrow up is pressed at start.
   */
  @Event() leBlockNavigateUp: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when arrow down is pressed at end.
   */
  @Event() leBlockNavigateDown: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when block type should change (via markdown shortcut).
   */
  @Event() leBlockTypeChange: EventEmitter<{ block: LeBlock; newType: BlockType }>;

  /**
   * Emitted when block menu should open (via icon click or "/").
   */
  @Event() leBlockMenuOpen: EventEmitter<{
    block: LeBlock;
    position: { x: number; y: number };
    anchor?: HTMLElement;
  }>;

  /**
   * Emitted when block requests focus.
   */
  @Event() leBlockFocus: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when block loses focus.
   */
  @Event() leBlockBlur: EventEmitter<{ block: LeBlock }>;

  /**
   * Emitted when text is selected (for showing format toolbar).
   */
  @Event() leBlockSelection: EventEmitter<{
    block: LeBlock;
    hasSelection: boolean;
    range?: Range;
    rect?: DOMRect;
  }>;

  /**
   * Emitted when drag handle is grabbed.
   */
  @Event() leBlockDragStart: EventEmitter<{ block: LeBlock }>;

  @State() private isEmpty: boolean = true;
  @State() private showControls: boolean = false;

  private contentEl?: HTMLElement;
  private config: BlockTypeConfig;

  @Watch('block')
  handleBlockChange() {
    this.updateConfig();
    this.isEmpty = !this.block?.content || this.block.content.trim() === '';
  }

  componentWillLoad() {
    this.updateConfig();
    this.isEmpty = !this.block?.content || this.block.content.trim() === '';
  }

  componentDidLoad() {
    if (this.contentEl && this.block?.content) {
      this.contentEl.innerHTML = this.block.content;
    }
  }

  private updateConfig() {
    this.config =
      DEFAULT_BLOCK_CONFIGS.find(c => c.type === this.block?.type) || DEFAULT_BLOCK_CONFIGS[0];
  }

  /**
   * Focus the editable content area.
   */
  @Method()
  async focusContent(atEnd: boolean = false) {
    if (!this.contentEl) return;

    this.contentEl.focus();

    if (atEnd && this.contentEl.childNodes.length > 0) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(this.contentEl);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  /**
   * Get the current HTML content.
   */
  @Method()
  async getContent(): Promise<string> {
    return this.contentEl?.innerHTML || '';
  }

  /**
   * Set the HTML content.
   */
  @Method()
  async setContent(html: string) {
    if (this.contentEl) {
      this.contentEl.innerHTML = html;
      this.isEmpty = !html || html.trim() === '';
    }
  }

  private handleInput = () => {
    const content = this.contentEl?.innerHTML || '';
    this.isEmpty = !content || content === '<br>' || content.trim() === '';

    this.leBlockChange.emit({
      block: this.block,
      content: this.isEmpty ? '' : content,
    });
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const sel = window.getSelection();
    const range = sel?.getRangeAt(0);
    const atStart = this.isAtStart(range);
    const atEnd = this.isAtEnd(range);
    const content = this.contentEl?.textContent || '';

    switch (e.key) {
      case 'Enter':
        if (e.shiftKey) {
          // Shift+Enter: soft line break,
          // TODO: we need <br> in html content
          return;
        }
        e.preventDefault();
        this.leBlockEnter.emit({ block: this.block, cursorAtEnd: atEnd });
        break;

      case 'Backspace':
        if (atStart && !sel?.toString()) {
          e.preventDefault();
          this.leBlockBackspace.emit({ block: this.block });
        }
        break;

      case 'Delete':
        if (atEnd && !sel?.toString()) {
          e.preventDefault();
          this.leBlockDelete.emit({ block: this.block });
        }
        break;

      case 'ArrowUp':
        if (atStart) {
          e.preventDefault();
          this.leBlockNavigateUp.emit({ block: this.block });
        }
        break;

      case 'ArrowDown':
        if (atEnd) {
          e.preventDefault();
          this.leBlockNavigateDown.emit({ block: this.block });
        }
        break;

      case ' ':
        // Check for markdown shortcuts
        this.handleMarkdownShortcut(content);
        break;
    }
  };

  private handleMarkdownShortcut(content: string) {
    const shortcuts: Record<string, BlockType> = {
      '#': 'heading1',
      '##': 'heading2',
      '###': 'heading3',
      '-': 'bullet-list',
      '*': 'bullet-list',
      '1.': 'numbered-list',
      '>': 'quote',
      '```': 'code',
    };

    for (const [shortcut, type] of Object.entries(shortcuts)) {
      // Check if content starts with shortcut (exact match or shortcut + space + text)
      if (content === shortcut || content.startsWith(shortcut + ' ')) {
        if (type !== this.block.type) {
          // Get text after the shortcut
          const remainingText = content === shortcut ? '' : content.slice(shortcut.length + 1);

          // Prevent space from being added
          setTimeout(() => {
            if (this.contentEl) {
              this.contentEl.innerHTML = remainingText;
              this.isEmpty = !remainingText;
            }
            this.leBlockTypeChange.emit({ block: this.block, newType: type });
          }, 0);
          return;
        }
      }
    }

    // Check for divider shortcut
    if (content === '---' || content === '***') {
      setTimeout(() => {
        if (this.contentEl) {
          this.contentEl.innerHTML = '';
          this.isEmpty = true;
        }
        this.leBlockTypeChange.emit({ block: this.block, newType: 'divider' });
      }, 0);
    }
  }

  private handleSlashCommand = (e: InputEvent) => {
    // Check if "/" was typed at start of block
    if (e.data === '/') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);

      // Check if we're at the start (offset 0 and at beginning of content)
      // For non-empty content, we need to be at the very start
      const atStart = this.isEmpty || (range.startOffset === 0 && this.isAtStart(range));

      if (atStart) {
        e.preventDefault();

        // Position menu from the block icon
        const iconRect = this.blockIconEl?.getBoundingClientRect();
        if (iconRect) {
          this.leBlockMenuOpen.emit({
            block: this.block,
            position: { x: iconRect.right + 8, y: iconRect.top },
            anchor: this.blockIconEl,
          });
        }
      }
    }
  };

  private handleFocus = () => {
    this.leBlockFocus.emit({ block: this.block });
  };

  private handleBlur = () => {
    this.leBlockBlur.emit({ block: this.block });
  };

  private handleSelectionChange = () => {
    const sel = window.getSelection();
    const hasSelection = sel ? sel.toString().length > 0 : false;

    if (hasSelection && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      this.leBlockSelection.emit({
        block: this.block,
        hasSelection: true,
        range,
        rect,
      });
    } else {
      this.leBlockSelection.emit({
        block: this.block,
        hasSelection: false,
      });
    }
  };

  private handleMouseUp = () => {
    // Delayed to let selection settle
    setTimeout(() => this.handleSelectionChange(), 10);
  };

  private handleDragHandleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    this.leBlockDragStart.emit({ block: this.block });
  };

  private isAtStart(range?: Range): boolean {
    if (!range || !this.contentEl) return true;

    // If no content, we're at start
    if (!this.contentEl.firstChild) return true;

    // Check if at offset 0
    if (range.startOffset !== 0) return false;

    // Check if at the first text node or the contentEl itself
    let node = range.startContainer;
    while (node && node !== this.contentEl) {
      if (node.previousSibling) return false;
      node = node.parentNode;
    }
    return true;
  }

  private isAtEnd(range?: Range): boolean {
    if (!range || !this.contentEl) return true;
    const lastChild = this.contentEl.lastChild;
    if (!lastChild) return true;

    if (range.endContainer === lastChild) {
      const length = lastChild.nodeType === Node.TEXT_NODE ? lastChild.textContent?.length || 0 : 0;
      return range.endOffset === length;
    }
    return false;
  }

  private renderDragHandle() {
    if (this.readonly) return null;

    return (
      <button
        class="block-drag-handle"
        aria-label="Drag to reorder"
        onMouseDown={this.handleDragHandleMouseDown}
        tabIndex={-1}
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </button>
    );
  }

  private blockIconEl?: HTMLElement;

  private handleBlockIconClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use the icon element as anchor for menu positioning
    const rect = this.blockIconEl?.getBoundingClientRect();
    if (rect) {
      this.leBlockMenuOpen.emit({
        block: this.block,
        position: { x: rect.right + 8, y: rect.top },
        anchor: this.blockIconEl,
      });
    }
  };

  private renderBlockIcon() {
    return (
      <button
        ref={el => (this.blockIconEl = el)}
        class="block-type-icon"
        aria-label="Change block type"
        onClick={this.handleBlockIconClick}
        tabIndex={-1}
      >
        {this.config.icon}
      </button>
    );
  }

  private renderContent() {
    // Divider is non-editable
    if (this.block.type === 'divider') {
      return <hr class="block-divider" />;
    }

    const Tag = this.config.tag as any;
    const isList = this.block.type === 'bullet-list' || this.block.type === 'numbered-list';
    const isNumberedList = this.block.type === 'numbered-list';
    const ListWrapper = isNumberedList ? 'ol' : 'ul';

    const editableContent = (
      <Tag
        ref={(el: HTMLElement) => (this.contentEl = el)}
        class={{
          'block-content': true,
          [`block-${this.block.type}`]: true,
          'is-empty': this.isEmpty,
        }}
        contentEditable={!this.readonly}
        data-placeholder={this.config.placeholder}
        onInput={this.handleInput}
        onKeyDown={this.handleKeyDown}
        onBeforeInput={this.handleSlashCommand}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onMouseUp={this.handleMouseUp}
      ></Tag>
    );

    if (isList) {
      const listProps: any = { class: 'block-list' };
      if (isNumberedList && this.listStart > 1) {
        listProps.start = this.listStart;
      }
      return <ListWrapper {...listProps}>{editableContent}</ListWrapper>;
    }

    return editableContent;
  }

  private handleMouseEnter = () => {
    this.showControls = true;
  };

  private handleMouseLeave = () => {
    // Only hide if not focused
    if (!this.focused) {
      this.showControls = false;
    }
  };

  render() {
    // Show controls if hovering OR if block is focused
    const controlsVisible = this.showControls || this.focused;

    return (
      <Host
        class={{
          'is-focused': this.focused,
          'is-empty': this.isEmpty,
          [`block-type-${this.block?.type}`]: true,
        }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div class={{ 'block-controls': true, 'is-visible': controlsVisible }}>
          {this.renderDragHandle()}
          {this.renderBlockIcon()}
        </div>
        <div class="block-wrapper">{this.renderContent()}</div>
      </Host>
    );
  }
}

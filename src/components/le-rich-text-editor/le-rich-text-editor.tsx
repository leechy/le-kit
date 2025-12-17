import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Method,
  Element,
  h,
  Host,
  Watch,
} from '@stencil/core';
import {
  LeBlock,
  BlockType,
  BlockTypeConfig,
  LeBlockChangeDetail,
  createBlock,
  DEFAULT_BLOCK_CONFIGS,
} from '../../types/blocks';
import { FormatType } from './le-format-toolbar';

/**
 * Rich text editor with block-based editing, similar to Notion.
 *
 * Features:
 * - Block-based content structure (paragraphs, headings, lists, quotes, code, dividers)
 * - Markdown shortcuts (# for headings, - for lists, > for quotes, etc.)
 * - Inline formatting toolbar (bold, italic, underline, strikethrough, code, links)
 * - Block command menu triggered by /
 * - Drag and drop block reordering
 * - HTML and Markdown export
 *
 * @cmsEditable true
 * @cmsCategory Content
 *
 * @slot - Default slot (not used, content managed internally)
 *
 * @example Basic usage
 * ```html
 * <le-rich-text-editor placeholder="Start writing..."></le-rich-text-editor>
 * ```
 *
 * @example With initial content
 * ```html
 * <le-rich-text-editor id="editor"></le-rich-text-editor>
 * <script>
 *   const editor = document.getElementById('editor');
 *   editor.setHtml('<h1>Hello</h1><p>World</p>');
 * </script>
 * ```
 */
@Component({
  tag: 'le-rich-text-editor',
  styleUrl: 'le-rich-text-editor.css',
  shadow: true,
})
export class LeRichTextEditor {
  @Element() el: HTMLElement;

  /**
   * Initial HTML content.
   */
  @Prop() value?: string;

  /**
   * Placeholder text shown in empty editor.
   */
  @Prop() placeholder: string = "Type '/' for commands...";

  /**
   * Whether the editor is in readonly mode.
   */
  @Prop({ reflect: true }) readonly: boolean = false;

  /**
   * Whether to autofocus on mount.
   */
  @Prop() autofocus: boolean = false;

  /**
   * Minimum height of the editor.
   */
  @Prop() minHeight?: string;

  /**
   * Maximum height (scrollable).
   */
  @Prop() maxHeight?: string;

  /**
   * Available block types.
   */
  @Prop() blockTypes: BlockTypeConfig[] = DEFAULT_BLOCK_CONFIGS;

  /**
   * Emitted when content changes.
   */
  @Event() leChange: EventEmitter<LeBlockChangeDetail>;

  /**
   * Emitted when a block is added.
   */
  @Event() leBlockAdd: EventEmitter<LeBlock>;

  /**
   * Emitted when a block is removed.
   */
  @Event() leBlockRemove: EventEmitter<LeBlock>;

  /**
   * Emitted when editor gains focus.
   */
  @Event() leFocus: EventEmitter<void>;

  /**
   * Emitted when editor loses focus.
   */
  @Event() leBlur: EventEmitter<void>;

  @State() private blocks: LeBlock[] = [];
  @State() private focusedBlockId?: string;
  @State() private showBlockMenu: boolean = false;
  @State() private blockMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
  @State() private showFormatToolbar: boolean = false;
  @State() private formatToolbarPosition: { x: number; y: number } = { x: 0, y: 0 };
  @State() private activeFormats: FormatType[] = [];

  private blockRefs: Map<string, HTMLLeEditorBlockElement> = new Map();
  private blockMenuEl?: HTMLLeBlockMenuElement;
  private formatToolbarEl?: HTMLLeFormatToolbarElement;
  private editorEl?: HTMLElement;
  private targetBlockForMenu?: string;

  @Watch('value')
  handleValueChange() {
    if (this.value) {
      this.parseHtml(this.value);
    }
  }

  componentWillLoad() {
    // Initialize with a single empty paragraph if no content
    if (this.value) {
      this.parseHtml(this.value);
    } else {
      this.blocks = [createBlock('paragraph', '')];
    }
  }

  componentDidLoad() {
    if (this.autofocus && this.blocks.length > 0) {
      setTimeout(() => {
        this.focusBlock(this.blocks[0].id);
      }, 100);
    }

    // Listen for selection changes to update format toolbar
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  disconnectedCallback() {
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  }

  private parseHtml(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newBlocks: LeBlock[] = [];

    doc.body.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const block = this.elementToBlock(el);
        if (block) {
          newBlocks.push(block);
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        // Wrap text nodes in paragraphs
        newBlocks.push(createBlock('paragraph', node.textContent));
      }
    });

    this.blocks = newBlocks.length > 0 ? newBlocks : [createBlock('paragraph', '')];
  }

  private elementToBlock(el: HTMLElement): LeBlock | null {
    const tagName = el.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
        return createBlock('heading1', el.innerHTML);
      case 'h2':
        return createBlock('heading2', el.innerHTML);
      case 'h3':
        return createBlock('heading3', el.innerHTML);
      case 'p':
        return createBlock('paragraph', el.innerHTML);
      case 'blockquote':
        return createBlock('quote', el.innerHTML);
      case 'pre':
        const code = el.querySelector('code');
        return createBlock('code', code?.innerHTML || el.innerHTML);
      case 'hr':
        return createBlock('divider', '');
      case 'ul':
        // Convert list items to individual blocks
        const bullets: LeBlock[] = [];
        el.querySelectorAll('li').forEach(li => {
          bullets.push(createBlock('bullet-list', li.innerHTML));
        });
        return bullets[0]; // Return first, caller should handle multiple
      case 'ol':
        const numbered: LeBlock[] = [];
        el.querySelectorAll('li').forEach(li => {
          numbered.push(createBlock('numbered-list', li.innerHTML));
        });
        return numbered[0];
      default:
        // Wrap unknown elements in paragraph
        return createBlock('paragraph', el.outerHTML);
    }
  }

  /**
   * Get the content as HTML.
   */
  @Method()
  async getHtml(): Promise<string> {
    const htmlParts: string[] = [];
    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

    for (const block of this.blocks) {
      // Handle list grouping
      if (block.type === 'bullet-list' || block.type === 'numbered-list') {
        const listType = block.type === 'bullet-list' ? 'ul' : 'ol';

        if (currentList && currentList.type === listType) {
          currentList.items.push(`<li>${block.content}</li>`);
        } else {
          // Close previous list if different type
          if (currentList) {
            htmlParts.push(
              `<${currentList.type}>${currentList.items.join('')}</${currentList.type}>`,
            );
          }
          currentList = { type: listType, items: [`<li>${block.content}</li>`] };
        }
        continue;
      }

      // Close any open list
      if (currentList) {
        htmlParts.push(`<${currentList.type}>${currentList.items.join('')}</${currentList.type}>`);
        currentList = null;
      }

      // Regular blocks
      switch (block.type) {
        case 'paragraph':
          htmlParts.push(`<p>${block.content}</p>`);
          break;
        case 'heading1':
          htmlParts.push(`<h1>${block.content}</h1>`);
          break;
        case 'heading2':
          htmlParts.push(`<h2>${block.content}</h2>`);
          break;
        case 'heading3':
          htmlParts.push(`<h3>${block.content}</h3>`);
          break;
        case 'quote':
          htmlParts.push(`<blockquote>${block.content}</blockquote>`);
          break;
        case 'code':
          htmlParts.push(`<pre><code>${block.content}</code></pre>`);
          break;
        case 'divider':
          htmlParts.push('<hr>');
          break;
      }
    }

    // Close any remaining list
    if (currentList) {
      htmlParts.push(`<${currentList.type}>${currentList.items.join('')}</${currentList.type}>`);
    }

    return htmlParts.join('\n');
  }

  /**
   * Get the content as Markdown.
   */
  @Method()
  async getMarkdown(): Promise<string> {
    const mdParts: string[] = [];

    for (const block of this.blocks) {
      const text = this.htmlToPlainText(block.content);

      switch (block.type) {
        case 'paragraph':
          mdParts.push(text);
          mdParts.push('');
          break;
        case 'heading1':
          mdParts.push(`# ${text}`);
          mdParts.push('');
          break;
        case 'heading2':
          mdParts.push(`## ${text}`);
          mdParts.push('');
          break;
        case 'heading3':
          mdParts.push(`### ${text}`);
          mdParts.push('');
          break;
        case 'bullet-list':
          mdParts.push(`- ${text}`);
          break;
        case 'numbered-list':
          mdParts.push(`1. ${text}`);
          break;
        case 'quote':
          mdParts.push(`> ${text}`);
          mdParts.push('');
          break;
        case 'code':
          mdParts.push('```');
          mdParts.push(text);
          mdParts.push('```');
          mdParts.push('');
          break;
        case 'divider':
          mdParts.push('---');
          mdParts.push('');
          break;
      }
    }

    return mdParts.join('\n').trim();
  }

  private htmlToPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || '';
  }

  /**
   * Get the raw block data.
   */
  @Method()
  async getBlocks(): Promise<LeBlock[]> {
    return [...this.blocks];
  }

  /**
   * Set content from HTML.
   */
  @Method()
  async setHtml(html: string) {
    this.parseHtml(html);
  }

  /**
   * Focus the editor.
   */
  @Method()
  async focusEditor() {
    if (this.blocks.length > 0) {
      this.focusBlock(this.blocks[0].id);
    }
    this.leFocus.emit();
  }

  /**
   * Blur the editor.
   */
  @Method()
  async blurEditor() {
    this.focusedBlockId = undefined;
    this.leBlur.emit();
  }

  private focusBlock(blockId: string, atEnd: boolean = false) {
    this.focusedBlockId = blockId;
    const blockEl = this.blockRefs.get(blockId);
    blockEl?.focusContent(atEnd);
  }

  private getBlockIndex(blockId: string): number {
    return this.blocks.findIndex(b => b.id === blockId);
  }

  /**
   * Calculate the start number for numbered lists.
   * Counts consecutive numbered-list blocks before this one.
   */
  private getListStartNumber(index: number): number {
    const block = this.blocks[index];
    if (block.type !== 'numbered-list') return 1;

    // Count how many consecutive numbered-list blocks are before this one
    let count = 1;
    for (let i = index - 1; i >= 0; i--) {
      if (this.blocks[i].type === 'numbered-list') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  // Block event handlers
  private handleBlockChange = (e: CustomEvent<{ block: LeBlock; content: string }>) => {
    const { block, content } = e.detail;
    const index = this.getBlockIndex(block.id);

    if (index >= 0) {
      this.blocks = [
        ...this.blocks.slice(0, index),
        { ...block, content },
        ...this.blocks.slice(index + 1),
      ];

      this.leChange.emit({
        blocks: this.blocks,
        changedBlock: this.blocks[index],
        action: 'update',
      });
    }
  };

  private handleBlockEnter = (e: CustomEvent<{ block: LeBlock; cursorAtEnd: boolean }>) => {
    const { block } = e.detail;
    const index = this.getBlockIndex(block.id);

    if (index >= 0) {
      // Determine the type for the new block
      // Lists continue with the same type, other blocks become paragraphs
      const listTypes: BlockType[] = ['bullet-list', 'numbered-list'];
      const continueType = listTypes.includes(block.type) ? block.type : 'paragraph';

      // If current block is empty and is a list, convert to paragraph instead of adding
      if (
        listTypes.includes(block.type) &&
        (!block.content || block.content.trim() === '' || block.content === '<br>')
      ) {
        this.updateBlockType(block.id, 'paragraph');
        return;
      }

      // Create new block with appropriate type
      const newBlock = createBlock(continueType, '');

      this.blocks = [...this.blocks.slice(0, index + 1), newBlock, ...this.blocks.slice(index + 1)];

      // Focus the new block
      setTimeout(() => {
        this.focusBlock(newBlock.id);
      }, 10);

      this.leBlockAdd.emit(newBlock);
      this.leChange.emit({
        blocks: this.blocks,
        changedBlock: newBlock,
        action: 'add',
      });
    }
  };

  private handleBlockBackspace = (e: CustomEvent<{ block: LeBlock }>) => {
    const { block } = e.detail;
    const index = this.getBlockIndex(block.id);

    // Types that should convert to paragraph first on backspace (at start)
    const specialTypes: BlockType[] = [
      'bullet-list',
      'numbered-list',
      'quote',
      'heading1',
      'heading2',
      'heading3',
      'code',
    ];

    // If current block is a special type, convert to paragraph first
    // This happens when backspace is pressed at the start of the block
    if (specialTypes.includes(block.type)) {
      this.updateBlockType(block.id, 'paragraph');
      return;
    }

    // For paragraph blocks, handle merging or removal
    if (index > 0) {
      const previousBlock = this.blocks[index - 1];

      // If current block is empty, just remove it
      if (!block.content || block.content.trim() === '' || block.content === '<br>') {
        this.blocks = this.blocks.filter(b => b.id !== block.id);

        // Focus previous block at end
        setTimeout(() => {
          this.focusBlock(previousBlock.id, true);
        }, 10);

        this.leBlockRemove.emit(block);
        this.leChange.emit({
          blocks: this.blocks,
          changedBlock: block,
          action: 'remove',
        });
      } else if (previousBlock.type !== 'divider') {
        // Merge content with previous block
        const mergedContent = previousBlock.content + block.content;

        this.blocks = [
          ...this.blocks.slice(0, index - 1),
          { ...previousBlock, content: mergedContent },
          ...this.blocks.slice(index + 1),
        ];

        // Focus previous block
        setTimeout(() => {
          this.focusBlock(previousBlock.id, false);
        }, 10);

        this.leBlockRemove.emit(block);
        this.leChange.emit({
          blocks: this.blocks,
          changedBlock: previousBlock,
          action: 'update',
        });
      }
    }
    // First block that's a paragraph - nothing to do (can't go further back)
  };

  private handleBlockDelete = (e: CustomEvent<{ block: LeBlock }>) => {
    const { block } = e.detail;
    const index = this.getBlockIndex(block.id);

    if (index < this.blocks.length - 1) {
      const nextBlock = this.blocks[index + 1];

      if (nextBlock.type !== 'divider') {
        // Merge with next block
        const mergedContent = block.content + nextBlock.content;

        this.blocks = [
          ...this.blocks.slice(0, index),
          { ...block, content: mergedContent },
          ...this.blocks.slice(index + 2),
        ];

        this.leBlockRemove.emit(nextBlock);
        this.leChange.emit({
          blocks: this.blocks,
          changedBlock: block,
          action: 'update',
        });
      }
    }
  };

  private handleBlockNavigateUp = (e: CustomEvent<{ block: LeBlock }>) => {
    const { block } = e.detail;
    const index = this.getBlockIndex(block.id);

    if (index > 0) {
      this.focusBlock(this.blocks[index - 1].id, true);
    }
  };

  private handleBlockNavigateDown = (e: CustomEvent<{ block: LeBlock }>) => {
    const { block } = e.detail;
    const index = this.getBlockIndex(block.id);

    if (index < this.blocks.length - 1) {
      this.focusBlock(this.blocks[index + 1].id, false);
    }
  };

  private handleBlockTypeChange = (e: CustomEvent<{ block: LeBlock; newType: BlockType }>) => {
    const { block, newType } = e.detail;
    this.updateBlockType(block.id, newType);
  };

  private updateBlockType(blockId: string, newType: BlockType) {
    const index = this.getBlockIndex(blockId);

    if (index >= 0) {
      const block = this.blocks[index];

      // Handle divider specially
      if (newType === 'divider') {
        const dividerBlock = createBlock('divider', '');
        const newParagraph = createBlock('paragraph', '');

        this.blocks = [
          ...this.blocks.slice(0, index),
          dividerBlock,
          newParagraph,
          ...this.blocks.slice(index + 1),
        ];

        // Focus the new paragraph
        setTimeout(() => {
          this.focusBlock(newParagraph.id);
        }, 10);
      } else {
        this.blocks = [
          ...this.blocks.slice(0, index),
          { ...block, type: newType },
          ...this.blocks.slice(index + 1),
        ];

        // Re-focus the block
        setTimeout(() => {
          this.focusBlock(blockId);
        }, 10);
      }

      this.leChange.emit({
        blocks: this.blocks,
        changedBlock: this.blocks[index],
        action: 'update',
      });
    }
  }

  private handleBlockMenuOpen = (
    e: CustomEvent<{ block: LeBlock; position: { x: number; y: number } }>,
  ) => {
    const { block, position } = e.detail;
    this.targetBlockForMenu = block.id;
    this.blockMenuPosition = position;
    this.showBlockMenu = true;
    this.blockMenuEl?.show();
  };

  private handleBlockTypeSelect = (
    e: CustomEvent<{ type: BlockType; config: BlockTypeConfig }>,
  ) => {
    const { type } = e.detail;

    if (this.targetBlockForMenu) {
      this.updateBlockType(this.targetBlockForMenu, type);
      this.targetBlockForMenu = undefined;
    }

    this.showBlockMenu = false;
  };

  private handleBlockMenuClose = () => {
    this.showBlockMenu = false;
    this.targetBlockForMenu = undefined;

    // Refocus the block
    if (this.focusedBlockId) {
      this.focusBlock(this.focusedBlockId);
    }
  };

  private handleBlockFocus = (e: CustomEvent<{ block: LeBlock }>) => {
    this.focusedBlockId = e.detail.block.id;
  };

  private handleBlockBlur = () => {
    // Small delay to allow click events on toolbar
    setTimeout(() => {
      if (!this.showFormatToolbar && !this.showBlockMenu) {
        this.focusedBlockId = undefined;
      }
    }, 100);
  };

  private handleBlockSelection = (
    e: CustomEvent<{ block: LeBlock; hasSelection: boolean; range?: Range; rect?: DOMRect }>,
  ) => {
    const { hasSelection, rect } = e.detail;

    if (hasSelection && rect && rect.width > 0 && rect.height > 0) {
      this.formatToolbarPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
      this.showFormatToolbar = true;
      this.updateActiveFormats();
      this.formatToolbarEl?.show();
    } else {
      this.showFormatToolbar = false;
      this.formatToolbarEl?.hide();
    }
  };

  private handleSelectionChange = () => {
    const sel = window.getSelection();

    if (!sel || sel.isCollapsed) {
      this.showFormatToolbar = false;
      this.formatToolbarEl?.hide();
      return;
    }

    // Check if selection is within our editor (including shadow DOMs)
    let node = sel.anchorNode;
    let isInEditor = false;
    while (node) {
      if (node === this.editorEl) {
        isInEditor = true;
        break;
      }
      // Traverse up through shadow DOM boundaries
      if (node instanceof ShadowRoot) {
        node = node.host;
      } else {
        node = node.parentNode;
      }
    }

    if (!isInEditor) {
      this.showFormatToolbar = false;
      this.formatToolbarEl?.hide();
    }
  };

  private updateActiveFormats() {
    const formats: FormatType[] = [];

    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('strikeThrough')) formats.push('strikethrough');

    this.activeFormats = formats;
  }

  private handleFormat = (_e: CustomEvent<{ format: FormatType }>) => {
    this.updateActiveFormats();
  };

  private handleEditorClick = (e: MouseEvent) => {
    // If clicking on empty area, focus last block or create new one
    const target = e.target as HTMLElement;

    if (target === this.editorEl) {
      const lastBlock = this.blocks[this.blocks.length - 1];

      if (lastBlock && lastBlock.content.trim() === '') {
        this.focusBlock(lastBlock.id);
      } else {
        // Add new block
        const newBlock = createBlock('paragraph', '');
        this.blocks = [...this.blocks, newBlock];

        setTimeout(() => {
          this.focusBlock(newBlock.id);
        }, 10);
      }
    }
  };

  private registerBlockRef = (blockId: string, el?: HTMLLeEditorBlockElement) => {
    if (el) {
      this.blockRefs.set(blockId, el);
    } else {
      this.blockRefs.delete(blockId);
    }
  };

  render() {
    const editorStyles: { [key: string]: string } = {};
    if (this.minHeight) editorStyles['min-height'] = this.minHeight;
    if (this.maxHeight) {
      editorStyles['max-height'] = this.maxHeight;
      editorStyles['overflow-y'] = 'auto';
    }

    return (
      <Host>
        <div
          ref={el => (this.editorEl = el)}
          class={{
            'editor': true,
            'is-readonly': this.readonly,
            'is-empty': this.blocks.length === 1 && !this.blocks[0].content,
          }}
          style={editorStyles}
          onClick={this.handleEditorClick}
        >
          <div class="editor-blocks">
            {this.blocks.map((block, index) => (
              <le-editor-block
                key={block.id}
                ref={el => this.registerBlockRef(block.id, el)}
                block={block}
                focused={this.focusedBlockId === block.id}
                readonly={this.readonly}
                listStart={this.getListStartNumber(index)}
                onLeBlockChange={this.handleBlockChange}
                onLeBlockEnter={this.handleBlockEnter}
                onLeBlockBackspace={this.handleBlockBackspace}
                onLeBlockDelete={this.handleBlockDelete}
                onLeBlockNavigateUp={this.handleBlockNavigateUp}
                onLeBlockNavigateDown={this.handleBlockNavigateDown}
                onLeBlockTypeChange={this.handleBlockTypeChange}
                onLeBlockMenuOpen={this.handleBlockMenuOpen}
                onLeBlockFocus={this.handleBlockFocus}
                onLeBlockBlur={this.handleBlockBlur}
                onLeBlockSelection={this.handleBlockSelection}
              />
            ))}
          </div>

          {this.blocks.length === 1 && !this.blocks[0].content && (
            <div class="editor-placeholder">{this.placeholder}</div>
          )}
        </div>

        {/* Block command menu */}
        <le-block-menu
          ref={el => (this.blockMenuEl = el)}
          open={this.showBlockMenu}
          position={this.blockMenuPosition}
          blockTypes={this.blockTypes}
          onLeBlockTypeSelect={this.handleBlockTypeSelect}
          onLeMenuClose={this.handleBlockMenuClose}
        />

        {/* Format toolbar */}
        <le-format-toolbar
          ref={el => (this.formatToolbarEl = el)}
          open={this.showFormatToolbar}
          position={this.formatToolbarPosition}
          activeFormats={this.activeFormats}
          onLeFormat={this.handleFormat}
        />
      </Host>
    );
  }
}

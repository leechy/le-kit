import { Component, Prop, State, h, Host, Element, Event, EventEmitter, Watch } from '@stencil/core';

/**
 * Block types available in the editor
 */
const BLOCK_TYPES = [
  { type: 'p', label: 'Paragraph', icon: '¶', shortcut: 'p' },
  { type: 'h1', label: 'Heading 1', icon: 'H1', shortcut: 'h1' },
  { type: 'h2', label: 'Heading 2', icon: 'H2', shortcut: 'h2' },
  { type: 'h3', label: 'Heading 3', icon: 'H3', shortcut: 'h3' },
  { type: 'h4', label: 'Heading 4', icon: 'H4', shortcut: 'h4' },
  { type: 'h5', label: 'Heading 5', icon: 'H5', shortcut: 'h5' },
  { type: 'h6', label: 'Heading 6', icon: 'H6', shortcut: 'h6' },
  { type: 'blockquote', label: 'Quote', icon: '"', shortcut: 'quote' },
  { type: 'pre', label: 'Code Block', icon: '</>', shortcut: 'code' },
];

/**
 * A rich text editor with block-level editing and Notion-style "/" commands.
 *
 * Features:
 * - Block-level editing (paragraphs, headings, quotes, code)
 * - Notion-style "/" command menu for changing block types
 * - Enter creates new paragraphs
 * - Inline formatting (bold, italic, underline, strikethrough, links)
 * - Automatic text node wrapping in paragraphs
 *
 * @slot - Default slot for initial content
 *
 * @fires leInput - Emitted on every content change
 * @fires leChange - Emitted when editor loses focus with changed content
 * @fires leFocus - Emitted when editor receives focus
 * @fires leBlur - Emitted when editor loses focus
 */
@Component({
  tag: 'le-rich-text-editor',
  styleUrl: 'le-rich-text-editor.css',
  shadow: true,
})
export class LeRichTextEditor {
  @Element() el: HTMLElement;

  // ============================================
  // Props
  // ============================================

  @Prop() name?: string;
  @Prop({ reflect: true }) editorId?: string;
  @Prop({ mutable: true }) value: string = '';
  @Prop() placeholder: string = 'Type "/" for commands...';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) readonly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() showToolbar: boolean = true;
  @Prop() toolbarMode: 'always' | 'focus' | 'selection' = 'focus';
  @Prop() variant: 'minimal' | 'standard' | 'full' = 'full';
  @Prop() autofocus: boolean = false;

  // ============================================
  // Events
  // ============================================

  @Event() leInput: EventEmitter<{ value: string; textContent: string }>;
  @Event() leChange: EventEmitter<{ value: string; textContent: string }>;
  @Event() leFocus: EventEmitter<void>;
  @Event() leBlur: EventEmitter<void>;

  // ============================================
  // State
  // ============================================

  @State() private isFocused: boolean = false;
  @State() private hasSelection: boolean = false;
  @State() private selectionState: SelectionState = {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isLink: false,
  };

  /** Whether the command menu is open */
  @State() private commandMenuOpen: boolean = false;
  
  /** Filter text for command menu (text after "/") */
  @State() private commandFilter: string = '';
  
  /** Selected index in command menu */
  @State() private commandMenuIndex: number = 0;

  /** Position of the command menu */
  @State() private commandMenuPosition: { top: number; left: number } = { top: 0, left: 0 };

  // ============================================
  // Refs
  // ============================================

  private editorRef?: HTMLDivElement;
  private slotRef?: HTMLSlotElement;
  private valueOnFocus: string = '';
  private isUpdating: boolean = false;
  
  /** Track if we started with a simple text node */
  private wasSimpleText: boolean = false;

  // ============================================
  // Lifecycle
  // ============================================

  componentDidLoad() {
    if (!this.value) {
      this.readSlottedContent();
    } else {
      this.normalizeContent();
    }
    
    if (this.autofocus && this.editorRef) {
      this.editorRef.focus();
    }

    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  disconnectedCallback() {
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  }

  @Watch('value')
  onValueChange(newValue: string) {
    if (this.editorRef && !this.isUpdating && this.editorRef.innerHTML !== newValue) {
      this.editorRef.innerHTML = newValue;
      this.normalizeContent();
    }
  }

  // ============================================
  // Content Management
  // ============================================

  /**
   * Read and normalize content from slotted elements
   */
  private readSlottedContent() {
    if (!this.slotRef) return;
    
    const assignedNodes = this.slotRef.assignedNodes({ flatten: true });
    
    // Check if it's a simple text node (no block elements)
    const hasOnlyTextNodes = assignedNodes.every(node => 
      node.nodeType === Node.TEXT_NODE || 
      (node.nodeType === Node.ELEMENT_NODE && this.isInlineElement(node as Element))
    );
    
    this.wasSimpleText = hasOnlyTextNodes && assignedNodes.length > 0;
    
    let html = '';
    assignedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        html += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        html += (node as Element).outerHTML || node.textContent;
      }
    });
    
    this.value = html.trim();
    
    // Set editor content and normalize
    if (this.editorRef) {
      this.editorRef.innerHTML = this.value;
      this.normalizeContent();
    }
  }

  /**
   * Check if element is inline (not a block element)
   */
  private isInlineElement(el: Element): boolean {
    const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'DIV', 'UL', 'OL', 'LI'];
    return !blockTags.includes(el.tagName);
  }

  /**
   * Ensure all content is wrapped in block elements
   * Text nodes and inline elements should be wrapped in <p>
   */
  private normalizeContent() {
    if (!this.editorRef) return;
    
    const fragment = document.createDocumentFragment();
    let currentParagraph: HTMLParagraphElement | null = null;
    
    const childNodes = Array.from(this.editorRef.childNodes);
    
    // If empty, add an empty paragraph
    if (childNodes.length === 0) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      this.editorRef.appendChild(p);
      return;
    }
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          if (!currentParagraph) {
            currentParagraph = document.createElement('p');
          }
          currentParagraph.appendChild(document.createTextNode(node.textContent || ''));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        
        if (this.isBlockElement(el)) {
          // Block element - close current paragraph and add it
          if (currentParagraph) {
            fragment.appendChild(currentParagraph);
            currentParagraph = null;
          }
          fragment.appendChild(el.cloneNode(true));
        } else {
          // Inline element - add to current paragraph
          if (!currentParagraph) {
            currentParagraph = document.createElement('p');
          }
          currentParagraph.appendChild(el.cloneNode(true));
        }
      }
    });
    
    // Add any remaining paragraph
    if (currentParagraph) {
      fragment.appendChild(currentParagraph);
    }
    
    // Only update if we actually normalized something
    if (fragment.childNodes.length > 0) {
      const needsUpdate = fragment.childNodes.length !== this.editorRef.childNodes.length ||
        this.editorRef.innerHTML !== this.fragmentToHtml(fragment);
      
      if (needsUpdate) {
        const hadFocus = this.editorRef.contains(document.activeElement);
        
        this.editorRef.innerHTML = '';
        this.editorRef.appendChild(fragment);
        
        // Restore focus to end if we had focus
        if (hadFocus) {
          this.moveCursorToEnd();
        }
      }
    }
  }

  private fragmentToHtml(fragment: DocumentFragment): string {
    const div = document.createElement('div');
    div.appendChild(fragment.cloneNode(true));
    return div.innerHTML;
  }

  private isBlockElement(el: Element): boolean {
    const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'DIV', 'UL', 'OL', 'LI'];
    return blockTags.includes(el.tagName);
  }

  private moveCursorToEnd() {
    if (!this.editorRef) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.editorRef);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  /**
   * Get the final value, potentially unwrapping simple content
   */
  private getFinalValue(): string {
    if (!this.editorRef) return this.value;
    
    const html = this.editorRef.innerHTML;
    
    // If we started with simple text and still have just one plain paragraph,
    // unwrap it back to simple text
    if (this.wasSimpleText) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Check if it's a single <p> with no special formatting
      if (tempDiv.children.length === 1 && tempDiv.children[0].tagName === 'P') {
        const p = tempDiv.children[0];
        // Return just the inner content if it's plain text or simple inline formatting
        return p.innerHTML.replace(/<br\s*\/?>/gi, '').trim() || p.innerHTML;
      }
    }
    
    return html;
  }

  private getTextContent(): string {
    return this.editorRef?.textContent || '';
  }

  // ============================================
  // Event Handlers
  // ============================================

  private handleInput = () => {
    if (!this.editorRef) return;
    
    this.isUpdating = true;
    this.value = this.editorRef.innerHTML;
    this.isUpdating = false;
    
    this.leInput.emit({
      value: this.getFinalValue(),
      textContent: this.getTextContent(),
    });
    
    this.updateSelectionState();
    this.checkForSlashCommand();
  };

  private handleFocus = () => {
    this.isFocused = true;
    this.valueOnFocus = this.value;
    this.leFocus.emit();
    this.updateSelectionState();
    
    // Normalize on focus to ensure proper structure
    this.normalizeContent();
  };

  private handleBlur = (e: FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const toolbar = this.el.shadowRoot?.querySelector('.le-rte-toolbar');
    const commandMenu = this.el.shadowRoot?.querySelector('.le-rte-command-menu');
    
    if (toolbar?.contains(relatedTarget) || commandMenu?.contains(relatedTarget)) {
      return;
    }
    
    setTimeout(() => {
      const activeEl = this.el.shadowRoot?.activeElement;
      const inToolbar = this.el.shadowRoot?.querySelector('.le-rte-toolbar')?.contains(activeEl);
      const inMenu = this.el.shadowRoot?.querySelector('.le-rte-command-menu')?.contains(activeEl);
      
      if (!activeEl || (!inToolbar && !inMenu)) {
        this.isFocused = false;
        this.hasSelection = false;
        this.commandMenuOpen = false;
        this.leBlur.emit();
        
        if (this.getFinalValue() !== this.valueOnFocus) {
          this.leChange.emit({
            value: this.getFinalValue(),
            textContent: this.getTextContent(),
          });
        }
      }
    }, 100);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Handle command menu navigation
    if (this.commandMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filtered = this.getFilteredBlockTypes();
        this.commandMenuIndex = Math.min(this.commandMenuIndex + 1, filtered.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.commandMenuIndex = Math.max(this.commandMenuIndex - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const filtered = this.getFilteredBlockTypes();
        if (filtered[this.commandMenuIndex]) {
          this.applyBlockType(filtered[this.commandMenuIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeCommandMenu();
      }
      return;
    }
    
    // Handle Enter - create new paragraph
    if (e.key === 'Enter' && !e.shiftKey) {
      // Let default behavior work for normal paragraphs
      // But ensure new block is a paragraph
      setTimeout(() => {
        this.normalizeContent();
      }, 0);
    }
    
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          this.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          this.execCommand('underline');
          break;
      }
    }
  };

  private handleSelectionChange = () => {
    if (!this.isFocused) return;
    
    const selection = window.getSelection();
    this.hasSelection = selection ? selection.toString().length > 0 : false;
    this.updateSelectionState();
  };

  private handleSlotChange = () => {
    if (!this.value && !this.isUpdating) {
      this.readSlottedContent();
    }
  };

  // ============================================
  // Slash Command Menu
  // ============================================

  private checkForSlashCommand() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // Only trigger in text nodes
    if (container.nodeType !== Node.TEXT_NODE) return;
    
    const text = container.textContent || '';
    const cursorPos = range.startOffset;
    
    // Find the last "/" before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const slashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (slashIndex !== -1) {
      // Check if slash is at start of line or after whitespace
      const charBefore = slashIndex > 0 ? textBeforeCursor[slashIndex - 1] : '\n';
      if (charBefore === '\n' || charBefore === ' ' || slashIndex === 0) {
        this.commandFilter = textBeforeCursor.substring(slashIndex + 1).toLowerCase();
        this.commandMenuIndex = 0;
        this.commandMenuOpen = true;
        this.updateCommandMenuPosition();
        return;
      }
    }
    
    this.commandMenuOpen = false;
  }

  private updateCommandMenuPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = this.editorRef?.getBoundingClientRect();
    
    if (editorRect) {
      this.commandMenuPosition = {
        top: rect.bottom - editorRect.top + 4,
        left: rect.left - editorRect.left,
      };
    }
  }

  private getFilteredBlockTypes() {
    if (!this.commandFilter) return BLOCK_TYPES;
    
    return BLOCK_TYPES.filter(bt => 
      bt.label.toLowerCase().includes(this.commandFilter) ||
      bt.shortcut.includes(this.commandFilter) ||
      bt.type.includes(this.commandFilter)
    );
  }

  private closeCommandMenu() {
    this.commandMenuOpen = false;
    this.commandFilter = '';
    this.commandMenuIndex = 0;
  }

  private applyBlockType(type: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Find the current block element
    let node: Node | null = selection.anchorNode;
    while (node && node !== this.editorRef) {
      if (node.nodeType === Node.ELEMENT_NODE && this.isBlockElement(node as Element)) {
        break;
      }
      node = node.parentNode;
    }
    
    if (node && node !== this.editorRef && node.nodeType === Node.ELEMENT_NODE) {
      const block = node as Element;
      
      // Remove the "/" and filter text from the content
      const text = block.textContent || '';
      const slashIndex = text.lastIndexOf('/');
      if (slashIndex !== -1) {
        block.textContent = text.substring(0, slashIndex);
      }
      
      // Create new element of the target type
      const newBlock = document.createElement(type);
      newBlock.innerHTML = block.innerHTML || '<br>';
      
      // Replace the old block
      block.parentNode?.replaceChild(newBlock, block);
      
      // Move cursor to end of new block
      const range = document.createRange();
      range.selectNodeContents(newBlock);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    this.closeCommandMenu();
    this.handleInput();
    this.editorRef?.focus();
  }

  // ============================================
  // Selection State
  // ============================================

  private updateSelectionState() {
    this.selectionState = {
      isBold: document.queryCommandState('bold'),
      isItalic: document.queryCommandState('italic'),
      isUnderline: document.queryCommandState('underline'),
      isStrikethrough: document.queryCommandState('strikeThrough'),
      isLink: this.isSelectionInLink(),
    };
  }

  private isSelectionInLink(): boolean {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return false;
    
    let node: Node | null = selection.anchorNode;
    while (node && node !== this.editorRef) {
      if (node.nodeName === 'A') return true;
      node = node.parentNode;
    }
    return false;
  }

  // ============================================
  // Formatting Commands
  // ============================================

  private execCommand(command: string, value?: string) {
    this.editorRef?.focus();
    document.execCommand(command, false, value);
    this.handleInput();
    this.updateSelectionState();
  }

  private toggleBold = (e: Event) => {
    e.preventDefault();
    this.execCommand('bold');
  };

  private toggleItalic = (e: Event) => {
    e.preventDefault();
    this.execCommand('italic');
  };

  private toggleUnderline = (e: Event) => {
    e.preventDefault();
    this.execCommand('underline');
  };

  private toggleStrikethrough = (e: Event) => {
    e.preventDefault();
    this.execCommand('strikeThrough');
  };

  private toggleLink = (e: Event) => {
    e.preventDefault();
    
    if (this.selectionState.isLink) {
      this.execCommand('unlink');
    } else {
      const url = prompt('Enter URL:', 'https://');
      if (url) {
        this.execCommand('createLink', url);
      }
    }
  };

  // ============================================
  // Toolbar
  // ============================================

  private shouldShowToolbar(): boolean {
    if (this.variant === 'minimal') return false;
    if (!this.showToolbar) return false;
    if (this.disabled || this.readonly) return false;
    
    switch (this.toolbarMode) {
      case 'always':
        return true;
      case 'selection':
        return this.isFocused && this.hasSelection;
      case 'focus':
      default:
        return this.isFocused;
    }
  }

  private getToolbarOptions(): string[] {
    if (this.variant === 'minimal') return [];
    if (this.variant === 'standard') return ['bold', 'italic', 'underline'];
    return ['bold', 'italic', 'underline', 'strike', 'link'];
  }

  // ============================================
  // Render
  // ============================================

  private renderToolbar() {
    const options = this.getToolbarOptions();
    
    return (
      <div class="le-rte-toolbar" role="toolbar" aria-label="Formatting options">
        {options.includes('bold') && (
          <button
            type="button"
            class={{ 'le-rte-btn': true, 'active': this.selectionState.isBold }}
            onMouseDown={this.toggleBold}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
        )}
        
        {options.includes('italic') && (
          <button
            type="button"
            class={{ 'le-rte-btn': true, 'active': this.selectionState.isItalic }}
            onMouseDown={this.toggleItalic}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
        )}
        
        {options.includes('underline') && (
          <button
            type="button"
            class={{ 'le-rte-btn': true, 'active': this.selectionState.isUnderline }}
            onMouseDown={this.toggleUnderline}
            title="Underline (Ctrl+U)"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>
        )}
        
        {options.includes('strike') && (
          <button
            type="button"
            class={{ 'le-rte-btn': true, 'active': this.selectionState.isStrikethrough }}
            onMouseDown={this.toggleStrikethrough}
            title="Strikethrough"
          >
            <span style={{ textDecoration: 'line-through' }}>S</span>
          </button>
        )}
        
        {options.includes('link') && (
          <button
            type="button"
            class={{ 'le-rte-btn': true, 'active': this.selectionState.isLink }}
            onMouseDown={this.toggleLink}
            title={this.selectionState.isLink ? 'Remove link' : 'Add link'}
          >
            🔗
          </button>
        )}
      </div>
    );
  }

  private renderCommandMenu() {
    const filtered = this.getFilteredBlockTypes();
    
    if (filtered.length === 0) return null;
    
    return (
      <div 
        class="le-rte-command-menu"
        style={{
          top: `${this.commandMenuPosition.top}px`,
          left: `${this.commandMenuPosition.left}px`,
        }}
      >
        <div class="le-rte-command-menu-header">Block type</div>
        {filtered.map((bt, index) => (
          <button
            type="button"
            class={{ 'le-rte-command-item': true, 'selected': index === this.commandMenuIndex }}
            onMouseDown={(e) => {
              e.preventDefault();
              this.applyBlockType(bt.type);
            }}
            onMouseEnter={() => this.commandMenuIndex = index}
          >
            <span class="le-rte-command-icon">{bt.icon}</span>
            <span class="le-rte-command-label">{bt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  render() {
    const showToolbar = this.shouldShowToolbar();
    
    return (
      <Host
        class={{
          'focused': this.isFocused,
          'disabled': this.disabled,
          'readonly': this.readonly,
          'has-value': !!this.value,
          [`variant-${this.variant}`]: true,
        }}
      >
        <div class="le-rte-wrapper">
          {showToolbar && this.renderToolbar()}
          
          <div
            ref={(el) => this.editorRef = el}
            class="le-rte-editor"
            contentEditable={!this.disabled && !this.readonly}
            role="textbox"
            aria-multiline="true"
            aria-placeholder={this.placeholder}
            id={this.editorId}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
            innerHTML={this.value}
            data-placeholder={this.placeholder}
          ></div>
          
          {this.commandMenuOpen && this.renderCommandMenu()}
          
          <div class="le-rte-hidden-slot">
            <slot 
              ref={(el) => this.slotRef = el as HTMLSlotElement}
              onSlotchange={this.handleSlotChange}
            ></slot>
          </div>
          
          {this.name && (
            <input type="hidden" name={this.name} value={this.getFinalValue()} />
          )}
        </div>
      </Host>
    );
  }
}

interface SelectionState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isLink: boolean;
}

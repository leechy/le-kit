import { Component, Prop, State, h, Host, Element, Watch } from '@stencil/core';
import { observeModeChanges } from '../../utils/utils';

/**
 * A text component with rich text editing capabilities in admin mode.
 *
 * `le-text` renders semantic text elements (headings, paragraphs, code, quotes)
 * and provides a Notion-like rich text editor in admin mode with formatting
 * toolbar for bold, italic, links, and paragraph type selection.
 *
 * @slot - Default slot for text content
 *
 * @cssprop --le-text-color - Text color
 * @cssprop --le-text-font-size - Font size
 * @cssprop --le-text-line-height - Line height
 * @cssprop --le-text-font-weight - Font weight
 *
 * @csspart text - The text container element
 *
 * @cmsEditable true
 * @cmsCategory Content
 */
@Component({
  tag: 'le-text',
  styleUrl: 'le-text.css',
  shadow: true,
})
export class LeText {
  @Element() el: HTMLElement;

  /**
   * The semantic variant/type of text element
   * @allowedValues p | h1 | h2 | h3 | h4 | h5 | h6 | code | quote | label | small
   */
  @Prop({ mutable: true, reflect: true }) variant:
    | 'p'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'code'
    | 'quote'
    | 'label'
    | 'small' = 'p';

  /**
   * Text alignment
   * @allowedValues left | center | right | justify
   */
  @Prop({ reflect: true }) align: 'left' | 'center' | 'right' | 'justify' = 'left';

  /**
   * Text color (CSS value or theme token)
   */
  @Prop() color?: string;

  /**
   * Whether the text should truncate with ellipsis
   */
  @Prop() truncate: boolean = false;

  /**
   * Maximum number of lines before truncating (requires truncate=true)
   */
  @Prop() maxLines?: number;

  /**
   * Internal state to track admin mode
   */
  @State() private adminMode: boolean = false;

  /**
   * The HTML content being edited
   */
  @State() private content: string = '';

  /**
   * Whether the editor is focused (shows toolbar)
   */
  @State() private isFocused: boolean = false;

  /**
   * Current selection state for toolbar button highlighting
   */
  @State() private selectionState: SelectionState = {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isLink: false,
    blockType: 'p',
  };

  /**
   * Reference to the contenteditable element
   */
  private editorRef?: HTMLDivElement;

  /**
   * Reference to the slot element
   */
  private slotRef?: HTMLSlotElement;

  private disconnectModeObserver?: () => void;

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, mode => {
      const wasAdmin = this.adminMode;
      this.adminMode = mode === 'admin';

      if (this.adminMode && !wasAdmin) {
        // Entering admin mode - read content from slot
        requestAnimationFrame(() => this.readSlottedContent());
      } else if (!this.adminMode && wasAdmin) {
        // Leaving admin mode - sync content back to slot
        this.syncContentToSlot();
      }
    });
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
  }

  @Watch('variant')
  onVariantChange() {
    // When variant changes in admin mode, update the content wrapper
    if (this.adminMode && this.editorRef) {
      this.syncContentToSlot();
    }
  }

  /**
   * Read content from slotted elements
   */
  private readSlottedContent() {
    if (!this.slotRef) return;

    const assignedNodes = this.slotRef.assignedNodes({ flatten: true });

    // Collect all content from assigned nodes
    let html = '';
    assignedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        html += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        html += (node as Element).innerHTML || node.textContent;
      }
    });

    this.content = html.trim();
  }

  /**
   * Sync edited content back to the slot
   */
  private syncContentToSlot() {
    if (!this.editorRef) return;

    const newContent = this.editorRef.innerHTML;

    // Update the light DOM content
    // We need to update the actual slotted content
    const slot = this.slotRef;
    if (slot) {
      const assignedNodes = slot.assignedNodes({ flatten: true });
      if (assignedNodes.length > 0) {
        const firstNode = assignedNodes[0];
        if (firstNode.nodeType === Node.ELEMENT_NODE) {
          (firstNode as Element).innerHTML = newContent;
        } else if (firstNode.nodeType === Node.TEXT_NODE) {
          // Replace text node with the new content
          const parent = firstNode.parentNode;
          if (parent) {
            // Create a temporary element to parse HTML
            const temp = document.createElement('span');
            temp.innerHTML = newContent;
            // Replace the text node
            parent.replaceChild(temp, firstNode);
            // Unwrap the span if it only contains text
            if (temp.childNodes.length === 1 && temp.firstChild?.nodeType === Node.TEXT_NODE) {
              parent.replaceChild(temp.firstChild, temp);
            }
          }
        }
      } else {
        // No assigned nodes, set innerHTML on the host's light DOM
        this.el.innerHTML = newContent;
      }
    }
  }

  /**
   * Handle input in the contenteditable
   */
  private handleInput = () => {
    if (this.editorRef) {
      this.content = this.editorRef.innerHTML;
      this.updateSelectionState();
    }
  };

  /**
   * Handle focus on the editor
   */
  private handleFocus = () => {
    this.isFocused = true;
    this.updateSelectionState();
  };

  /**
   * Handle blur on the editor
   */
  private handleBlur = (e: FocusEvent) => {
    // Check if focus moved to toolbar
    const relatedTarget = e.relatedTarget as HTMLElement;
    const toolbar = this.el.shadowRoot?.querySelector('.le-text-toolbar');

    if (toolbar?.contains(relatedTarget)) {
      // Focus moved to toolbar, keep it open
      return;
    }

    // Small delay to allow toolbar clicks to register
    setTimeout(() => {
      if (!this.el.shadowRoot?.activeElement) {
        this.isFocused = false;
        this.syncContentToSlot();
      }
    }, 150);
  };

  /**
   * Handle selection change to update toolbar state
   */
  private handleSelectionChange = () => {
    this.updateSelectionState();
  };

  /**
   * Update the selection state for toolbar highlighting
   */
  private updateSelectionState() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    this.selectionState = {
      isBold: document.queryCommandState('bold'),
      isItalic: document.queryCommandState('italic'),
      isUnderline: document.queryCommandState('underline'),
      isStrikethrough: document.queryCommandState('strikeThrough'),
      isLink: this.isSelectionInLink(selection),
      blockType: this.variant,
    };
  }

  /**
   * Check if current selection is within a link
   */
  private isSelectionInLink(selection: Selection): boolean {
    if (!selection.anchorNode) return false;

    let node: Node | null = selection.anchorNode;
    while (node && node !== this.editorRef) {
      if (node.nodeName === 'A') return true;
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Execute a formatting command
   */
  private execCommand(command: string, value?: string) {
    // Focus the editor first
    this.editorRef?.focus();

    // Execute the command
    document.execCommand(command, false, value);

    // Update state
    this.handleInput();
    this.updateSelectionState();
  }

  /**
   * Toggle bold formatting
   */
  private toggleBold = (e: Event) => {
    e.preventDefault();
    this.execCommand('bold');
  };

  /**
   * Toggle italic formatting
   */
  private toggleItalic = (e: Event) => {
    e.preventDefault();
    this.execCommand('italic');
  };

  /**
   * Toggle underline formatting
   */
  private toggleUnderline = (e: Event) => {
    e.preventDefault();
    this.execCommand('underline');
  };

  /**
   * Toggle strikethrough formatting
   */
  private toggleStrikethrough = (e: Event) => {
    e.preventDefault();
    this.execCommand('strikeThrough');
  };

  /**
   * Add or edit a link
   */
  private toggleLink = (e: Event) => {
    e.preventDefault();

    if (this.selectionState.isLink) {
      // Remove link
      this.execCommand('unlink');
    } else {
      // Add link
      const url = prompt('Enter URL:', 'https://');
      if (url) {
        this.execCommand('createLink', url);
      }
    }
  };

  /**
   * Change the block type/variant
   */
  private changeVariant = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.variant = select.value as typeof this.variant;
  };

  /**
   * Render the formatting toolbar
   */
  private renderToolbar() {
    return (
      <div class="le-text-toolbar">
        <select
          class="le-text-toolbar-select"
          onChange={this.changeVariant}
          onMouseDown={e => e.preventDefault()}
        >
          <option value="p" selected={this.variant === 'p'}>
            Paragraph
          </option>
          <option value="h1" selected={this.variant === 'h1'}>
            Heading 1
          </option>
          <option value="h2" selected={this.variant === 'h2'}>
            Heading 2
          </option>
          <option value="h3" selected={this.variant === 'h3'}>
            Heading 3
          </option>
          <option value="h4" selected={this.variant === 'h4'}>
            Heading 4
          </option>
          <option value="h5" selected={this.variant === 'h5'}>
            Heading 5
          </option>
          <option value="h6" selected={this.variant === 'h6'}>
            Heading 6
          </option>
          <option value="quote" selected={this.variant === 'quote'}>
            Quote
          </option>
          <option value="code" selected={this.variant === 'code'}>
            Code
          </option>
          <option value="label" selected={this.variant === 'label'}>
            Label
          </option>
          <option value="small" selected={this.variant === 'small'}>
            Small
          </option>
        </select>

        <div class="le-text-toolbar-divider"></div>

        <button
          type="button"
          class={{ 'le-text-toolbar-btn': true, 'active': this.selectionState.isBold }}
          onMouseDown={this.toggleBold}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          class={{ 'le-text-toolbar-btn': true, 'active': this.selectionState.isItalic }}
          onMouseDown={this.toggleItalic}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        <button
          type="button"
          class={{ 'le-text-toolbar-btn': true, 'active': this.selectionState.isUnderline }}
          onMouseDown={this.toggleUnderline}
          title="Underline (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <button
          type="button"
          class={{ 'le-text-toolbar-btn': true, 'active': this.selectionState.isStrikethrough }}
          onMouseDown={this.toggleStrikethrough}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>

        <div class="le-text-toolbar-divider"></div>

        <button
          type="button"
          class={{ 'le-text-toolbar-btn': true, 'active': this.selectionState.isLink }}
          onMouseDown={this.toggleLink}
          title={this.selectionState.isLink ? 'Remove link' : 'Add link'}
        >
          🔗
        </button>
      </div>
    );
  }

  /**
   * Get the semantic tag for the current variant
   */
  private getTag(): string {
    switch (this.variant) {
      case 'quote':
        return 'blockquote';
      case 'code':
        return 'pre';
      case 'label':
        return 'label';
      case 'small':
        return 'small';
      default:
        return this.variant; // h1-h6, p
    }
  }

  render() {
    const Tag = this.getTag();

    const textStyle: { [key: string]: string } = {};
    if (this.color) {
      textStyle.color = this.color;
    }
    if (this.align) {
      textStyle.textAlign = this.align;
    }

    const textClass = {
      'le-text': true,
      [`variant-${this.variant}`]: true,
      'truncate': this.truncate,
      [`max-lines-${this.maxLines}`]: this.truncate && this.maxLines,
    };

    // Admin mode - show rich text editor
    if (this.adminMode) {
      return (
        <Host class="admin-mode">
          <le-component component="le-text">
            <div class="le-text-editor-wrapper">
              {this.isFocused && this.renderToolbar()}
              <Tag class={textClass} part="text" style={textStyle}>
                <div
                  ref={el => (this.editorRef = el)}
                  class="le-text-editor"
                  contentEditable={true}
                  onInput={this.handleInput}
                  onFocus={this.handleFocus}
                  onBlur={this.handleBlur}
                  onKeyUp={this.handleSelectionChange}
                  onMouseUp={this.handleSelectionChange}
                  innerHTML={this.content}
                ></div>
              </Tag>
              {/* Hidden slot to receive light DOM content */}
              <div class="hidden-slot">
                <slot
                  ref={el => (this.slotRef = el as HTMLSlotElement)}
                  onSlotchange={() => this.readSlottedContent()}
                ></slot>
              </div>
            </div>
          </le-component>
        </Host>
      );
    }

    // Default mode - render semantic element with slotted content
    return (
      <Host>
        <Tag class={textClass} part="text" style={textStyle}>
          <slot ref={el => (this.slotRef = el as HTMLSlotElement)}></slot>
        </Tag>
      </Host>
    );
  }
}

/**
 * Selection state for toolbar
 */
interface SelectionState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isLink: boolean;
  blockType: string;
}

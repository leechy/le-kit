import { Component, Prop, h, Host, Element, State } from '@stencil/core';
import { observeModeChanges } from '../../utils/utils';

/**
 * A minimal text container component with rich text editing in admin mode.
 *
 * `le-text` is a transparent wrapper that passes through its content without
 * applying any styles. All styling comes from the theme and CSS classes on
 * the element itself.
 *
 * In admin mode, it provides a block-level rich text editor with:
 * - Notion-style "/" command for block type selection (p, h1-h6, blockquote, code)
 * - Enter creates new paragraphs
 * - Inline formatting (bold, italic, underline, strikethrough, links)
 *
 * @slot - Default slot for text content (can be text nodes, paragraphs, headings, etc.)
 *
 * @cmsEditable true
 * @cmsCategory Content
 */
@Component({
  tag: 'le-text',
  styleUrl: 'le-text.default.css',
  shadow: true,
})
export class LeText {
  @Element() el: HTMLElement;

  /**
   * Placeholder text shown when the editor is empty (admin mode only)
   */
  @Prop() placeholder?: string;

  /**
   * Rich text editor variant (only applies in admin mode)
   * - `minimal`: No toolbar, just contenteditable with / commands
   * - `standard`: Basic formatting (bold, italic, underline) + / commands
   * - `full`: All formatting options including links + / commands
   */
  @Prop() editorVariant: 'minimal' | 'standard' | 'full' = 'full';

  /**
   * Internal state to track admin mode
   */
  @State() private adminMode: boolean = false;

  private disconnectModeObserver?: () => void;

  connectedCallback() {
    this.disconnectModeObserver = observeModeChanges(this.el, (mode) => {
      this.adminMode = mode === 'admin';
    });
  }

  disconnectedCallback() {
    this.disconnectModeObserver?.();
  }

  render() {
    // Admin mode - show rich text editor via le-slot
    if (this.adminMode) {
      return (
        <Host class="admin-mode">
          <le-component component="le-text">
            <le-slot
              type="rich-text"
              label="Text"
              editorVariant={this.editorVariant}
              placeholder={this.placeholder || 'Type "/" for commands...'}
            >
              <slot></slot>
            </le-slot>
          </le-component>
        </Host>
      );
    }

    // Default mode - just pass through content, no wrapper elements
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}

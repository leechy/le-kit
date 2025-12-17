import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Method,
  State,
  h,
  Host,
  Element,
} from '@stencil/core';

/**
 * Format types supported by the toolbar.
 */
export type FormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';

/**
 * Format button configuration.
 */
interface FormatButton {
  type: FormatType;
  label: string;
  icon: string;
  command: string;
  shortcut: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { type: 'bold', label: 'Bold', icon: 'B', command: 'bold', shortcut: '⌘B' },
  { type: 'italic', label: 'Italic', icon: 'I', command: 'italic', shortcut: '⌘I' },
  { type: 'underline', label: 'Underline', icon: 'U', command: 'underline', shortcut: '⌘U' },
  {
    type: 'strikethrough',
    label: 'Strikethrough',
    icon: 'S',
    command: 'strikeThrough',
    shortcut: '⌘⇧S',
  },
  { type: 'code', label: 'Code', icon: '</>', command: 'code', shortcut: '⌘E' },
  { type: 'link', label: 'Link', icon: '🔗', command: 'createLink', shortcut: '⌘K' },
];

/**
 * Floating format toolbar for text selection in the rich text editor.
 * Positions itself above the selection.
 *
 * @cmsInternal true
 */
@Component({
  tag: 'le-format-toolbar',
  styleUrl: 'le-format-toolbar.css',
  shadow: true,
})
export class LeFormatToolbar {
  @Element() el: HTMLElement;

  /**
   * Whether the toolbar is visible.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * Position to show the toolbar at (center-x, top-y of selection).
   */
  @Prop() position: { x: number; y: number } = { x: 0, y: 0 };

  /**
   * Which format buttons to show.
   */
  @Prop() formats: FormatType[] = ['bold', 'italic', 'underline', 'strikethrough', 'code', 'link'];

  /**
   * Currently active formats.
   */
  @Prop() activeFormats: FormatType[] = [];

  /**
   * Emitted when a format button is clicked.
   */
  @Event() leFormat: EventEmitter<{ format: FormatType }>;

  /**
   * Emitted when link button is clicked (needs special handling).
   */
  @Event() leLinkRequest: EventEmitter<void>;

  @State() private showLinkInput: boolean = false;
  @State() private linkUrl: string = '';

  private toolbarEl?: HTMLElement;
  private linkInputEl?: HTMLInputElement;

  /**
   * Show the toolbar.
   */
  @Method()
  async show() {
    this.open = true;
  }

  /**
   * Hide the toolbar.
   */
  @Method()
  async hide() {
    this.open = false;
    this.showLinkInput = false;
    this.linkUrl = '';
  }

  /**
   * Update position.
   */
  @Method()
  async updatePosition(x: number, y: number) {
    if (this.toolbarEl) {
      this.toolbarEl.style.left = `${x}px`;
      this.toolbarEl.style.top = `${y}px`;
    }
  }

  private handleFormatClick = (button: FormatButton) => {
    if (button.type === 'link') {
      this.showLinkInput = true;
      setTimeout(() => this.linkInputEl?.focus(), 50);
      return;
    }

    if (button.type === 'code') {
      // Wrap selection in <code> tag
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
          const codeEl = document.createElement('code');
          range.surroundContents(codeEl);
        }
      }
    } else {
      document.execCommand(button.command, false);
    }

    this.leFormat.emit({ format: button.type });
  };

  private handleLinkSubmit = (e: Event) => {
    e.preventDefault();

    if (this.linkUrl) {
      document.execCommand('createLink', false, this.linkUrl);
      this.leFormat.emit({ format: 'link' });
    }

    this.showLinkInput = false;
    this.linkUrl = '';
    this.hide();
  };

  private handleLinkCancel = () => {
    this.showLinkInput = false;
    this.linkUrl = '';
  };

  private isFormatActive(type: FormatType): boolean {
    return this.activeFormats.includes(type);
  }

  private renderFormatButtons() {
    const buttons = FORMAT_BUTTONS.filter(b => this.formats.includes(b.type));

    return buttons.map(button => (
      <button
        key={button.type}
        type="button"
        class={{
          'toolbar-button': true,
          'is-active': this.isFormatActive(button.type),
          [`format-${button.type}`]: true,
        }}
        title={`${button.label} (${button.shortcut})`}
        onClick={() => this.handleFormatClick(button)}
      >
        <span class="button-icon">{button.icon}</span>
      </button>
    ));
  }

  private renderLinkInput() {
    return (
      <form class="link-input-form" onSubmit={this.handleLinkSubmit}>
        <input
          ref={el => (this.linkInputEl = el)}
          type="url"
          class="link-input"
          placeholder="Enter URL..."
          value={this.linkUrl}
          onInput={e => (this.linkUrl = (e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="link-submit" disabled={!this.linkUrl}>
          ✓
        </button>
        <button type="button" class="link-cancel" onClick={this.handleLinkCancel}>
          ✕
        </button>
      </form>
    );
  }

  render() {
    return (
      <Host class={{ 'is-open': this.open }}>
        {this.open && (
          <div
            ref={el => (this.toolbarEl = el)}
            class="format-toolbar-container"
            style={{
              left: `${this.position.x}px`,
              top: `${this.position.y}px`,
            }}
          >
            <div class="format-toolbar">
              {this.showLinkInput ? this.renderLinkInput() : this.renderFormatButtons()}
            </div>
          </div>
        )}
      </Host>
    );
  }
}

import { Component, Element, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { observeNamedSlotPresence } from '../../utils/utils';

/**
 * An empty state component inspired by SwiftUI ContentUnavailableView.
 * Used for displaying empty lists, search results, or unavailable states.
 *
 * @slot - Default slot for custom body content
 * @slot icon - Custom icon slot
 * @slot label - Custom label/title slot
 * @slot message - Custom message/description slot
 * @slot action - Custom action buttons slot
 */
@Component({
  tag: 'le-empty',
  styleUrl: 'le-empty.css',
  shadow: true,
})
export class LeEmpty {
  @Element() el!: HTMLElement;

  /**
   * Optional icon name, URL, or emoji character.
   */
  @Prop() icon?: string;

  /**
   * Main label text for the empty state.
   */
  @Prop() label?: string;

  /**
   * Secondary descriptive message.
   */
  @Prop() message?: string;

  /**
   * Label for optional action button.
   */
  @Prop() actionLabel?: string;

  /**
   * Emitted when the action button is clicked.
   */
  @Event() leAction!: EventEmitter<MouseEvent>;

  @State() private slotPresence: Record<string, boolean> = {};
  private disconnectSlotObserver?: () => void;

  connectedCallback() {
    this.disconnectSlotObserver = observeNamedSlotPresence(
      this.el,
      ['', 'icon', 'label', 'title', 'message', 'action'],
      presence => {
        this.slotPresence = { ...presence };
      },
    );
  }

  disconnectedCallback() {
    this.disconnectSlotObserver?.();
  }

  private handleActionClick = (e: any) => {
    this.leAction.emit(e);
  };

  private renderIcon() {
    const hasIconSlot = this.slotPresence['icon'];
    const hasIconProp = !!this.icon;

    if (!hasIconSlot && !hasIconProp) {
      return <span style={{ display: 'none' }}><slot name="icon" /></span>;
    }

    const isEmojiOrChar = this.icon && this.icon.length < 3 && !this.icon.includes('-') && !this.icon.includes('/');

    return (
      <div class="le-empty-icon-wrapper" part="icon-container">
        <slot name="icon">
          {hasIconProp && (
            isEmojiOrChar ? (
              <span>{this.icon}</span>
            ) : (
              <le-icon name={this.icon} />
            )
          )}
        </slot>
      </div>
    );
  }

  private renderLabel() {
    const hasLabelSlot = this.slotPresence['label'] || this.slotPresence['title'];
    const labelText = this.label;

    if (!hasLabelSlot && !labelText) {
      return (
        <span style={{ display: 'none' }}>
          <slot name="label" />
          <slot name="title" />
        </span>
      );
    }

    return (
      <h3 class="le-empty-title" part="label">
        <slot name="label">
          <slot name="title">
            {labelText}
          </slot>
        </slot>
      </h3>
    );
  }

  private renderMessage() {
    const hasMessageSlot = this.slotPresence['message'];

    if (hasMessageSlot) {
      return (
        <p class="le-empty-message">
          <slot name="message" />
        </p>
      );
    }

    if (!this.message) return <span style={{ display: 'none' }}><slot name="message" /></span>;

    return (
      <p class="le-empty-message">
        <slot name="message" />
        {this.message}
      </p>
    );
  }

  private renderAction() {
    const hasActionSlot = this.slotPresence['action'];

    if (hasActionSlot) {
      return (
        <div class="le-empty-action">
          <slot name="action" />
        </div>
      );
    }

    if (!this.actionLabel) return <span style={{ display: 'none' }}><slot name="action" /></span>;

    return (
      <div class="le-empty-action">
        <slot name="action" />
        <le-button
          part="action-button"
          color="primary"
          onClick={this.handleActionClick}
        >
          {this.actionLabel}
        </le-button>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <div class="le-empty-container">
          {this.renderIcon()}
          {this.renderLabel()}
          {this.renderMessage()}
          <slot />
          {this.renderAction()}
        </div>
      </Host>
    );
  }
}

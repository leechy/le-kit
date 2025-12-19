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
  Fragment,
} from '@stencil/core';
import type { LeEmojiCategory, LeEmojiItem } from '../../data/emojis';
import { LE_EMOJI_CATEGORIES } from '../../data/emojis';
import { classnames } from '../../utils/utils';

export interface LeEmojiSelectDetail {
  emoji: string;
  label: string;
}

const RECENTS_STORAGE_KEY = 'le-kit:emoji-recents:v1';

/**
 * Emoji picker for selecting an emoji icon.
 *
 * Uses le-popover for the dropdown layer.
 *
 * @slot trigger - Trigger element (optional)
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-emoji-picker',
  styleUrl: 'le-emoji-picker.css',
  shadow: true,
})
export class LeEmojiPicker {
  @Element() el: HTMLElement;

  /**
   * Whether the picker popover is open.
   */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /**
   * How many recently used emojis to keep.
   */
  @Prop() recentCount: number = 20;

  /**
   * Placeholder for the search input.
   */
  @Prop() searchPlaceholder: string = 'Search emojis…';

  /**
   * Emitted when an emoji is selected.
   */
  @Event() leEmojiSelect: EventEmitter<LeEmojiSelectDetail>;

  @State() private query: string = '';
  @State() private loading: boolean = false;
  @State() private emojis: LeEmojiItem[] = [];
  @State() private recents: LeEmojiItem[] = [];
  @State() private activeCategory: LeEmojiCategory = 'Smileys';

  private popoverEl?: HTMLLePopoverElement;
  private scrollEl?: HTMLElement;
  private rafScroll?: number;

  private sectionEls: Partial<Record<LeEmojiCategory, HTMLElement>> = {};

  componentWillLoad() {
    this.recents = this.readRecents();
  }

  @Watch('open')
  handleOpenChanged(next: boolean) {
    if (next) {
      this.ensureLoaded();
    }
  }

  private async ensureLoaded() {
    if (this.emojis.length > 0 || this.loading) return;

    this.loading = true;
    try {
      // Lazy-load the dataset so consumers don't pay the cost unless needed.
      const mod = await import('../../data/emojis');
      this.emojis = mod.EMOJIS as LeEmojiItem[];
    } finally {
      this.loading = false;
    }
  }

  private readRecents(): LeEmojiItem[] {
    try {
      const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(Boolean)
        .filter((x: any) => typeof x.emoji === 'string' && typeof x.label === 'string')
        .slice(0, this.recentCount);
    } catch {
      return [];
    }
  }

  private writeRecents(recents: LeEmojiItem[]) {
    try {
      localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recents.slice(0, this.recentCount)));
    } catch {
      // ignore
    }
  }

  private addRecent(item: LeEmojiItem) {
    const next = [item, ...this.recents.filter(x => x.emoji !== item.emoji)].slice(
      0,
      this.recentCount,
    );
    this.recents = next;
    this.writeRecents(next);
  }

  @Method()
  async show() {
    this.open = true;
    await this.popoverEl?.show();
  }

  @Method()
  async hide() {
    this.open = false;
    await this.popoverEl?.hide();
  }

  @Method()
  async toggle() {
    if (this.open) await this.hide();
    else await this.show();
  }

  private handlePopoverOpen = () => {
    this.open = true;
    this.ensureLoaded();

    // Positioning can shift once content loads.
    setTimeout(() => this.popoverEl?.updatePosition(), 30);
  };

  private handlePopoverClose = () => {
    this.open = false;
    this.query = '';
  };

  private handleSearchInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.query = target.value;
    // When searching, keep scroll at top for a stable experience.
    if (this.query && this.scrollEl) this.scrollEl.scrollTop = 0;
    this.popoverEl?.updatePosition();
  };

  private get filteredEmojis(): LeEmojiItem[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return [];

    return this.emojis.filter(item => {
      if (item.label.toLowerCase().includes(q)) return true;
      return item.keywords.some(k => k.toLowerCase().includes(q));
    });
  }

  private get emojisByCategory(): Record<LeEmojiCategory, LeEmojiItem[]> {
    const groups = Object.fromEntries(
      LE_EMOJI_CATEGORIES.map(c => [c, [] as LeEmojiItem[]]),
    ) as Record<LeEmojiCategory, LeEmojiItem[]>;

    for (const e of this.emojis) {
      groups[e.category]?.push(e);
    }

    return groups;
  }

  private handleEmojiClick = async (item: LeEmojiItem) => {
    this.addRecent(item);
    this.leEmojiSelect.emit({ emoji: item.emoji, label: item.label });
    await this.hide();
  };

  private scrollToCategory(category: LeEmojiCategory) {
    const container = this.scrollEl;
    const section = this.sectionEls[category];
    if (!container || !section) return;

    const containerTop = container.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const delta = sectionTop - containerTop;
    container.scrollTop += delta;
  }

  private handleScroll = () => {
    if (this.rafScroll) cancelAnimationFrame(this.rafScroll);
    this.rafScroll = requestAnimationFrame(() => {
      const container = this.scrollEl;
      if (!container) return;

      // Choose the last section whose top is at/above the container top.
      const containerTop = container.getBoundingClientRect().top + 4;
      let best: LeEmojiCategory = this.activeCategory;
      let bestTop = -Infinity;

      for (const category of LE_EMOJI_CATEGORIES) {
        const section = this.sectionEls[category];
        if (!section) continue;
        const top = section.getBoundingClientRect().top - containerTop;
        if (top <= 0 && top > bestTop) {
          bestTop = top;
          best = category;
        }
      }

      if (best !== this.activeCategory) {
        this.activeCategory = best;
      }
    });
  };

  private renderEmojiButton(item: LeEmojiItem) {
    return (
      <button
        type="button"
        class="emoji"
        onClick={() => this.handleEmojiClick(item)}
        aria-label={item.label}
        title={item.label}
      >
        {item.emoji}
      </button>
    );
  }

  private renderSearch() {
    return (
      <div class="search">
        <input
          type="search"
          value={this.query}
          placeholder={this.searchPlaceholder}
          onInput={this.handleSearchInput}
          aria-label="Search emojis"
        />
      </div>
    );
  }

  private renderCategories() {
    if (this.query.trim()) return null;

    return (
      <div class="categories" role="tablist" aria-label="Emoji categories">
        {LE_EMOJI_CATEGORIES.map(cat => (
          <button
            type="button"
            role="tab"
            class={classnames('category', { active: this.activeCategory === cat })}
            aria-selected={this.activeCategory === cat ? 'true' : 'false'}
            onClick={() => {
              this.activeCategory = cat;
              this.scrollToCategory(cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    );
  }

  private renderResults() {
    const results = this.filteredEmojis;

    return (
      <div class="results">
        {results.length === 0 ? (
          <div class="empty">No results</div>
        ) : (
          <div class="grid" role="list">
            {results.map(item => (
              <div role="listitem">{this.renderEmojiButton(item)}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  private renderRecents() {
    if (this.query.trim()) return null;
    if (!this.recents.length) return null;

    return (
      <div class="recents">
        <div class="section-title">Recently used</div>
        <div class="grid" role="list">
          {this.recents.map(item => (
            <div role="listitem">{this.renderEmojiButton(item)}</div>
          ))}
        </div>
      </div>
    );
  }

  private renderCategorized() {
    if (this.query.trim()) return null;

    const groups = this.emojisByCategory;

    return (
      <div class="sections" onScroll={this.handleScroll} ref={el => (this.scrollEl = el)}>
        {LE_EMOJI_CATEGORIES.map(cat => (
          <section class="section" ref={el => (this.sectionEls[cat] = el as HTMLElement)}>
            <div class="section-title">{cat}</div>
            <div class="grid" role="list">
              {groups[cat].map(item => (
                <div role="listitem">{this.renderEmojiButton(item)}</div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  private renderBody() {
    if (this.loading) {
      return <div class="loading">Loading…</div>;
    }

    if (this.query.trim()) {
      return this.renderResults();
    }

    return (
      <Fragment>
        {this.renderRecents()}
        {this.renderCategorized()}
      </Fragment>
    );
  }

  render() {
    return (
      <Host>
        <le-popover
          ref={el => (this.popoverEl = el)}
          width="360px"
          min-width="360px"
          max-width="420px"
          position="bottom"
          align="start"
          close-on-click-outside
          close-on-escape
          showClose={false}
          onLePopoverOpen={this.handlePopoverOpen}
          onLePopoverClose={this.handlePopoverClose}
        >
          <slot name="trigger" slot="trigger">
            <button type="button" class="default-trigger" aria-label="Open emoji picker">
              😊
            </button>
          </slot>

          <div class="panel" onClick={e => e.stopPropagation()}>
            {this.renderSearch()}
            {this.renderCategories()}
            {this.renderBody()}
          </div>
        </le-popover>
      </Host>
    );
  }
}

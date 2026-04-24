import { Component, Element, h, Method, Prop, Watch } from '@stencil/core';
import { createLeKitStore, parsePersistConfig, type LeKitStore } from '../../store/le-kit-store';

export type LeActiveContext = 'active' | 'inactive';

/**
 * Optional app-level context orchestrator for theme, appearance, and active state.
 *
 * Components continue to work without this wrapper; `le-kit` is opt-in.
 *
 * @cmsInternal true
 * @cmsCategory System
 */
@Component({
  tag: 'le-kit',
  styleUrl: 'le-kit.css',
  shadow: true,
})
export class LeKit {
  @Element() el!: HTMLElement;

  /** Current theme scope value. */
  @Prop({ mutable: true, reflect: true }) theme: string = 'default';

  /** Current appearance scope value. */
  @Prop({ mutable: true, reflect: true }) appearance: string = 'default';

  /** Current active context scope value. */
  @Prop({ mutable: true, reflect: true, attribute: 'active-context' })
  activeContext: LeActiveContext = 'active';

  /** Whether this instance reacts to window focus/blur. */
  @Prop({ reflect: true, attribute: 'watch-window' }) watchWindow: boolean = true;

  /** Whether this instance reacts to descendant modal popup open/close events. */
  @Prop({ reflect: true, attribute: 'watch-modals' }) watchModals: boolean = true;

  /** Local storage namespace for persisted values. */
  @Prop({ reflect: true, attribute: 'storage-key' }) storageKey: string = 'le-kit';

  /** Persistence keys as a space-separated list: `all`, `none`, `theme`, `appearance`. */
  @Prop({ reflect: true }) persist: string = 'theme appearance';

  private modalOpenCount: number = 0;
  private windowFocused: boolean = true;
  private store?: LeKitStore;
  private unsubscribeTheme?: () => void;
  private unsubscribeAppearance?: () => void;

  connectedCallback() {
    this.windowFocused = typeof document === 'undefined' ? true : document.hasFocus();

    const persistConfig = parsePersistConfig(this.persist);
    this.store = createLeKitStore({
      storageKey: this.storageKey,
      persistKeys: persistConfig.persistKeys,
    });

    this.unsubscribeTheme = this.store.theme$.listen(nextTheme => {
      if (nextTheme && this.theme !== nextTheme) {
        this.theme = nextTheme;
      }
    });

    this.unsubscribeAppearance = this.store.appearance$.listen(nextAppearance => {
      if (nextAppearance && this.appearance !== nextAppearance) {
        this.appearance = nextAppearance;
      }
    });

    if (this.theme) {
      this.store.theme$.set(this.theme);
    } else {
      this.theme = this.store.theme$.get();
    }

    if (this.appearance) {
      this.store.appearance$.set(this.appearance);
    } else {
      this.appearance = this.store.appearance$.get();
    }

    if (this.watchWindow) {
      window.addEventListener('blur', this.onWindowBlur);
      window.addEventListener('focus', this.onWindowFocus);
    }

    if (this.watchModals) {
      this.el.addEventListener('leOpen', this.onPopupOpen as EventListener);
      this.el.addEventListener('leClose', this.onPopupClose as EventListener);
    }

    if (!this.windowFocused) {
      this.activeContext = 'inactive';
    }
  }

  disconnectedCallback() {
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('focus', this.onWindowFocus);
    this.el.removeEventListener('leOpen', this.onPopupOpen as EventListener);
    this.el.removeEventListener('leClose', this.onPopupClose as EventListener);

    this.unsubscribeTheme?.();
    this.unsubscribeAppearance?.();
  }

  @Method()
  async setTheme(theme: string): Promise<void> {
    this.theme = theme;
  }

  @Method()
  async setAppearance(appearance: string): Promise<void> {
    this.appearance = appearance;
  }

  @Method()
  async setActiveContext(ctx: LeActiveContext): Promise<void> {
    this.activeContext = ctx;
  }

  @Watch('theme')
  protected onThemeChanged(nextTheme: string) {
    if (this.store && this.store.theme$.get() !== nextTheme) {
      this.store.theme$.set(nextTheme);
    }
  }

  @Watch('appearance')
  protected onAppearanceChanged(nextAppearance: string) {
    if (this.store && this.store.appearance$.get() !== nextAppearance) {
      this.store.appearance$.set(nextAppearance);
    }
  }

  private onWindowBlur = () => {
    this.windowFocused = false;
    this.activeContext = 'inactive';
  };

  private onWindowFocus = () => {
    this.windowFocused = true;
    if (this.modalOpenCount === 0) {
      this.activeContext = 'active';
    }
  };

  private onPopupOpen = (event: CustomEvent) => {
    const target = event.target as HTMLElement & { modal?: boolean };
    if (!target || target.tagName.toLowerCase() !== 'le-popup' || !target.modal) {
      return;
    }

    this.modalOpenCount += 1;
    this.activeContext = 'inactive';
  };

  private onPopupClose = (event: CustomEvent) => {
    const target = event.target as HTMLElement & { modal?: boolean };
    if (!target || target.tagName.toLowerCase() !== 'le-popup' || !target.modal) {
      return;
    }

    this.modalOpenCount = Math.max(0, this.modalOpenCount - 1);
    if (this.windowFocused && this.modalOpenCount === 0) {
      this.activeContext = 'active';
    }
  };

  render() {
    return <slot></slot>;
  }
}

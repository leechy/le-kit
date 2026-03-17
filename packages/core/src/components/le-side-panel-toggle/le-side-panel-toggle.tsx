import { Build, Component, Element, Event, EventEmitter, Prop, Watch, h } from '@stencil/core';

export type LeSidePanelToggleAction = 'toggle' | 'open' | 'close';

export type LeSidePanelRequestToggleDetail = {
  panelId?: string;
  action: LeSidePanelToggleAction;
};

type ShortcutSpec = {
  key: string;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

function parseShortcut(input?: string): ShortcutSpec | undefined {
  if (!input) {
    return undefined;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  const parts = trimmed
    .split('+')
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1).map(m => m.toLowerCase());

  const spec: ShortcutSpec = {
    key: key.toLowerCase(),
    alt: mods.includes('alt') || mods.includes('option'),
    ctrl: mods.includes('ctrl') || mods.includes('control'),
    meta: mods.includes('meta') || mods.includes('cmd') || mods.includes('command'),
    shift: mods.includes('shift'),
  };

  if (mods.includes('mod')) {
    // mac: Cmd, others: Ctrl
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    if (isMac) {
      spec.meta = true;
    } else {
      spec.ctrl = true;
    }
  }

  return spec;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  return target.isContentEditable;
}

@Component({
  tag: 'le-side-panel-toggle',
  shadow: true,
})
export class LeSidePanelToggle {
  @Element() el: HTMLElement;

  /** Optional id used to target a specific panel. */
  @Prop() panelId?: string;

  /** Action to emit. Default toggles the panel. */
  @Prop() action: LeSidePanelToggleAction = 'toggle';

  /** Optional keyboard shortcut like `Mod+B` or `Alt+N`. */
  @Prop() shortcut?: string;

  /** Disables the toggle. */
  @Prop() disabled: boolean = false;

  // Pass-through props for le-button
  @Prop({ mutable: true, reflect: true }) mode: 'default' | 'admin';
  @Prop() variant: 'solid' | 'outlined' | 'clear' | 'system' = 'solid';
  @Prop() color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';
  @Prop() selected: boolean = false;
  @Prop({ reflect: true }) fullWidth: boolean = false;
  @Prop() iconOnly?: string | Node;
  @Prop() iconStart?: string | Node;
  @Prop() iconEnd?: string | Node;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop() href?: string;
  @Prop() target?: string;
  @Prop() align: 'start' | 'center' | 'space-between' | 'end' = 'center';

  @Event({
    eventName: 'leSidePanelRequestToggle',
    bubbles: true,
    composed: true,
  })
  leSidePanelRequestToggle: EventEmitter<LeSidePanelRequestToggleDetail>;

  private shortcutSpec?: ShortcutSpec;
  private expanded: boolean | undefined;

  private buttonEl?: HTMLElement;
  private forwardedNodes?: ChildNode[];

  @Watch('shortcut')
  protected onShortcutChanged() {
    this.shortcutSpec = parseShortcut(this.shortcut);
    this.syncShortcutListener();
  }

  connectedCallback() {
    this.shortcutSpec = parseShortcut(this.shortcut);
    this.forwardedNodes = Array.from(this.el.childNodes);

    if (Build.isBrowser) {
      this.syncShortcutListener();
      document.addEventListener('leSidePanelOpenChange', this.onPanelStateChange as any);
      document.addEventListener('leSidePanelCollapsedChange', this.onPanelStateChange as any);
    }
  }

  componentDidLoad() {
    this.syncForwardedNodesIntoButton();
    this.syncAriaExpanded();
  }

  componentDidRender() {
    this.syncForwardedNodesIntoButton();
    this.syncAriaExpanded();
  }

  disconnectedCallback() {
    if (Build.isBrowser) {
      document.removeEventListener('keydown', this.onDocumentKeyDown, true);
      document.removeEventListener('leSidePanelOpenChange', this.onPanelStateChange as any);
      document.removeEventListener('leSidePanelCollapsedChange', this.onPanelStateChange as any);
    }
  }

  private syncShortcutListener() {
    if (!Build.isBrowser) {
      return;
    }
    if (this.shortcutSpec) {
      document.addEventListener('keydown', this.onDocumentKeyDown, true);
    } else {
      document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    }
  }

  private getResolvedPanelId(): string | undefined {
    if (this.panelId) {
      return this.panelId;
    }
    const closestPanel = this.el?.closest?.('le-side-panel') as any;
    if (closestPanel?.panelId) {
      return closestPanel.panelId;
    }
    return undefined;
  }

  private emitRequest() {
    if (this.disabled) {
      return;
    }

    this.leSidePanelRequestToggle.emit({
      panelId: this.getResolvedPanelId(),
      action: this.action,
    });
  }

  private onDocumentKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }
    const spec = this.shortcutSpec;
    if (!spec) {
      return;
    }

    if (isEditableTarget(ev.target)) {
      return;
    }

    const key = (ev.key || '').toLowerCase();
    if (key !== spec.key) {
      return;
    }

    if (!!ev.altKey !== spec.alt) {
      return;
    }
    if (!!ev.ctrlKey !== spec.ctrl) {
      return;
    }
    if (!!ev.metaKey !== spec.meta) {
      return;
    }
    if (!!ev.shiftKey !== spec.shift) {
      return;
    }

    ev.preventDefault();
    this.emitRequest();
  };

  private onPanelStateChange = (ev: CustomEvent<any>) => {
    const detail = ev.detail || {};
    const requestedId = this.getResolvedPanelId() || '';
    const eventId = detail.panelId || '';

    if (requestedId !== eventId) {
      return;
    }

    if (typeof detail.open === 'boolean') {
      this.expanded = detail.open;
      this.syncAriaExpanded();
    }
    if (typeof detail.collapsed === 'boolean') {
      this.expanded = !detail.collapsed;
      this.syncAriaExpanded();
    }
  };

  private syncForwardedNodesIntoButton() {
    const btn = this.buttonEl as any;
    if (!btn || !this.forwardedNodes || this.forwardedNodes.length === 0) {
      return;
    }

    for (const node of this.forwardedNodes) {
      if (!node) {
        continue;
      }
      if (node.parentNode !== btn) {
        try {
          btn.appendChild(node);
        } catch {
          // ignore
        }
      }
    }
  }

  private syncAriaExpanded() {
    const value = typeof this.expanded === 'boolean' ? String(this.expanded) : null;
    const hostBtn = this.buttonEl as any;
    if (!hostBtn) {
      return;
    }

    // Best-effort: set on the actual internal <button>/<a> inside le-button.
    const inner = (hostBtn.shadowRoot?.querySelector?.('[part="button"]') as HTMLElement) || null;
    const target = inner || hostBtn;
    if (value) {
      target.setAttribute('aria-expanded', value);
    } else {
      target.removeAttribute('aria-expanded');
    }
  }

  render() {
    return (
      <le-button
        ref={el => (this.buttonEl = el as HTMLElement)}
        mode={this.mode}
        variant={this.variant}
        color={this.color}
        size={this.size}
        selected={this.selected}
        fullWidth={this.fullWidth}
        iconOnly={this.iconOnly as any}
        iconStart={this.iconStart as any}
        iconEnd={this.iconEnd as any}
        disabled={this.disabled}
        type={this.type}
        href={this.href}
        target={this.target}
        align={this.align}
        onClick={() => this.emitRequest()}
      />
    );
  }
}

import type { LeListActionStateDetail, LeListTriggerActionDetail } from '../types/list';

export const LE_LIST_ACTION_STATE_EVENT = 'le-list:action-state';
export const LE_LIST_TRIGGER_ACTION_EVENT = 'le-list:trigger-action';

/**
 * Resolves the appropriate EventTarget for the action bus.
 * Checks for an enclosing <le-kit> context orchestrator, falling back to document.
 */
export function getActionBusTarget(el?: HTMLElement): EventTarget | null {
  if (typeof document === 'undefined') return null;
  if (el) {
    const kit = el.closest('le-kit');
    if (kit) return kit;
  }
  return document;
}

const lastActionStateByListId = new Map<string, LeListActionStateDetail>();

/**
 * Returns the most recent action state for a given list ID.
 */
export function getLatestActionState(listId: string): LeListActionStateDetail | undefined {
  return lastActionStateByListId.get(listId);
}

/**
 * Returns all currently known action states across all lists.
 */
export function getAllLatestActionStates(): LeListActionStateDetail[] {
  return Array.from(lastActionStateByListId.values());
}

/**
 * Dispatches an action state change event across the action bus.
 */
export function dispatchActionState(source: HTMLElement, detail: LeListActionStateDetail): void {
  if (detail.unloaded) {
    lastActionStateByListId.delete(detail.listId);
  } else if (detail.listId) {
    lastActionStateByListId.set(detail.listId, detail);
  }

  const target = getActionBusTarget(source);
  if (!target) return;

  const event = new CustomEvent<LeListActionStateDetail>(LE_LIST_ACTION_STATE_EVENT, {
    detail,
    bubbles: true,
    composed: true,
  });

  target.dispatchEvent(event);
}

/**
 * Dispatches a trigger action request across the action bus.
 */
export function dispatchTriggerAction(source: HTMLElement, detail: LeListTriggerActionDetail): void {
  const target = getActionBusTarget(source);
  if (!target) return;

  const event = new CustomEvent<LeListTriggerActionDetail>(LE_LIST_TRIGGER_ACTION_EVENT, {
    detail: {
      ...detail,
      source,
    },
    bubbles: true,
    composed: true,
  });

  target.dispatchEvent(event);
}

/**
 * Subscribes a listener to action state changes. Returns an unsubscribe function.
 */
export function subscribeActionState(
  el: HTMLElement | null | undefined,
  listener: (detail: LeListActionStateDetail) => void,
): () => void {
  const target = getActionBusTarget(el ?? undefined);
  if (!target) return () => {};

  const handler = (e: Event) => {
    const customEv = e as CustomEvent<LeListActionStateDetail>;
    if (customEv.detail) {
      listener(customEv.detail);
    }
  };

  target.addEventListener(LE_LIST_ACTION_STATE_EVENT, handler as EventListener);
  return () => {
    target.removeEventListener(LE_LIST_ACTION_STATE_EVENT, handler as EventListener);
  };
}

/**
 * Subscribes a listener to action triggers. Returns an unsubscribe function.
 */
export function subscribeTriggerAction(
  el: HTMLElement | null | undefined,
  listener: (detail: LeListTriggerActionDetail) => void,
): () => void {
  const target = getActionBusTarget(el ?? undefined);
  if (!target) return () => {};

  const handler = (e: Event) => {
    const customEv = e as CustomEvent<LeListTriggerActionDetail>;
    if (customEv.detail) {
      listener(customEv.detail);
    }
  };

  target.addEventListener(LE_LIST_TRIGGER_ACTION_EVENT, handler as EventListener);
  return () => {
    target.removeEventListener(LE_LIST_TRIGGER_ACTION_EVENT, handler as EventListener);
  };
}

/**
 * Parses a comma- or whitespace-separated list of IDs into a normalized array.
 */
export function parseListIds(bindList?: string): string[] {
  if (!bindList || typeof bindList !== 'string') return [];
  return bindList
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

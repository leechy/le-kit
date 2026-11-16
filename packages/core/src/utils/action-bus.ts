import type { LeListActionStateDetail, LeListTriggerActionDetail } from '../types/list';
import {
  dispatchBusEvent,
  forgetState,
  getAllLatestStates,
  getBusTarget,
  getLatestState,
  parseIds,
  publishState,
  subscribeBusEvent,
  subscribeState,
} from './state-bus';

/**
 * The list action bus: <le-list> publishes the state of its actions, buttons and
 * toolbars bound to it (`bind-list`) follow it and trigger actions back.
 * Built on the generic state bus (./state-bus).
 */

export const LE_LIST_ACTION_STATE_EVENT = 'le-list:action-state';
export const LE_LIST_TRIGGER_ACTION_EVENT = 'le-list:trigger-action';

/** The closest <le-kit>, or the document. */
export const getActionBusTarget = getBusTarget;

/** Returns the most recent action state for a given list ID. */
export function getLatestActionState(listId: string): LeListActionStateDetail | undefined {
  return getLatestState<LeListActionStateDetail>(LE_LIST_ACTION_STATE_EVENT, listId);
}

/** Returns all currently known action states across all lists. */
export function getAllLatestActionStates(): LeListActionStateDetail[] {
  return getAllLatestStates<LeListActionStateDetail>(LE_LIST_ACTION_STATE_EVENT);
}

/**
 * Publishes a list's action state. An `unloaded` state still reaches subscribers
 * (so bound buttons can reset) but is not remembered.
 */
export function dispatchActionState(source: HTMLElement, detail: LeListActionStateDetail): void {
  const key = detail.listId ?? '';
  publishState(source, LE_LIST_ACTION_STATE_EVENT, key, detail);
  if (detail.unloaded || !detail.listId) forgetState(LE_LIST_ACTION_STATE_EVENT, key);
}

/** Dispatches a trigger action request across the action bus. */
export function dispatchTriggerAction(source: HTMLElement, detail: LeListTriggerActionDetail): void {
  dispatchBusEvent<LeListTriggerActionDetail>(source, LE_LIST_TRIGGER_ACTION_EVENT, { ...detail, source });
}

/** Subscribes a listener to action state changes. Returns an unsubscribe function. */
export function subscribeActionState(
  el: HTMLElement | null | undefined,
  listener: (detail: LeListActionStateDetail) => void,
): () => void {
  return subscribeState<LeListActionStateDetail>(el, LE_LIST_ACTION_STATE_EVENT, state => {
    if (state) listener(state);
  });
}

/** Subscribes a listener to action triggers. Returns an unsubscribe function. */
export function subscribeTriggerAction(
  el: HTMLElement | null | undefined,
  listener: (detail: LeListTriggerActionDetail) => void,
): () => void {
  return subscribeBusEvent<LeListTriggerActionDetail>(el, LE_LIST_TRIGGER_ACTION_EVENT, listener);
}

/** Parses a comma- or whitespace-separated list of IDs into a normalized array. */
export const parseListIds = parseIds;

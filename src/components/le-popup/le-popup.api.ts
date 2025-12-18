/**
 * Programmatic API for le-popup component
 *
 * These functions allow you to show popups without manually creating elements.
 *
 * @example
 * // Alert
 * await leAlert('Something happened!');
 *
 * // Confirm
 * const confirmed = await leConfirm('Are you sure?');
 * if (confirmed) { ... }
 *
 * // Prompt
 * const name = await lePrompt('What is your name?');
 * if (name !== null) { ... }
 */

import { LeKitMode } from '../..';
import type { PopupType, PopupPosition, PopupResult } from './le-popup';

/**
 * Options for programmatic popup functions
 */
export interface PopupOptions {
  title?: string;
  type?: PopupType;
  modal?: boolean;
  position?: PopupPosition;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  theme?: string;
}

/**
 * Interface for the le-popup custom element
 */
interface HTMLLePopupElement extends HTMLElement {
  open: boolean;
  type: PopupType;
  mode: LeKitMode;
  popupTitle?: string;
  message?: string;
  modal: boolean;
  position: PopupPosition;
  confirmText: string;
  cancelText: string;
  placeholder: string;
  defaultValue: string;
  show(): Promise<PopupResult>;
  hide(confirmed?: boolean): Promise<void>;
}

/**
 * Show an alert popup with a message
 * @param message - The message to display
 * @param options - Optional configuration
 * @returns Promise that resolves when closed
 *
 * @example
 * await leAlert('File saved successfully!');
 * await leAlert('Error occurred', { title: 'Error', theme: 'dark' });
 */
export async function leAlert(message: string, options: PopupOptions = {}): Promise<void> {
  const popup = createPopupElement(message, { ...options, type: 'alert' });
  document.body.appendChild(popup);

  await popup.show();
  popup.remove();
}

/**
 * Show a confirm popup with OK/Cancel buttons
 * @param message - The message to display
 * @param options - Optional configuration
 * @returns Promise that resolves to true (confirmed) or false (cancelled)
 *
 * @example
 * const confirmed = await leConfirm('Delete this item?');
 * if (confirmed) {
 *   deleteItem();
 * }
 */
export async function leConfirm(message: string, options: PopupOptions = {}): Promise<boolean> {
  const popup = createPopupElement(message, { ...options, type: 'confirm' });
  document.body.appendChild(popup);

  const result = await popup.show();
  popup.remove();

  return result.confirmed;
}

/**
 * Show a prompt popup with an input field
 * @param message - The message to display
 * @param options - Optional configuration (including defaultValue, placeholder)
 * @returns Promise that resolves to the input value or null if cancelled
 *
 * @example
 * const name = await lePrompt('Enter your name:', {
 *   title: 'Welcome',
 *   placeholder: 'John Doe',
 *   defaultValue: 'Guest'
 * });
 * if (name !== null) {
 *   greetUser(name);
 * }
 */
export async function lePrompt(
  message: string,
  options: PopupOptions = {},
): Promise<string | null> {
  const popup = createPopupElement(message, { ...options, type: 'prompt' });
  document.body.appendChild(popup);

  const result = await popup.show();
  popup.remove();

  return result.confirmed ? result.value ?? '' : null;
}

/**
 * Create a popup element with the given configuration
 */
function createPopupElement(message: string, options: PopupOptions): HTMLLePopupElement {
  const popup = document.createElement('le-popup') as HTMLLePopupElement;

  popup.message = message;
  popup.type = options.type || 'alert';
  popup.mode = 'default';

  if (options.title) popup.popupTitle = options.title;
  if (options.modal !== undefined) popup.modal = options.modal;
  if (options.position) popup.position = options.position;
  if (options.confirmText) popup.confirmText = options.confirmText;
  if (options.cancelText) popup.cancelText = options.cancelText;
  if (options.placeholder) popup.placeholder = options.placeholder;
  if (options.defaultValue) popup.defaultValue = options.defaultValue;
  if (options.theme) popup.setAttribute('theme', options.theme);

  return popup;
}

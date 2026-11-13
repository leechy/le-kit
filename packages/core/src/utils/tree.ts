import type { LeOption } from '../types/options';
import { getOptionElement } from './utils';

export interface TreeNodeInfo {
  item: LeOption;
  parentList: LeOption[];
  index: number;
  parentId?: string;
}

export interface TreeReorderResult {
  success: boolean;
  newItems?: LeOption[];
  draggedItem?: LeOption;
  targetItem?: LeOption;
  oldParentId?: string;
  newParentId?: string;
}

/**
 * Recursively finds an item in the options tree by id, value, or label.
 */
export function findNodeInTree(
  items: LeOption[],
  id: string,
  parentId?: string,
): TreeNodeInfo | undefined {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.id === id || item.value === id || item.label === id) {
      return { item, parentList: items, index: i, parentId };
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      const res = findNodeInTree(item.children, id, item.id);
      if (res) return res;
    }
  }
  return undefined;
}

/**
 * Returns the depth of an item within the tree (0 for root items).
 */
export function getNodeDepth(items: LeOption[], targetId: string, currentDepth = 0): number {
  for (const item of items) {
    if (item.id === targetId || item.value === targetId || item.label === targetId) return currentDepth;
    if (Array.isArray(item.children) && item.children.length > 0) {
      const d = getNodeDepth(item.children, targetId, currentDepth + 1);
      if (d !== -1) return d;
    }
  }
  return -1;
}

/**
 * Returns the maximum relative depth of any descendant of the given item.
 * (0 if the item has no children, 1 if its deepest child has no children, etc.)
 */
export function getSubtreeDepth(item?: LeOption): number {
  if (!item || !Array.isArray(item.children) || item.children.length === 0) {
    return 0;
  }
  let maxChildDepth = 0;
  for (const child of item.children) {
    const childDepth = getSubtreeDepth(child);
    if (childDepth > maxChildDepth) {
      maxChildDepth = childDepth;
    }
  }
  return 1 + maxChildDepth;
}

/**
 * Returns the chain of ancestors that can be outdented to when dragging past the last child of an item.
 */
export function getOutdentAncestors(
  items: LeOption[],
  targetId: string,
): Array<{ id: string; depth: number; parentId?: string }> {
  const chain: Array<{ id: string; depth: number; parentId?: string }> = [];
  let currentId: string | undefined = targetId;

  while (currentId) {
    const node = findNodeInTree(items, currentId);
    if (!node) break;

    const depth = getNodeDepth(items, node.item.id!);
    chain.push({
      id: node.item.id!,
      depth,
      parentId: node.parentId,
    });

    if (node.parentId && node.index === node.parentList.length - 1) {
      currentId = node.parentId;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Checks if targetId is a descendant of ancestorId.
 */
export function isDescendantOf(items: LeOption[], ancestorId: string, targetId: string): boolean {
  const ancestor = findNodeInTree(items, ancestorId);
  if (!ancestor || !Array.isArray(ancestor.item.children)) return false;
  return !!findNodeInTree(ancestor.item.children, targetId);
}

/**
 * Pure tree immutability helper to move an item to before, inside, or after targetId.
 */
export function reorderTreeItem(
  items: LeOption[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'inside' | 'after',
  onSetOpen?: (id: string, open: boolean) => void,
): TreeReorderResult {
  const cloned: LeOption[] = JSON.parse(JSON.stringify(items));
  const draggedNode = findNodeInTree(cloned, draggedId);
  const targetNode = findNodeInTree(cloned, targetId);

  if (!draggedNode || !targetNode) {
    return { success: false };
  }

  const oldParentId = draggedNode.parentId;

  if (draggedId === targetId && (position === 'before' || position === 'after')) {
    return {
      success: true,
      newItems: cloned,
      draggedItem: draggedNode.item,
      targetItem: targetNode.item,
      oldParentId,
      newParentId: oldParentId,
    };
  }

  const itemToMove = draggedNode.parentList.splice(draggedNode.index, 1)[0];

  if (position === 'inside') {
    const updatedTarget = findNodeInTree(cloned, targetId);
    if (!updatedTarget) return { success: false };
    if (!Array.isArray(updatedTarget.item.children)) {
      updatedTarget.item.children = [];
    }
    updatedTarget.item.children.unshift(itemToMove);
    updatedTarget.item.open = true;
    if (onSetOpen) {
      onSetOpen(targetId, true);
    }
    return {
      success: true,
      newItems: cloned,
      draggedItem: itemToMove,
      targetItem: targetNode.item,
      oldParentId,
      newParentId: targetId,
    };
  }

  const updatedTarget = findNodeInTree(cloned, targetId);
  if (!updatedTarget) return { success: false };
  const insertIdx = position === 'before' ? updatedTarget.index : updatedTarget.index + 1;
  updatedTarget.parentList.splice(insertIdx, 0, itemToMove);

  return {
    success: true,
    newItems: cloned,
    draggedItem: draggedNode.item,
    targetItem: targetNode.item,
    oldParentId,
    newParentId: updatedTarget.parentId,
  };
}

/**
 * Reorders declarative <le-item> DOM elements.
 */
export function reorderDeclarativeDomNodes(
  draggedItem?: LeOption,
  targetItem?: LeOption,
  position?: 'before' | 'inside' | 'after',
) {
  if (!draggedItem || !targetItem || !position) return;
  if (draggedItem === targetItem && (position === 'before' || position === 'after')) return;
  const draggedEl = getOptionElement(draggedItem);
  const targetEl = getOptionElement(targetItem);

  if (!draggedEl || !targetEl || !targetEl.parentNode) return;

  const parent = targetEl.parentNode;
  if (position === 'inside') {
    const firstChild = targetEl.firstElementChild;
    if (firstChild) {
      targetEl.insertBefore(draggedEl, firstChild);
    } else {
      targetEl.appendChild(draggedEl);
    }
    targetEl.setAttribute('open', '');
  } else if (position === 'before') {
    parent.insertBefore(draggedEl, targetEl);
  } else if (position === 'after') {
    parent.insertBefore(draggedEl, targetEl.nextSibling);
  }
}

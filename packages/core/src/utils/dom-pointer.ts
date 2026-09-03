/**
 * DOM and Pointer utility functions for Drag-Through and Auto-scrolling
 */

/**
 * Shadow-piercing elementFromPoint to find the innermost DOM element
 * under the client coordinates (x, y).
 */
export function deepElementFromPoint(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el && el.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

/**
 * Finds the closest actionable interactive element for selection.
 */
export function findActionableElement(
  el: Element | null,
  popoverContainer?: HTMLElement | null,
): HTMLElement | null {
  let current: Element | null = el;

  while (current && current !== popoverContainer && current !== document.body) {
    if (current instanceof HTMLElement) {
      const role = current.getAttribute('role');
      const isOption =
        role === 'option' ||
        role === 'menuitem' ||
        role === 'button' ||
        role === 'tab' ||
        current.tagName.toLowerCase() === 'button' ||
        current.tagName.toLowerCase() === 'a' ||
        current.classList.contains('dropdown-option') ||
        current.classList.contains('nav-item') ||
        current.hasAttribute('data-selectable') ||
        current.hasAttribute('data-index');

      if (isOption) {
        // If disabled, ignore
        if (
          current.hasAttribute('disabled') ||
          current.getAttribute('aria-disabled') === 'true' ||
          current.classList.contains('is-disabled')
        ) {
          return null;
        }
        return current;
      }
    }

    // Traverse up parent node or shadow host
    const parent = current.parentElement;
    if (parent) {
      current = parent;
    } else {
      const root = current.getRootNode?.();
      if (root instanceof ShadowRoot) {
        current = root.host;
      } else {
        break;
      }
    }
  }

  return null;
}

/**
 * Finds the active scroll container inside or including a popover element.
 * Recursively pierces shadow roots (e.g. when called on <le-popover>).
 */
export function findScrollContainer(popoverContainer: HTMLElement): HTMLElement | null {
  const isScrollable = (el: HTMLElement): boolean => {
    const style = window.getComputedStyle(el);
    return (
      /(auto|scroll)/.test(style.overflowY) &&
      el.scrollHeight > el.clientHeight &&
      el.clientHeight > 0
    );
  };

  // If container itself is scrollable (e.g., .le-popover-content dialog)
  if (isScrollable(popoverContainer)) {
    return popoverContainer;
  }

  // Search across shadow DOM and light DOM
  const queue: (Element | ShadowRoot)[] = [];

  if (popoverContainer.shadowRoot) {
    queue.push(popoverContainer.shadowRoot);
  }
  queue.push(popoverContainer);

  while (queue.length > 0) {
    const node = queue.shift()!;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof HTMLElement) {
        if (isScrollable(child)) {
          return child;
        }
        if (child.shadowRoot) {
          queue.push(child.shadowRoot);
        }
        queue.push(child);
      }
    }
  }

  return null;
}

export interface AutoScroller {
  update(pointerY: number, container: HTMLElement): void;
  stop(): void;
}

/**
 * Creates an auto-scroller that smoothly scrolls a container when the pointer
 * is near or beyond its top/bottom edges, with velocity accelerating by distance.
 */
export function createAutoScroller(): AutoScroller {
  let rafId: number | null = null;
  let currentSpeed = 0;
  let activeContainer: HTMLElement | null = null;

  const scrollLoop = () => {
    if (activeContainer && currentSpeed !== 0) {
      activeContainer.scrollTop += currentSpeed;
      rafId = requestAnimationFrame(scrollLoop);
    } else {
      rafId = null;
    }
  };

  return {
    update(pointerY: number, container: HTMLElement) {
      activeContainer = container;
      const rect = container.getBoundingClientRect();
      const edgeThreshold = 30; // Distance inside edge to start scrolling
      const minSpeed = 2;
      const maxSpeed = 16;

      let speed = 0;

      // Scrolling UP
      if (pointerY < rect.top + edgeThreshold) {
        if (container.scrollTop > 0) {
          const dist = rect.top + edgeThreshold - pointerY;
          const factor = Math.min(Math.max(dist / 60, 0.1), 1);
          speed = -(minSpeed + (maxSpeed - minSpeed) * factor);
        }
      }
      // Scrolling DOWN
      else if (pointerY > rect.bottom - edgeThreshold) {
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScrollTop - 1) {
          const dist = pointerY - (rect.bottom - edgeThreshold);
          const factor = Math.min(Math.max(dist / 60, 0.1), 1);
          speed = minSpeed + (maxSpeed - minSpeed) * factor;
        }
      }

      currentSpeed = speed;

      if (currentSpeed !== 0) {
        if (!rafId) {
          rafId = requestAnimationFrame(scrollLoop);
        }
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    },
    stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      currentSpeed = 0;
      activeContainer = null;
    },
  };
}

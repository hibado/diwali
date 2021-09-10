import { query, queryAll } from './query';

export * from './query';
export * from './attribute';
export * from './scroll';

export function removeElement(element: Element) {
  const parent = element.parentNode;
  if (parent) {
    parent.removeChild(element);
  }
}

export function moveElement(
  element: Node,
  toParent: Node | null,
  beforeSibling: Node | null = null,
) {
  if (toParent) {
    toParent.insertBefore(element, beforeSibling);
  }
}

export function moveElementToLead(
  element: Node,
  toBeLeaded: Node,
  parent = toBeLeaded?.parentNode,
) {
  moveElement(element, parent, toBeLeaded);
}

export function moveElementToFollow(
  element: Node,
  toBeFollowed: Node,
  parent = toBeFollowed?.parentNode,
) {
  moveElement(element, parent, toBeFollowed?.nextSibling);
}

export function removeElementAll(selector: string, root = document) {
  queryAll(root, selector).forEach(removeElement);
}

export function getInputValue(id: string) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  return input && input.value;
}

export function fixViewportMeta(
  viewportSettings = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0',
) {
  const viewport = query('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', viewportSettings);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', viewportSettings);
    document.head.appendChild(meta);
  }
}

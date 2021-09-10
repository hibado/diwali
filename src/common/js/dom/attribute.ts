export function setAttribute(element: Element, attr: string, value: any) {
  element.setAttribute(attr, typeof value === 'string' ? value : JSON.stringify(value));
}

export function setAttributes(element: Element, attrs: Record<string, any>) {
  Object.keys(attrs).forEach((attr) => {
    setAttribute(element, attr, attrs[attr]);
  });
}

export function getAttribute(
  element: Element,
  attr: string,
  options?: { isJSON: false },
): string | null;
export function getAttribute(
  element: Element,
  attr: string,
  options: { isJSON: true },
): Record<string | number, unknown>;
export function getAttribute(element: Element, attr: string, { isJSON = false } = {}) {
  const value = element.getAttribute(attr);
  if (value === null) {
    return value;
  }
  if (isJSON) {
    return JSON.parse(value);
  }
  return value;
}

export function classAdd(element: Element, ...tokens: Array<string | undefined>) {
  return element.classList.add(...(tokens.filter((token) => Boolean(token)) as string[]));
}

export function classRemove(element: Element, ...tokens: string[]) {
  return element.classList.remove(...tokens);
}

export function classToggle(element: Element, token: string): boolean;
export function classToggle(element: Element, token: string, force: boolean): boolean;
/**
 * @param classes 各属性名为 className，属性值必须是 boolean 型，否则会被忽略；属性值为 true 时加上对应的 className，为 false 时去掉
 */
export function classToggle(
  element: Element,
  classes: Record<string, boolean | undefined>,
): Record<string, boolean>;
export function classToggle(
  element: Element,
  ...args: [Record<string, boolean | undefined>] | [string] | [string, boolean | undefined]
): boolean | Record<string, boolean> {
  if (typeof args[0] === 'string') {
    return element.classList.toggle(args[0], args[1]);
  }

  const tokens = args[0] as Record<string, boolean>;
  const classesExist: Record<string, boolean> = Object.create(null);
  Object.keys(tokens)
    .filter((token) => typeof tokens[token] === 'boolean')
    .forEach((token) => {
      classesExist[token] = element.classList.toggle(token, tokens[token]);
    });
  return classesExist;
}

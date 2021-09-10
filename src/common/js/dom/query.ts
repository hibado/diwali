type Nullable<T> = T | null;
/**
 * ```javascript
 *  let container = query('#section-kv'); // 相当于 query(document, '#section-kv'); container 是 document 可以省略
 *  let containerQuery = query(container); // 如果没有传入 selector，相当于 curry 化
 *  let item = containerQuery('.item'); // 相当于 query(container, '.item')
 * ```
 */
export function query(container: ParentNode): <R = HTMLElement>(selector: string) => Nullable<R>;
export function query<T = HTMLElement>(selector: string): Nullable<T>;
export function query<T = HTMLElement>(container: ParentNode, selector: string): Nullable<T>;
export function query<T = HTMLElement>(
  container: ParentNode | string,
  selector?: string,
): Nullable<T> | (<R = HTMLElement>(selector: string) => Nullable<R>) {
  if (typeof container === 'string') {
    return query(document, container);
  }
  if (selector === undefined) {
    return (selector) => query(container, selector);
  }

  return container.querySelector(selector) as unknown as Nullable<T>;
}

/**
 * @param {HTMLElement|Document|string} container
 * @param {string} selector
 * @returns {Array<HTMLElement>|((selector: string) => Array<HTMLElement>)}
 */
export function queryAll(container: ParentNode): <R = HTMLElement>(selector: string) => R[];
export function queryAll<T = HTMLElement>(selector: string): T[];
export function queryAll<T = HTMLElement>(container: ParentNode, selector: string): T[];
export function queryAll<T = HTMLElement>(
  container: ParentNode | string,
  selector?: string,
): T[] | (<R = HTMLElement>(selector: string) => R[]) {
  if (typeof container === 'string') {
    return queryAll(document, container);
  }

  if (selector === undefined) {
    return (selector) => queryAll(container, selector);
  }

  return Array.from(container.querySelectorAll(selector) as unknown as T[]);
}

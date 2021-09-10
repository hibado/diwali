/**
 * 计数开关：计数为 0 时`OFF`，计数大于 0 时`ON`；
 * 调用`on()`方法增加计数，调用`off()`方法减少计数；
 * 在计数`0 -> 1`或`1 -> 0`变化时触发相应的回调。
 *
 * @example
 * ```javascript
 * const switch = CounterSwitch.create();
 * console.log(switch.isOn); // false
 *
 * switch.on();
 * console.log(switch.isOn); // true
 * switch.on();
 *
 * switch.off();
 * console.log(switch.isOn); // true
 * switch.off();
 * console.log(switch.isOn); // false
 * ```
 */
export class CounterSwitch<
  TOn extends ((...args: any[]) => void | Promise<void>) | undefined,
  TOff extends ((...args: any[]) => void | Promise<void>) | undefined,
> {
  static create<TOn extends (...args: any[]) => void | Promise<void>>(
    on: TOn,
  ): CounterSwitch<TOn, undefined>;

  static create<
    TOn extends (...args: any[]) => void | Promise<void>,
    TOff extends (...args: any[]) => void,
  >(on: TOn, off: TOff): CounterSwitch<TOn, TOff>;

  static create(): CounterSwitch<undefined, undefined>;

  static create<
    TOn extends (...args: any[]) => void | Promise<void>,
    TOff extends (...args: any[]) => void | Promise<void>,
  >(on?: TOn, off?: TOff) {
    return new CounterSwitch<TOn, TOff>(on, off);
  }

  private cnt = 0;

  private readonly callbacks: { on?: TOn; off?: TOff } = {};

  private constructor(on?: TOn, off?: TOff) {
    this.callbacks.on = on;
    this.callbacks.off = off;
  }

  get isOn() {
    return this.cnt > 0;
  }

  get isOff() {
    return this.cnt < 1;
  }

  on(...args: TOn extends (...args: any[]) => void ? Parameters<TOn> : void[]) {
    this.cnt += 1;
    if (this.cnt === 1) {
      this.callbacks.on?.(...args);
    }
  }

  async off(...args: TOff extends (...args: any[]) => void ? Parameters<TOff> : void[]) {
    if (this.cnt > 0) {
      if (this.cnt === 1) {
        await this.callbacks.off?.(...args);
      }
      this.cnt -= 1;
    }
  }
}

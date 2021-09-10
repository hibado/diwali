import throttle from 'lodash/throttle';

/** @typedef {'down'|'up'|'left'|'right'} Direction */
/** @type {Direction[]} */
const DIRECTIONS = ['down', 'up', 'left', 'right'];

/**
 * @typedef ThrottleOptions
 * @property {boolean} leading Specify invoking on the leading edge of the timeout.
 * @property {boolean} trailing Specify invoking on the trailing edge of the timeout.
 *
 * @param {number} wait
 * @param {ThrottleOptions} options
 */
function createThrottle(wait, options) {
  return (callback) => throttle(callback, wait, options);
}
/**
 * @typedef {(wait: number) => void} WaitToFinish
 * @typedef HandlerOptions
 * @property {any} state
 * @property {'wheel'|'touch'|string|undefined} how
 * @typedef {(direction: Direction, options: HandlerOptions, waitToFinish: WaitToFinish) => string|undefined} MoveHandler 返回新的 state
 * @typedef {(newState: any, oldState: any) => void} StateHandler
 *
 * @typedef Options
 * @property {HTMLElement} dom 监听的 HTMLElement 或 相应的选择器，如果不指定，则监听在 window 上
 * @property {MoveHandler} onMove 当有效事件触发后被调用，返回值会被设为新的 state
 * @property {StateHandler} onStateChange 当 state 变化时被调用——可能在 enter、exit 时或 onMove 后被调用
 * @property {number} wait 有效事件的触发间隔时间，单位`毫秒`，默认为`200`
 * @property {any} defaultState 初始的 state，默认为`undefined`；后续的 state 随 handler 的返回值改变
 * @property {Array<'wheel'|'touch'>} triggers 选择监听的事件，默认`['wheel', 'touch']`。TODO: 实现 touch 支持
 * @param {Options} options
 */
export function useSlide({
  dom,
  onMove,
  onStateChange,
  triggers = ['wheel', 'touch'],
  wait = 200,
}) {
  const doms = $(dom);
  if (__DEV__ && doms.length > 1) {
    throw new Error(`传入的 dom 有 ${doms.length} 个，只支持 1 个`);
  }

  const element = doms[0] || window;
  const throttledHandler = createThrottle(wait, { leading: true, trailing: false });

  let wheelHandler;
  let state;
  let paused = false;
  const setState = (newState) => {
    if (newState !== state) {
      const oldState = state;
      state = newState;
      if (onStateChange) {
        window.requestAnimationFrame(() => onStateChange(newState, oldState));
      }
    }
  };
  const callOnMove = (onMove, ...args) => {
    let waitToFinish = 0;
    setState(
      onMove(...args, (t) => {
        waitToFinish = t;
      }),
    );
    if (waitToFinish > 0) {
      paused = true;
      window.setTimeout(() => {
        paused = false;
      }, waitToFinish);
    }
  };
  if (triggers.includes('wheel')) {
    const onFilteredWheel = throttledHandler(
      /** @param {WheelEvent} evt */
      (evt) => {
        if (paused) {
          return;
        }
        let direction;
        const { deltaX: x, deltaY: y } = evt;
        if (Math.abs(y) >= Math.abs(x)) {
          direction = y > 0 ? 'down' : y < 0 ? 'up' : undefined;
        } else {
          direction = x > 0 ? 'right' : 'left';
        }
        if (direction) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('triggered wheel', { direction, state, how: 'wheel' });
          }
          callOnMove(onMove, direction, { state, how: 'wheel' });
        }
      },
    );
    let last = {
      ts: 0,
      deltaY: 0,
      deltaX: 0,
    };
    wheelHandler =
      /** @param {WheelEvent} evt */
      (evt) => {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        const { deltaX, deltaY } = evt;
        const dT = evt.timeStamp - last.ts;
        const dDeltaY = deltaY - last.deltaY;
        const dDeltaX = deltaX - last.deltaX;
        last = {
          deltaY,
          deltaX,
          ts: evt.timeStamp,
        };
        /**
         * 试图过滤掉触摸板的惯性影响
         * 当触发间隔较久或加速度达到阈值以上时，认为不是惯性事件
         */
        if (dT > wait || Math.abs(dDeltaY / dT) >= 3 || Math.abs(dDeltaX / dT) >= 3) {
          if (__DEBUG__) {
            // eslint-disable-next-line no-console
            console.debug('valid wheel', { dT, deltaY, dDeltaY, deltaX, dDeltaX });
          }
          onFilteredWheel(evt);
        }
        if (__DEBUG__) {
          // eslint-disable-next-line no-console
          console.debug('ignored wheel', { dT, deltaY, dDeltaY, deltaX, dDeltaX });
        }
      };
  }

  let entered = false;
  const enter =
    /**
     * 开始监听
     * @param {any} state 重置 state，如果为`undefined`则不改变`state`
     */
    (state) => {
      if (entered) return;
      entered = true;
      if (state !== undefined) {
        setState(state);
      }
      if (wheelHandler) {
        element.addEventListener('wheel', wheelHandler, { passive: false });
      }
    };
  const exit =
    /**
     * 停止监听
     * @param {any} state 重置 state，如果为`undefined`则不改变`state`
     */
    (state) => {
      if (!entered) return;
      entered = false;
      if (wheelHandler) {
        element.removeEventListener('wheel', wheelHandler);
      }
      if (state !== undefined) {
        setState(state);
      }
    };
  const trigger =
    /**
     * 手动触发一次事件
     * @param {Direction} direction
     * @param {HandlerOptions} options 当 options.state 不为 undefined 时，只有当前的 state 与 options.state 一致时才会触发
     * @returns {boolean} 是否成功触发——触发不成功的情况有两种：1. 未处于 entered 状态；2. 指定的 state 与 当前 state 不一致；3. paused
     */
    (direction, options) => {
      if (paused) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('当前处于 paused 状态，某次回调没有返回 state 或通过 onFinish 结束状态');
        }
        return false;
      }
      if (__DEV__ && !DIRECTIONS.includes(direction)) {
        // eslint-disable-next-line no-console
        console.error(`invalid direction: ${direction}, should be one of ${DIRECTIONS}`);
      }
      if (options.state === undefined) {
        options.state = state;
      }
      if (entered && options.state === state) {
        if (__DEBUG__) {
          // eslint-disable-next-line no-console
          console.debug('triggered manually', { direction, ...options });
        }
        callOnMove(onMove, direction, options);
        return true;
      }
      return false;
    };
  return { enter, exit, trigger };
}

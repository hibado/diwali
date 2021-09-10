import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import anime, { AnimeParams, AnimeTimelineInstance, AnimeAnimParams, EasingOptions } from 'animejs';
import _cloneDeep from 'lodash/cloneDeep';
import _omit from 'lodash/omit';
import { waitTransitionEnd } from './dom/event';
import { addResizeListener, vh } from './media/window-size';

type DistanceAbsType = number | string | (() => number);
type DistanceType = number | string | (() => number);

interface ILineAddition extends Omit<AnimeAnimParams, 'duration' | 'delay' | 'offset'> {
  duration: DistanceType;
  delay: DistanceType;
  offset: DistanceType;
  animeTimelineOffset?: string | number;
}
interface IConvertedLineAddition extends AnimeAnimParams {
  offset: string | number;
}
export interface ILine extends Omit<AnimeTimelineInstance, 'add'> {
  disabledResizeCalculate: () => void;
  enabledResizeCalculate: () => void;
  resize: () => void;
  add: (options: ILineAddition, offset: number | string) => this;
}

function convertDistance(distance: DistanceAbsType, isRelative = false): number | string {
  function addRelative(offset: number) {
    if (!isRelative) return offset;
    if (offset < 0) {
      return `-=${Math.abs(offset)}`;
    }
    return `+=${Math.abs(offset)}`;
  }

  if (typeof distance === 'number') {
    return addRelative(distance);
  }
  if (typeof distance === 'string') {
    if (distance[0] === '~') {
      return Number(distance.slice(1));
    }
    return convertDistance(Number(distance), isRelative);
  }

  if (typeof distance === 'function') {
    return convertDistance(distance(), isRelative);
  }

  return 0;
}

/**
 * 将添加的 options 转化为 anime.js 的 timeline options
 * @param {anime.AnimeAnimParams & { offset?: DistanceType, duration?: DistanceType, delay?: DistanceType }} options
 */
function calculateOptions(options: ILineAddition): IConvertedLineAddition {
  const _options = _cloneDeep(options);
  if (_options.duration !== undefined) _options.duration = convertDistance(_options.duration);
  if (_options.delay !== undefined) _options.delay = convertDistance(_options.delay);
  if (_options.offset !== undefined) _options.offset = convertDistance(_options.offset, true);
  return _options as IConvertedLineAddition;
}

export function line(props: AnimeParams & { debug?: boolean } = {}): ILine {
  const debug = props.debug;
  const optionsArray: ILineAddition[] = [];
  let resizeCalculate = true;
  let _timeline: AnimeTimelineInstance;

  const initTimeline = () => {
    _timeline = anime.timeline({
      ..._omit(props, 'debug'),
      easing: props.easing || 'linear',
      autoplay: props.autoplay || false,
    });
    const extraKeys = ['disabledResizeCalculate', 'enabledResizeCalculate', 'resize', 'add'];

    const proxy: ILine = new Proxy({} as ILine, {
      get(__, key: keyof ILine) {
        if (extraKeys.includes(key)) {
          if (key === 'add') {
            return (options: ILineAddition, offset: number | string) => {
              const _options: IConvertedLineAddition = calculateOptions(options);
              _timeline.add(_options, _options.offset ?? offset);
              optionsArray.push({
                ...options,
                // animeTimelineOffset 参数是为了兼容 anime 的 timeline.add 方法参数 (__, offset), 暂存 offset
                animeTimelineOffset: offset,
              });
              return proxy;
            };
          }
          if (key === 'disabledResizeCalculate') {
            return () => {
              resizeCalculate = false;
              return proxy;
            };
          }
          if (key === 'enabledResizeCalculate') {
            return () => {
              resizeCalculate = true;
              return proxy;
            };
          }
          if (key === 'resize') {
            return () => {
              if (debug) {
                console.log('line resize');
              }
              const p = _timeline.progress / 100;
              initTimeline();
              optionsArray.forEach((options) => {
                const _options: IConvertedLineAddition = calculateOptions(options);
                _timeline.add(_options, _options.offset ?? _options.animeTimelineOffset);
              });
              _timeline.seek(p * _timeline.duration);
              return proxy;
            };
          }
          return proxy;
        }
        if (typeof _timeline[key as keyof AnimeTimelineInstance] === 'function') {
          return (_timeline[key as keyof AnimeTimelineInstance] as (v: any) => any).bind(_timeline);
        }
        return _timeline[key as keyof AnimeTimelineInstance];
      },
    });
    return proxy;
  };

  const timelineProxy = initTimeline();

  addResizeListener(() => {
    if (resizeCalculate) {
      timelineProxy.resize();
    }
  });

  return timelineProxy;
}

type ScrollControllerProps = {
  start: () => number;
  end: () => number;
  timeline: ILine;
  flex: boolean;
};

export function scrollController({ start, end, timeline, flex }: ScrollControllerProps) {
  addScrollListener(document.body, {
    start: () => {
      return -start();
    },
    end: ({ targetRect }) => {
      return targetRect.height - end();
    },
    forceInViewBoundary: true,
    handlers: {
      inView({ distance, total }) {
        const progress = distance / total;
        if (flex) {
          timeline.seek(timeline.duration * progress);
        } else {
          timeline.seek(distance);
        }
      },
      onStateChange({ state }) {
        if (state === 'before') {
          timeline.seek(0);
        } else if (state === 'after') {
          timeline.seek(timeline.duration);
        }
      },
    },
  });
}

const waitTimeout = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
interface ICssLineAddition {
  targets: HTMLElement | HTMLElement[];
  addClassName: string;
  removeClassName: string;
  delay?: number;
  duration?: number;
  onComplete?: () => void;
}
interface ICssLineInstanceProps {
  onComplete?: () => void;
}
type ICssLineFlag = true;
export type ICssLineDirection = 'normal' | 'reverse';
export interface ICssLine {
  readonly isCssLine: ICssLineFlag;
  children: ICssLineAddition[];
  direction: ICssLineDirection;
  add: (obj: ICssLineAddition) => ICssLine;
  reverse: () => void;
  play: () => void;
  onComplete?: () => void;
}

export function cssLine({ onComplete }: ICssLineInstanceProps = {}): ICssLine {
  const line = {
    isCssLine: true as ICssLineFlag,
    children: [] as ICssLineAddition[],
    direction: 'normal' as ICssLineDirection,
    add: (item: ICssLineAddition) => {
      line.children.push(item);
      return line;
    },
    onComplete,
    reverse: () => {
      if (line.direction === 'normal') {
        line.direction = 'reverse';
      } else {
        line.direction = 'normal';
      }
    },
    play: () => {
      if (line.direction === 'normal') {
        line.children.forEach(async (i, index) => {
          let targets: HTMLElement[];
          if (Array.isArray(i.targets)) {
            targets = i.targets;
          } else {
            targets = [i.targets];
          }
          if (i.delay) {
            await waitTimeout(i.delay);
          }
          targets.forEach((j) => i.addClassName && j.classList.add(i.addClassName));
          targets.forEach((j) => i.removeClassName && j.classList.remove(i.removeClassName));
          if (i.duration) {
            await waitTimeout(i.duration);
          } else if (targets.some((target) => target.style.transition)) {
            await Promise.all(targets.map((target) => waitTransitionEnd(target, { bubble: true })));
          }
          if (index === line.children.length - 1) {
            if (line.onComplete) {
              line.onComplete();
            }
          }
        });
      } else {
        [...line.children].reverse().forEach(async (i, index) => {
          let targets: HTMLElement[];
          if (Array.isArray(i.targets)) {
            targets = i.targets;
          } else {
            targets = [i.targets];
          }
          targets.forEach((j) => i.addClassName && j.classList.remove(i.addClassName));
          targets.forEach((j) => i.removeClassName && j.classList.add(i.removeClassName));
          if (i.duration) {
            await waitTimeout(i.duration);
          } else if (targets.some((target) => target.style.transition)) {
            await Promise.all(targets.map((target) => waitTransitionEnd(target, { bubble: true })));
          }
          if (i.delay) {
            await waitTimeout(i.delay);
          }
          if (index === line.children.length - 1) {
            if (line.onComplete) {
              line.onComplete();
            }
          }
        });
      }
    },
  };

  return line;
}

type ReverseType = 'current' | 'prev' | 'none';
interface ITriggerControllerProps {
  debug?: boolean;
  position: () => number;
  reverse?: ReverseType;
  prev?: () => number;
  timeline: ILine;
  reverseTimeline?: ILine;
  onTrigger?: () => void;
  onReverse?: () => void;
}

function isCSSLine(line: ILine | ICssLine): line is ICssLine {
  return (line as ICssLine).isCssLine;
}

export function triggerController({
  position,
  reverse = 'none',
  prev,
  timeline,
  reverseTimeline,
  onTrigger,
  onReverse,
  debug,
}: ITriggerControllerProps) {
  const hasReverse = reverse === 'current' || reverse === 'prev'; // 是否有 reverse 动画
  let status = 'before';
  let hasTrigger = false; // 是否已经触发 trigger
  let direction = 'normal'; //
  if (timeline.disabledResizeCalculate) {
    timeline.disabledResizeCalculate();
  }
  if (hasReverse) {
    const handleComplete = () => {
      if (direction === 'reverse') {
        status = 'before';
      } else {
        status = 'after';
      }
      if (!reverseTimeline) {
        timeline.reverse();
      }
    };
    const handleTimeline = (tl?: ILine | ICssLine) => {
      if (!tl) return;
      if (isCSSLine(tl)) {
        tl.onComplete = handleComplete;
      } else {
        tl.finished.then(handleComplete);
      }
    };
    handleTimeline(timeline);
    handleTimeline(reverseTimeline);
  }
  if (timeline) {
    addScrollListener(document.body, {
      // reverse 的位置
      start: () => {
        return -position() + (prev ? prev() : vh(100));
      },
      // trigger 的位置
      end: ({ targetRect }) => {
        return targetRect.height - position();
      },
      handlers: {
        always({ distance, total }) {
          if (debug) {
            console.log(distance / total);
          }
        },
        onStateChange({ state }) {
          if (state === 'before') {
            // reverse
            if (hasReverse) {
              if (debug) {
                console.log('reverse');
              }
              if (status === 'inAnime' && direction === 'reverse') return;
              status = 'inAnime';
              direction = 'reverse';
              if (reverseTimeline) {
                if (!isCSSLine(reverseTimeline)) {
                  reverseTimeline.seek(0);
                }
                reverseTimeline.play();
              } else {
                if (!isCSSLine(timeline)) {
                  timeline.seek(0);
                }
                timeline.play();
              }
              if (onReverse) {
                onReverse();
              }
            }
          } else if (state === 'after') {
            // trigger
            if (reverse === 'none' && hasTrigger) return;
            if (debug) {
              console.log('trigger');
            }
            if (status === 'inAnime' && direction === 'normal') return;
            status = 'inAnime';
            direction = 'normal';
            if (!isCSSLine(timeline)) {
              timeline.seek(0);
            }
            timeline.play();
            if (onTrigger) {
              onTrigger();
            }
            if (reverse === 'none') {
              hasTrigger = true;
            }
          }
        },
      },
    });
  }
}

// 可以传函数进来实时计算的 key
const DURATION = 10000;
type TimelineDistanceType = number | string | (() => number) | { percent: DistanceAbsType };
type OptionsType = Omit<AnimeAnimParams, 'duration' | 'delay' | 'offset'> & {
  duration: TimelineDistanceType;
  delay: TimelineDistanceType;
  offset: TimelineDistanceType;
};
type ConvertedOptionsType = AnimeAnimParams & { offset: number | string };

export function timeline({
  start,
  end,
  easing,
  ...options
}: {
  start: () => number;
  end: () => number;
  easing?: EasingOptions;
  player?: AnimeTimelineInstance;
} & AnimeTimelineInstance) {
  let _player: (typeof options.player & { seekPercent?: (n: number) => void }) | undefined =
    options.player;
  const _easing = easing || 'linear';
  const _timeline = anime.timeline({
    duration: DURATION,
    delay: 0,
    easing: _easing,
    autoplay: false,
  });

  let startValue = start();
  let endValue = end();
  let progress = 0;

  const optionsArray: OptionsType[] = [];

  if (!_player) {
    _player = _timeline;
    _player.seekPercent = function (percent: number) {
      this.seek(percent * DURATION);
    };
  }

  window.addEventListener(
    'scroll',
    () => {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY <= startValue) {
          _player!.seekPercent!(0);
          progress = 0;
          return;
        }
        if (scrollY >= endValue) {
          _player!.seekPercent!(1);
          progress = 1;
          return;
        }
        progress = (scrollY - startValue) / (endValue - startValue);
        _player!.seekPercent!(progress);
      });
    },
    { passive: true },
  );

  function convertDistance(
    distance: TimelineDistanceType,
    isPercent = false,
    isRelative = false,
  ): string | number {
    function addRelative(offset: number) {
      if (!isRelative) return offset;
      if (offset < 0) {
        return `-=${Math.abs(offset)}`;
      }
      return `+=${Math.abs(offset)}`;
    }

    if (typeof distance === 'number') {
      return addRelative((distance / (isPercent ? 1 : endValue - startValue)) * DURATION);
    }

    if (typeof distance === 'string') {
      if (distance[0] === '~') {
        return (Number(distance.slice(1)) / (isPercent ? 1 : endValue - startValue)) * DURATION;
      }
      return convertDistance(Number(distance), isPercent, isRelative);
    }

    if (typeof distance === 'function') {
      return convertDistance(distance(), isPercent, isRelative);
    }

    if (typeof distance === 'object' && distance.percent) {
      return convertDistance(distance.percent, true, isRelative);
    }
    return 0;
  }

  /**
   * 将添加的 options 转化为 anime.js 的 timeline options
   * @param {anime.AnimeAnimParams & { offset?: TimelineDistanceType, duration?: TimelineDistanceType, delay?: TimelineDistanceType }} options
   */
  function calculateOptions(options: OptionsType): ConvertedOptionsType {
    const _options = _cloneDeep(options);
    if (_options.duration !== undefined) _options.duration = convertDistance(_options.duration);
    if (_options.delay !== undefined) _options.delay = convertDistance(_options.delay);
    if (_options.offset !== undefined)
      _options.offset = convertDistance(_options.offset, false, true);
    return _options as ConvertedOptionsType;
  }

  addResizeListener(() => {
    startValue = start();
    endValue = end();
    _player = anime.timeline({
      duration: DURATION,
      delay: 0,
      easing: _easing,
      autoplay: false,
    });
    _player.seekPercent = function (percent: number) {
      this.seek(percent * DURATION);
    };
    optionsArray.forEach((options) => {
      const _options = calculateOptions(options);
      _player?.add(_options, _options.offset);
    });
    _player.seekPercent(progress);
  });

  /** timeline 链式添加动画，duration, delay, offset 皆为距离
   * @param {anime.AnimeAnimParams & { offset?: TimelineDistanceType, duration?: TimelineDistanceType, delay?: TimelineDistanceType }} options
   */
  const add = (options: OptionsType) => {
    optionsArray.push(options);
    const _options = calculateOptions(options);
    _timeline.add(_options, _options.offset);
    return { add };
  };

  return {
    add,
  };
}

type TriggerOptionsType = Omit<AnimeAnimParams, 'targets'> & {
  targets: Element | Element[];
  addClassName: string;
};

export function trigger({
  position,
  reverse,
  prev,
}: {
  position: () => number;
  reverse?: 'none' | 'current' | 'prev';
  prev?: () => number;
}) {
  const _reverse = reverse || 'none';

  let positionValue = position();
  let prevValue = prev ? prev() : vh(100);
  let prevPosition = positionValue - prevValue;
  let reversePosition = _reverse === 'current' ? positionValue : prevPosition;

  const optionsArray: TriggerOptionsType[] = [];
  let status = 'before';
  let hasTrigger = false;

  const timeline = anime.timeline({
    autoplay: false,
    complete(anime) {
      if (anime.direction === 'reverse') {
        status = 'before';
      } else {
        status = 'after';
      }
      timeline.reverse();
    },
  });

  addResizeListener(() => {
    positionValue = position();
    prevValue = prev ? prev() : vh(100);
    prevPosition = positionValue - prevValue;
    reversePosition = _reverse === 'current' ? positionValue : prevPosition;
  });

  if (_reverse === 'none') {
    const listener = () => {
      const scrollY = window.scrollY;
      if (scrollY >= positionValue && !hasTrigger) {
        optionsArray.forEach((options) => {
          anime(options);
          if (options.addClassName) {
            $(options.targets).addClass(options.addClassName);
          }
        });
        hasTrigger = true;
        window.removeEventListener('scroll', listener);
      }
    };
    window.addEventListener('scroll', listener, { passive: true });
  }

  if (_reverse === 'current' || _reverse === 'prev') {
    window.addEventListener(
      'scroll',
      () => {
        const scrollY = window.scrollY;
        if (scrollY >= positionValue && status === 'before') {
          optionsArray.forEach(({ addClassName, targets }) => {
            if (addClassName && targets) {
              $(targets).addClass(addClassName);
            }
          });
          timeline.play();
          status = 'inAnime';
        }
        if (scrollY <= reversePosition && status === 'after') {
          optionsArray.forEach(({ addClassName, targets }) => {
            if (addClassName && targets) {
              $(targets).removeClass(addClassName);
            }
          });
          timeline.play();
          status = 'inAnime';
        }
      },
      { passive: true },
    );
  }

  /** timeline 链式添加动画
   * @param {anime.AnimeParams & { addClassName?: string } }} options
   * @param number offset
   */
  const add = (options: TriggerOptionsType, offset = 0) => {
    optionsArray.push(options);
    timeline.add(options, offset);
  };

  return {
    add,
  };
}

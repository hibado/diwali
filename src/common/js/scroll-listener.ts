import { ScrollListener, rectFrom } from '@zhinan-oppo/scroll-handle';
import { vw } from './measure';
import { vh } from './media/window-size';

// 使 scrollListener 中计算得到的 windowHeight 和 css 中的 vh 保持一致
ScrollListener.getViewportRect = () =>
  rectFrom({
    width: vw(100),
    height: vh(100),
  });

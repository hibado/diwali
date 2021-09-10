import anime from 'animejs';
// import throttle from 'lodash/throttle';
import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { isPortrait } from '@/common/js/media';
import { query, queryAll } from '@/common/js/dom';

export function initPicMove() {
  document.querySelectorAll('.g--pic-move').forEach(
    /** @param {HTMLElement} ele */
    (ele) => {
      const timeline = anime.timeline({ autoplay: false, easing: 'linear' });
      timeline.add(
        {
          targets: ele,
          opacity: [0, 1],
          scale: [1.1, 1],
          duration: isPortrait ? 0.25 : 0.1,
        },
        0,
      );
      const transSeek = (p) => timeline.seek(p);
      addScrollListener(ele, {
        start: 'bottom',
        end: 'top',
        forceInViewBoundary: true,
        handlers: {
          inView({ distance, total }) {
            const p = distance / total;
            transSeek(p);
          },
        },
      });
    },
  );

  document.querySelectorAll('.g--pic-scale').forEach(
    /** @param {HTMLElement} ele */
    (ele) => {
      const timeline = anime.timeline({ autoplay: false, easing: 'linear' });
      timeline.add(
        {
          targets: ele,
          scale: [1.1, 1],
          duration: isPortrait ? 0.25 : 0.1,
        },
        0,
      );
      const transSeek = (p) => timeline.seek(p);
      addScrollListener(ele, {
        start: 'bottom',
        end: 'top',
        forceInViewBoundary: true,
        handlers: {
          inView({ distance, total }) {
            const p = distance / total;
            transSeek(p);
          },
        },
      });
    },
  );

  document.querySelectorAll('.g--pic-op').forEach(
    /** @param {HTMLElement} ele */
    (ele) => {
      const timeline = anime.timeline({ autoplay: false, easing: 'linear' });
      timeline.add(
        {
          targets: ele,
          opacity: [0, 1],
          duration: 0.05,
        },
        0.05,
      );
      const transSeek = (p) => timeline.seek(p);
      addScrollListener(ele, {
        start: 'bottom',
        end: 'top',
        forceInViewBoundary: true,
        handlers: {
          inView({ distance, total }) {
            const p = distance / total;
            transSeek(p);
          },
        },
      });
    },
  );
}

export function osPic() {
  document.querySelectorAll('.pic-container-os').forEach(
    /** @param {HTMLElement} ele */
    (ele) => {
      const img = ele.querySelectorAll('img');
      const timelineInner = anime.timeline({ autoplay: false, easing: 'linear' });
      timelineInner.add(
        {
          targets: isPortrait() ? img[0] : img[1],
          translateY: isPortrait() ? ['0%', '-9%'] : ['0%', '-5%'],
          // opacity: [0, 1],
          duration: 0.5,
        },
        0,
      );
      const transSeek = (p) => timelineInner.seek(p);
      addScrollListener(ele, {
        start: 'bottom',
        end: 'top',
        forceInViewBoundary: true,
        handlers: {
          inView({ distance, total }) {
            const p = distance / total;
            transSeek(p);
          },
        },
      });
    },
  );

  document.querySelectorAll('.pic-container-os-1').forEach(
    /** @param {HTMLElement} ele */
    (ele) => {
      const img = ele.querySelectorAll('img');
      const timelineInner = anime.timeline({ autoplay: false, easing: 'linear' });
      timelineInner
        .add(
          {
            targets: img[0],
            translateY: isPortrait() ? ['9%', '0%'] : ['5%', '0%'],
            // opacity: [0, 1],
            duration: 0.5,
          },
          0,
        )
        .add(
          {
            targets: img[1],
            translateY: isPortrait() ? ['9%', '0%'] : ['5%', '0%'],
            // opacity: [0, 1],
            duration: 0.5,
          },
          0,
        );
      const transSeek = (p) => timelineInner.seek(p);
      addScrollListener(ele, {
        start: 'bottom',
        end: 'top',
        forceInViewBoundary: true,
        handlers: {
          inView({ distance, total }) {
            const p = distance / total;
            transSeek(p);
          },
        },
      });
    },
  );
}

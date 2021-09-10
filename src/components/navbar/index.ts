/* eslint-disable @typescript-eslint/no-empty-function */
import { isPortrait } from '@/common/js/media';
import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { query, queryAll } from '@/common/js/dom';

export type Theme = 'dark' | 'light';

export interface NavbarThemeController {
  lighten(): void;
  darken(): void;
  unset(): void;
}

export const ATTR_THEME = 'data-theme';
export const ATTR_THEME_DEFAULT = 'data-theme-default';
export const ATTR_DARKEN = 'data-theme-dark';
export const ATTR_LIGHTEN = 'data-theme-light';
export const ATTR_THEME_END = 'data-theme-end';

function getNavbar() {
  return window.document.getElementById('navbar');
}

export function getNavHeight() {
  return isPortrait() ? 50 : 60;
}

const themeControllers: Array<Theme | undefined> = [];
let themeRAF: number | undefined;

function setThemeControllers(
  i: number,
  theme: Theme | undefined,
  themeDefault = getNavbar()!.getAttribute(ATTR_THEME_DEFAULT) || 'light',
) {
  themeControllers[i] = theme;
  if (themeRAF) {
    window.cancelAnimationFrame(themeRAF);
  }
  themeRAF = window.requestAnimationFrame(() => {
    themeRAF = undefined;

    const navbar = getNavbar();
    const themeToTest = themeDefault === 'dark' ? 'light' : 'dark';
    navbar?.setAttribute(
      ATTR_THEME,
      themeControllers.includes(themeToTest) ? themeToTest : themeDefault,
    );
  });
}
export function createThemeController() {
  if (!getNavbar()) {
    return {
      lighten() {},
      darken() {},
      unset() {},
    };
  }
  const i = themeControllers.length;
  themeControllers.push(undefined);
  return {
    lighten: () => setThemeControllers(i, 'light'),
    darken: () => setThemeControllers(i, 'dark'),
    unset: () => setThemeControllers(i, undefined),
  };
}

function controlThemeOnScroll(element: Element, handler: (theme?: Theme) => void) {
  const darkSelected = element.hasAttribute(ATTR_DARKEN);

  const placement = {
    percent: 'top' as const,
    distance: getNavHeight(),
  };
  addScrollListener(element, {
    start: placement,
    end: element.getAttribute(ATTR_THEME_END) === 'bottom' ? 'bottom' : placement,
    handlers: {
      onStateChange({ state }) {
        handler(state === 'inView' ? (darkSelected ? 'dark' : 'light') : undefined);
      },
    },
  });
  return darkSelected ? 'dark' : 'light';
}

const controllerSelector = `[${ATTR_DARKEN}],[${ATTR_LIGHTEN}]`;

const visited = new WeakSet();
function isVisited(element: Element) {
  return visited.has(element);
}

function initThemeControllerGroup(element: Element, onThemeSet: (theme?: Theme) => void) {
  if (isVisited(element)) {
    return;
  }
  visited.add(element);

  const themeToTest = element.hasAttribute(ATTR_DARKEN) ? 'light' : 'dark';
  const themes: Array<Theme | undefined> = [undefined];
  const setTheme = (i: number, theme?: Theme) => {
    themes[i] = theme;

    onThemeSet(
      themes.includes(themeToTest) ? themeToTest : themes.find((theme) => theme !== undefined),
    );
  };
  controlThemeOnScroll(element, (theme) => setTheme(0, theme));

  queryAll(element, controllerSelector).forEach((child) => {
    if (!isVisited(child)) {
      const i = themes.length;
      themes.push(undefined);
      initThemeControllerGroup(child, (theme) => setTheme(i, theme));
    }
  });
}

export function handleThemeControllers(elements: HTMLElement[]) {
  elements.forEach((element) => {
    if (!isVisited(element)) {
      const controller = createThemeController();

      initThemeControllerGroup(element, (theme) => {
        if (theme === 'light') {
          controller.lighten();
        } else if (theme === 'dark') {
          controller.darken();
        } else {
          controller.unset();
        }
      });
    }
  });
}

export function controlNavbarThemes() {
  const root = getNavbar();
  if (!root) {
    return;
  }

  handleThemeControllers(queryAll(query('#main-wrapper')!, controllerSelector));
}

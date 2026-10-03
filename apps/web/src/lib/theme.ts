export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'twirl-theme';

/**
 * Runs in <head> before the page paints: applies the saved theme, or the system preference, as
 * data-theme on <html>, so there's no flash of the wrong theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Theme SSOT for the customer portal.
 *
 * Three modes, applied as `data-theme` on <html>; every colour token lives in
 * index.css keyed off that attribute, so this file owns the *choice* and the
 * CSS owns the *values*. Nothing here knows a single colour.
 *
 *   immersive — BG.png over dark glass. The default, and today's look exactly.
 *   dark      — the same glass on a solid background, no image.
 *   light     — solid white.
 *
 * `immersive` is the default on purpose: an existing customer who has never
 * touched the switch must see no change at all after this ships.
 *
 * Persisted under the 'theme' key, which DatabaseContext already preserves
 * across its cache clear (see keysToKeep there) — so the choice survives a
 * logout without any extra work.
 *
 * Customer portal only. AdminLayout never mounts this provider.
 */

export const THEMES = ['immersive', 'dark', 'light'];
export const DEFAULT_THEME = 'immersive';
const STORAGE_KEY = 'theme';

export const THEME_LABELS = {
  immersive: 'Immersive',
  dark: 'Solid Dark',
  light: 'Light',
};

const isValid = (value) => THEMES.includes(value);

/** Read the stored choice. Private-mode browsers throw on localStorage. */
export const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValid(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
  labels: THEME_LABELS,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);

  // The inline script in index.html has already set this before first paint;
  // re-applying keeps the attribute correct after every later change.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode — the theme still applies for this session */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (isValid(next)) setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, themes: THEMES, labels: THEME_LABELS }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

/** Thème clair / sombre, mémorisé dans le navigateur. */
export type Theme = 'dark' | 'light';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f5f1ea' : '#0d0c0b');
  try {
    localStorage.setItem('ft-theme', theme);
  } catch {
    /* stockage indisponible : thème non mémorisé */
  }
}

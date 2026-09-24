import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

/**
 * Light/dark switching for the app's own palette (theme/variables.scss).
 * Starts from the visitor's OS preference the first time they open the
 * app, then remembers whatever they explicitly pick from then on.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private storageKey = 'campuseats-theme';

  private mode = signal<ThemeMode>(this.loadInitial());

  readonly theme = this.mode.asReadonly();

  constructor() {
    this.applyToDocument(this.mode());
  }

  toggle(): void {
    this.setTheme(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.applyToDocument(mode);

    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      // Storage can be unavailable (private browsing, etc.) — the theme
      // still applies for this session, it just won't be remembered.
    }
  }

  private applyToDocument(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }

  private loadInitial(): ThemeMode {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Fall through to the system preference below.
    }

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }
}

import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export type SupportedLanguage = 'id' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly STORAGE_KEY = 'linku-lang';

  private _currentLang = signal<SupportedLanguage>('id');
  private _translations = signal<Record<string, string>>({});

  readonly currentLang = this._currentLang.asReadonly();

  // Computed signal that returns a translation function
  readonly t = computed(() => {
    const dictionary = this._translations();
    return (key: string, params?: Record<string, string>) => {
      let text = dictionary[key] || key;
      if (params && text !== key) {
        Object.keys(params).forEach(p => {
          text = text.replace(new RegExp(`{{${p}}}`, 'g'), params[p]);
        });
      }
      return text;
    };
  });

  init() {
    let savedLang: SupportedLanguage = 'id';

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage;
      if (stored === 'id' || stored === 'en') {
        savedLang = stored;
      }
    }

    return this.setLanguage(savedLang);
  }

  setLanguage(lang: SupportedLanguage): Observable<Record<string, string>> {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }

    return this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this._translations.set(translations);
        this._currentLang.set(lang);
      }),
      catchError(() => {
        // Fallback to id if fetch fails
        if (lang !== 'id') return this.setLanguage('id');
        return of({});
      })
    );
  }
}

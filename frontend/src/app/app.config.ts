import { ApplicationConfig, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/i18n/translation.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export function initializeApp(auth: AuthService, translation: TranslationService) {
  return () => forkJoin([
    auth.checkAuth(),
    translation.init()
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideClientHydration(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService, TranslationService],
      multi: true,
    },
  ],
};

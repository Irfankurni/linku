import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(AuthService);

  // Cookies are sent automatically via withCredentials — no header needed
  // But we handle 401 → refresh → retry here
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refresh().pipe(
          switchMap(() => next(req)),
          catchError(refreshErr => throwError(() => refreshErr))
        );
      }
      return throwError(() => err);
    })
  );
}

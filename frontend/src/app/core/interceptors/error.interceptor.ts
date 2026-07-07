import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const ERROR_MESSAGES: Record<number, string> = {
  0:   'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  403: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  404: 'Data yang diminta tidak ditemukan.',
  409: 'Terjadi konflik data.',
  422: 'Data yang dikirim tidak valid.',
  429: 'Terlalu banyak permintaan. Coba lagi beberapa saat.',
  500: 'Terjadi kesalahan pada server. Coba lagi nanti.',
};

export function errorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't show toast for auth check or tracking endpoints
      const silent = req.url.includes('/track') || req.url.includes('/auth/refresh');
      if (!silent) {
        const body    = err.error as any;
        const message = body?.error?.message ?? ERROR_MESSAGES[err.status] ?? 'Terjadi kesalahan.';
        if (err.status !== 401) toast.error(message);
      }
      return throwError(() => err);
    })
  );
}

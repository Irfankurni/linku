import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY, of } from 'rxjs';
import type { AuthResponse } from '../models/user.model';
import type { ApiResponse } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ── Signals ───────────────────────────────────────────────────────────────
  private _user = signal<AuthResponse | null>(null);
  private _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly username = computed(() => this._user()?.username ?? null);
  readonly plan = computed(() => this._user()?.plan ?? 'free');

  // ── Methods ───────────────────────────────────────────────────────────────

  checkAuth() {
    return this.http
      .get<ApiResponse<AuthResponse>>(`${environment.apiUrl}/users/me`, { withCredentials: true })
      .pipe(
        tap(res => { this._user.set(res.data); }),
        catchError(() => { this._user.set(null); return of(null); })
      );
  }

  register(payload: { email: string; username: string; display_name: string; password: string }) {
    this._loading.set(true);
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, payload, { withCredentials: true })
      .pipe(
        tap(res => { this._user.set(res.data); this._loading.set(false); }),
        catchError(err => { this._loading.set(false); throw err; })
      );
  }

  login(payload: { email: string; password: string }) {
    this._loading.set(true);
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, payload, { withCredentials: true })
      .pipe(
        tap(res => { this._user.set(res.data); this._loading.set(false); }),
        catchError(err => { this._loading.set(false); throw err; })
      );
  }

  logout() {
    return this.http
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => { this._user.set(null); this.router.navigate(['/login']); }),
        catchError(() => { this._user.set(null); this.router.navigate(['/login']); return EMPTY; })
      );
  }

  refresh() {
    return this.http
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(catchError((err) => { this._user.set(null); throw err; }));
  }

  checkUsername(username: string) {
    return this.http.post<ApiResponse<{ available: boolean }>>(
      `${environment.apiUrl}/auth/check-username`,
      { username },
      { withCredentials: true }
    );
  }

  setUser(user: AuthResponse | null) {
    this._user.set(user);
  }
}

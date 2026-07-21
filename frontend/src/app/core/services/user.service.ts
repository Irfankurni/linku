import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { User, PlanInfo } from '../models/user.model';
import type { ApiResponse } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  // ── Signals ───────────────────────────────────────────────────────────────
  private _profile  = signal<User | null>(null);
  private _planInfo = signal<PlanInfo | null>(null);
  private _loading  = signal(false);

  readonly profile  = this._profile.asReadonly();
  readonly planInfo = this._planInfo.asReadonly();
  readonly loading  = this._loading.asReadonly();

  // ── Methods ───────────────────────────────────────────────────────────────

  loadProfile() {
    this._loading.set(true);
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/users/me`, { withCredentials: true })
      .pipe(
        tap(res => { this._profile.set(res.data); this._loading.set(false); })
      );
  }

  loadPlanInfo() {
    return this.http
      .get<ApiResponse<PlanInfo>>(`${environment.apiUrl}/users/me/plan`, { withCredentials: true })
      .pipe(tap(res => this._planInfo.set(res.data)));
  }

  updateProfile(payload: Partial<Pick<User, 'display_name' | 'bio' | 'avatar_url' | 'theme' | 'settings'>>) {
    return this.http
      .patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, payload, { withCredentials: true })
      .pipe(tap(res => this._profile.set(res.data)));
  }

  deleteAccount() {
    return this.http.delete<ApiResponse<unknown>>(
      `${environment.apiUrl}/users/me`,
      { withCredentials: true }
    );
  }

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(
      `${environment.apiUrl}/upload`,
      formData,
      { withCredentials: true }
    );
  }

  clear() {
    this._profile.set(null);
    this._planInfo.set(null);
  }
}

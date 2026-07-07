import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { Link, CreateLinkDto, UpdateLinkDto } from '../models/link.model';
import type { ApiResponse } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LinkService {
  private readonly http = inject(HttpClient);

  private _links   = signal<Link[]>([]);
  private _loading = signal(false);

  readonly links   = this._links.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadLinks() {
    this._loading.set(true);
    return this.http
      .get<ApiResponse<Link[]>>(`${environment.apiUrl}/links`, { withCredentials: true })
      .pipe(tap(res => { this._links.set(res.data); this._loading.set(false); }));
  }

  createLink(dto: CreateLinkDto) {
    return this.http
      .post<ApiResponse<Link>>(`${environment.apiUrl}/links`, dto, { withCredentials: true })
      .pipe(tap(res => this._links.update(links => [...links, res.data])));
  }

  updateLink(id: string, dto: UpdateLinkDto) {
    return this.http
      .patch<ApiResponse<Link>>(`${environment.apiUrl}/links/${id}`, dto, { withCredentials: true })
      .pipe(tap(res => this._links.update(links => links.map(l => l.id === id ? res.data : l))));
  }

  deleteLink(id: string) {
    return this.http
      .delete<ApiResponse<unknown>>(`${environment.apiUrl}/links/${id}`, { withCredentials: true })
      .pipe(tap(() => this._links.update(links => links.filter(l => l.id !== id))));
  }

  reorder(orderedIds: string[]) {
    // Optimistic update
    this._links.update(links => {
      const map = new Map(links.map(l => [l.id, l]));
      return orderedIds.map((id, i) => ({ ...map.get(id)!, position: i }));
    });
    return this.http.post<ApiResponse<unknown>>(
      `${environment.apiUrl}/links/reorder`,
      { ordered_ids: orderedIds },
      { withCredentials: true }
    );
  }

  toggleActive(id: string) {
    return this.http
      .patch<ApiResponse<{ is_active: boolean }>>(`${environment.apiUrl}/links/${id}/toggle`, {}, { withCredentials: true })
      .pipe(tap(res => this._links.update(links => links.map(l => l.id === id ? { ...l, is_active: res.data.is_active } : l))));
  }
}

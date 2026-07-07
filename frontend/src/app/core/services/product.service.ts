import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';
import type { ApiResponse } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private _products = signal<Product[]>([]);
  private _loading  = signal(false);

  readonly products = this._products.asReadonly();
  readonly loading  = this._loading.asReadonly();

  loadProducts() {
    this._loading.set(true);
    return this.http
      .get<ApiResponse<Product[]>>(`${environment.apiUrl}/products`, { withCredentials: true })
      .pipe(tap(res => { this._products.set(res.data); this._loading.set(false); }));
  }

  createProduct(dto: CreateProductDto) {
    return this.http
      .post<ApiResponse<Product>>(`${environment.apiUrl}/products`, dto, { withCredentials: true })
      .pipe(tap(res => this._products.update(p => [...p, res.data])));
  }

  updateProduct(id: string, dto: UpdateProductDto) {
    return this.http
      .patch<ApiResponse<Product>>(`${environment.apiUrl}/products/${id}`, dto, { withCredentials: true })
      .pipe(tap(res => this._products.update(p => p.map(x => x.id === id ? res.data : x))));
  }

  deleteProduct(id: string) {
    return this.http
      .delete<ApiResponse<unknown>>(`${environment.apiUrl}/products/${id}`, { withCredentials: true })
      .pipe(tap(() => this._products.update(p => p.filter(x => x.id !== id))));
  }

  reorder(orderedIds: string[]) {
    this._products.update(products => {
      const map = new Map(products.map(p => [p.id, p]));
      return orderedIds.map((id, i) => ({ ...map.get(id)!, position: i }));
    });
    return this.http.post<ApiResponse<unknown>>(
      `${environment.apiUrl}/products/reorder`,
      { ordered_ids: orderedIds },
      { withCredentials: true }
    );
  }

  toggleActive(id: string) {
    return this.http
      .patch<ApiResponse<{ is_active: boolean }>>(`${environment.apiUrl}/products/${id}/toggle`, {}, { withCredentials: true })
      .pipe(tap(res => this._products.update(p => p.map(x => x.id === id ? { ...x, is_active: res.data.is_active } : x))));
  }

  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ id: string; url: string; variants: string[] }>>(
      `${environment.apiUrl}/products/upload-image`,
      form,
      { withCredentials: true }
    );
  }
}

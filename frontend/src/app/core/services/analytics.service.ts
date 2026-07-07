import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type {
  AnalyticsSummaryResponse,
  LinkAnalytics,
  ProductAnalytics,
  GeoAnalytics,
  DeviceAnalytics,
} from '../models/analytics.model';
import type { ApiResponse } from '../models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  getSummary(days = 7) {
    return this.http.get<ApiResponse<AnalyticsSummaryResponse>>(
      `${environment.apiUrl}/analytics/summary?days=${days}`,
      { withCredentials: true }
    );
  }

  getLinkAnalytics(days = 7) {
    return this.http.get<ApiResponse<LinkAnalytics[]>>(
      `${environment.apiUrl}/analytics/links?days=${days}`,
      { withCredentials: true }
    );
  }

  getProductAnalytics(days = 7) {
    return this.http.get<ApiResponse<ProductAnalytics[]>>(
      `${environment.apiUrl}/analytics/products?days=${days}`,
      { withCredentials: true }
    );
  }

  getGeoAnalytics(days = 7) {
    return this.http.get<ApiResponse<GeoAnalytics[]>>(
      `${environment.apiUrl}/analytics/geo?days=${days}`,
      { withCredentials: true }
    );
  }

  getDeviceAnalytics(days = 7) {
    return this.http.get<ApiResponse<DeviceAnalytics[]>>(
      `${environment.apiUrl}/analytics/devices?days=${days}`,
      { withCredentials: true }
    );
  }

  /** Fire-and-forget tracking call */
  track(username: string, payload: {
    entity_type: 'page' | 'link' | 'product';
    entity_id?:  string;
    event:       'view' | 'click' | 'buy_click';
    referrer?:   string;
  }) {
    this.http.post(
      `${environment.apiBaseUrl}/p/${username}/track`,
      payload
    ).subscribe({ error: () => {} }); // Silent fail
  }
}

export interface AnalyticsSummary {
  views:      number;
  clicks:     number;
  buy_clicks: number;
}

export interface AnalyticsSummaryResponse {
  summary:       AnalyticsSummary;
  days:          number;
  plan_max_days: number;
}

export interface LinkAnalytics {
  entity_id:   string;
  title:       string;
  url:         string;
  click_count: number;
}

export interface ProductAnalytics {
  entity_id:       string;
  title:           string;
  slug:            string;
  view_count:      number;
  buy_click_count: number;
}

export interface GeoAnalytics {
  country: string;
  count:   number;
}

export interface DeviceAnalytics {
  device: 'mobile' | 'desktop' | 'tablet';
  count:  number;
}

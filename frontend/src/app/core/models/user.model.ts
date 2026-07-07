// User model
export interface User {
  id:             string;
  email:          string;
  username:       string;
  display_name:   string;
  avatar_url:     string | null;
  bio:            string | null;
  plan:           Plan;
  plan_expires_at: number | null;
  theme:          string;
  settings:       UserSettings;
  is_active:      boolean;
  created_at:     number;
  updated_at:     number;
}

export type Plan = 'free' | 'pro' | 'business';

export interface UserSettings {
  custom_css?:  string;
  font?:        string;
  seo_title?:   string;
  seo_desc?:    string;
  [key: string]: unknown;
}

export interface PlanLimits {
  links:            number;
  products:         number;
  analytics_days:   number;
  custom_domain:    boolean;
  geo_analytics:    boolean;
  device_analytics: boolean;
}

export interface PlanInfo {
  plan:   Plan;
  limits: PlanLimits;
}

export interface AuthResponse {
  id:           string;
  email:        string;
  username:     string;
  display_name: string;
  plan:         Plan;
}

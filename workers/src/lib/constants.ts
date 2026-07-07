import type { Plan } from '../env.d';

// Plan limits configuration
export const PLAN_LIMITS: Record<Plan, {
  links: number;
  products: number;
  analytics_days: number;
  custom_domain: boolean;
  geo_analytics: boolean;
  device_analytics: boolean;
}> = {
  free: {
    links: 10,
    products: 5,
    analytics_days: 7,
    custom_domain: false,
    geo_analytics: false,
    device_analytics: false,
  },
  pro: {
    links: 100,
    products: 100,
    analytics_days: 90,
    custom_domain: true,
    geo_analytics: true,
    device_analytics: true,
  },
  business: {
    links: -1,     // unlimited
    products: -1,  // unlimited
    analytics_days: 365,
    custom_domain: true,
    geo_analytics: true,
    device_analytics: true,
  },
};

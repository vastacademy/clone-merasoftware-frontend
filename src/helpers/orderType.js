export const PROJECT_CATEGORIES = new Set([
  'standard_websites',
  'dynamic_websites',
  'cloud_software_development',
  'app_development',
  'web_applications',
  'mobile_apps',
]);

export const PLAN_CATEGORIES = new Set(['website_updates', 'service_plan']);

export const isProjectItem = (order) =>
  PROJECT_CATEGORIES.has(order?.productId?.category?.toLowerCase());

export const isPlanItem = (order) =>
  PLAN_CATEGORIES.has(order?.productId?.category?.toLowerCase());

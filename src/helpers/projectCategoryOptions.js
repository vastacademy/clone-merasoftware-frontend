// The four project categories a custom project can actually be created for.
//
// SSOT for the admin-side project/feature forms. These values must stay byte-aligned
// with the backend, where the same four are enforced in:
//   - models/categoryBasePriceModel.js  (category enum)
//   - controller/order/adminCreateProjectOrder.js  (PROJECT_CATEGORIES / CATEGORY_LABELS)
//   - controller/order/customerCreateCustomProjectOrder.js  (PROJECT_CATEGORIES)
//
// Deliberately NOT helpers/compatibleWithOptions.js: that older list still carries
// "web_applications" / "mobile_apps", which no live project category uses, so a
// feature tagged from it can never match a real project.
const projectCategoryOptions = [
  { value: "standard_websites", label: "Standard Website" },
  { value: "dynamic_websites", label: "Dynamic Website" },
  { value: "cloud_software_development", label: "Cloud Software" },
  { value: "app_development", label: "App Development" },
];

export const projectCategoryLabel = (value) =>
  projectCategoryOptions.find((option) => option.value === value)?.label || value;

// A feature's compatibleWith[] carries which categories it is offered for, where an
// EMPTY array means "all categories". Kept here so every list/filter reads it the
// same way instead of each caller re-deciding what empty means.
export const isFeatureForCategory = (feature, category) => {
  const compatible = feature?.compatibleWith;
  if (!Array.isArray(compatible) || compatible.length === 0) return true;
  return compatible.includes(category);
};

export default projectCategoryOptions;

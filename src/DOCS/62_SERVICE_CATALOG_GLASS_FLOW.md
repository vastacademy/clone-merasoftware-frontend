# Service Catalog Glass Flow

**Session date**: 2026-08-18

- Updated `StartNewProject.js`, the active catalog behind `/start-new-project/services?tab=plans`, from a solid white table surface to the established portal dark-glass pattern.
- Kept the shared `CustomerWorkspaceTabs` component as the single tab implementation and selected its existing `inline` dark-surface variant for this page.
- Updated `ServicePlanDetail.js` across all states: plan-not-found, service description, validity, price, payment confirmation, UPI QR/reference entry, and purchase success.
- Reused `BG.png`, `bg-white/10`, `border-white/20`, `backdrop-blur-2xl`, and emerald action pills already established across the customer portal.
- `AddServiceModal.js` was verified as already using the same dark-glass treatment, so it was not duplicated or restyled unnecessarily.
- No backend, payment logic, route contract, or data behavior was changed.

// Frontend mirror of backend/helpers/serviceDependencyRules.js — the admin's own
// `dependency` setting, applied to what a customer is shown.
//
// The backend is the authority: it refuses a purchase made on the wrong surface.
// This file exists so the customer is never offered something that refusal would
// reject, and so the reason can be explained before they try. Both files decide
// the same way; if one changes, the other must change with it.
//
// Timing (`during` / `during_and_after` / `after`) is not part of this decision.
// Every project-compatible service can be bought while a project is running —
// `after` only changes when it starts working. That is shown as a note, not a
// restriction.

export const SURFACE = {
  PROJECT: 'project',
  STANDALONE: 'standalone',
};

export const DEPENDENCY = {
  PROJECT_REQUIRED: 'project_required',
  STANDALONE_OR_PROJECT: 'standalone_or_project',
  STANDALONE_ONLY: 'standalone_only',
};

const ALLOWED_SURFACES = {
  [DEPENDENCY.PROJECT_REQUIRED]: [SURFACE.PROJECT],
  [DEPENDENCY.STANDALONE_OR_PROJECT]: [SURFACE.PROJECT, SURFACE.STANDALONE],
  [DEPENDENCY.STANDALONE_ONLY]: [SURFACE.STANDALONE],
};

const BLOCKED_REASON = {
  [DEPENDENCY.STANDALONE_ONLY]:
    'This service runs on its own and cannot be attached to a project. It is bought separately.',
  [DEPENDENCY.PROJECT_REQUIRED]:
    'This service works only alongside a project. Open the project you want it added to.',
};

// Same contract as the backend: allowed, plus why not when refused. A service
// with no dependency set predates the field being mandatory and is allowed
// everywhere — never hidden on a restriction the admin did not set.
export const evaluateServiceSurface = (plan, surface) => {
  const dependency = plan?.servicePlan?.dependency || null;

  if (!dependency) return { allowed: true, dependency: null, reason: null };

  const allowedSurfaces = ALLOWED_SURFACES[dependency];
  if (!allowedSurfaces) {
    return {
      allowed: false,
      dependency,
      reason: 'This service is not configured correctly. Please contact support.',
    };
  }

  if (allowedSurfaces.includes(surface)) return { allowed: true, dependency, reason: null };

  return { allowed: false, dependency, reason: BLOCKED_REASON[dependency] || 'This service cannot be bought here.' };
};

export const canBuyOnSurface = (plan, surface) => evaluateServiceSurface(plan, surface).allowed;

// A standalone-only service stays visible inside a project rather than being
// filtered away: the customer is told it is bought separately and sent to the
// page that sells it, so the sale is redirected, not lost. Anything else that
// cannot be bought on this surface is simply not listed.
export const isRedirectableFromProject = (plan) =>
  plan?.servicePlan?.dependency === DEPENDENCY.STANDALONE_ONLY;

// `after` services are fully purchasable alongside a running project — they just
// begin when the project completes. Surfaced as a note so the customer knows
// what they are buying.
export const startsAfterProjectCompletion = (plan) => plan?.servicePlan?.timing === 'after';

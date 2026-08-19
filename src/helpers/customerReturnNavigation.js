// Customer portal return-navigation SSOT.
//
// A browser-history step is not a reliable definition of "Back": it can point
// outside the portal, to a redirected entry route, or to an unrelated screen.
// Child pages therefore receive an explicit, validated return target. A direct
// URL or refresh has no such target and uses the page's documented fallback.

const CUSTOMER_RETURN_STATE_KEY = 'customerReturnTo';

const isInternalCustomerPath = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return false;
  }

  const pathname = value.split(/[?#]/, 1)[0];

  return [
    '/dashboard',
    '/projects-and-plans',
    '/start-new-project',
    '/order',
    '/order-detail/',
    '/project-details/',
    '/plan-details/',
    '/service-plan-detail/',
    '/wallet',
    '/my-updates',
    '/my-invoices',
    '/documents',
    '/support',
    '/profile',
    '/complete-profile',
    '/games',
  ].some((prefix) => pathname === prefix || pathname.startsWith(prefix));
};

export const getCustomerPath = (location) => {
  const path = `${location?.pathname || ''}${location?.search || ''}${location?.hash || ''}`;
  return isInternalCustomerPath(path) ? path : null;
};

export const customerReturnState = (returnTo) => (
  isInternalCustomerPath(returnTo)
    ? { [CUSTOMER_RETURN_STATE_KEY]: returnTo }
    : undefined
);

export const getCustomerReturnTarget = (location, fallback) => {
  const explicitTarget = location?.state?.[CUSTOMER_RETURN_STATE_KEY];
  return isInternalCustomerPath(explicitTarget) ? explicitTarget : fallback;
};

export const goToCustomerReturn = (navigate, location, fallback, options) => {
  navigate(getCustomerReturnTarget(location, fallback), options);
};

export default {
  customerReturnState,
  getCustomerPath,
  getCustomerReturnTarget,
  goToCustomerReturn,
};

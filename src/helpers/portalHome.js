// Single source of truth for where each role's portal "home" lives.
// The public site (/home) is no longer an entry point — the app is portal-only,
// so every post-login / root landing resolves through here.
export const getPortalHome = (role) => {
  if (role === "admin") {
    return "/admin-panel/dashboard";
  }
  // customer (and any other logged-in role) lands on the customer dashboard.
  return "/dashboard";
};

export default getPortalHome;

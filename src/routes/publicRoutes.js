import Login from "../pages/Login";
import RoleBasedHome from "../components/RoleBasedHome";

// The public marketing site has been removed — the app is portal-only.
// Only the entry routes survive here: the root landing (redirects to the
// correct portal or /login) and the login screen itself. Everything else is
// served by customerRoutes / adminRoutes.
export const publicRoutes = [
  {
    path: "",
    element: <RoleBasedHome />
  },
  {
    path: "login",
    element: <Login/>
  },
  {
    path: "unauthorized",
    element: <div className="flex items-center justify-center min-h-screen text-2xl font-bold">Unauthorized Access</div>
  }
];

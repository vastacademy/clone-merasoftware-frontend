import { useSelector } from "react-redux";
import { publicRoutes } from "./publicRoutes";
import { customerRoutes } from "./customerRoutes";
import { adminRoutes } from "./adminRoutes";

export const useRoleBasedRoutes = () => {
  const user = useSelector(state => state?.user?.user);
  const initialized = useSelector(state => state?.user?.initialized);

  // Public routes always available
  let routes = [...publicRoutes];

  // Add role-specific routes based on user role
  if (initialized && user?._id) {
    if (user.role === 'admin') {
      routes = [...routes, ...adminRoutes];
    } else if (user.role === 'customer') {
      routes = [...routes, ...customerRoutes];
    }
  } else {
    // No user logged in - only public routes
    routes = [...publicRoutes];
  }

  return routes;
};

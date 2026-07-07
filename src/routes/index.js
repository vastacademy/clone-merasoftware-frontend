import { createBrowserRouter } from "react-router-dom";
import App from "../App"
import { publicRoutes } from "./publicRoutes";
import { customerRoutes } from "./customerRoutes";
import { adminRoutes } from "./adminRoutes";
import { Provider } from "react-redux";
import store from "../store/store";

// Create a router factory that takes routes as parameter
const createAppRouter = (routes) => {
  return createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: routes
    }
  ]);
};

// Export factory function and base routes
export const createRoleBasedRouter = (user, initialized) => {
  let routes = [...publicRoutes];

  if (initialized && user?._id) {
    if (user.role === 'admin') {
      routes = [...routes, ...adminRoutes];
    } else if (user.role === 'customer') {
      routes = [...routes, ...customerRoutes];
    }
  }

  return createAppRouter(routes);
};

// Default router with only public routes (for initial load)
const defaultRouter = createAppRouter(publicRoutes);

export default defaultRouter;

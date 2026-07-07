import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboardDummy from "../pages/AdminDashboardDummy";

export const adminRoutes = [
  {
    path: "admin-panel/dashboard",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminDashboardDummy/>
      </ProtectedRoute>
    )
  }
];

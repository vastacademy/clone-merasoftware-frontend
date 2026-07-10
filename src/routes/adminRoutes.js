import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminClientsPage from "../pages/AdminClientsPage";
import AdminClientWorkspace from "../pages/AdminClientWorkspace";
import ProjectDetails from "../pages/ProjectDetails";

export const adminRoutes = [
  {
    path: "admin-panel/dashboard",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminDashboard/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/clients",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminClientsPage/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/clients/:customerId",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminClientWorkspace/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/project-details/:orderId",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <ProjectDetails isAdminView={true}/>
      </ProtectedRoute>
    )
  }
];

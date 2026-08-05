import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminClientsPage from "../pages/AdminClientsPage";
import AdminClientWorkspace from "../pages/AdminClientWorkspace";
import AdminPaymentRecordDetail from "../pages/AdminPaymentRecordDetail";
import ProjectDetails from "../pages/ProjectDetails";
import AdminProjectProductsPage from "../pages/AdminProjectProductsPage";
import AdminCreateProjectPage from "../pages/AdminCreateProjectPage";
import AdminPlanProductsPage from "../pages/AdminPlanProductsPage";
import AdminCreatePlanPage from "../pages/AdminCreatePlanPage";
import AdminCategoryBasePricePage from "../pages/AdminCategoryBasePricePage";
import AdminFeatureProductsPage from "../pages/AdminFeatureProductsPage";

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
    path: "admin-panel/clients/:customerId/payments/:recordType/:recordId",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminPaymentRecordDetail/>
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
    path: "admin-panel/website-management/projects/add",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminCreateProjectPage />
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/website-management/projects",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminProjectProductsPage/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/website-management/plans/add",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminCreatePlanPage />
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/website-management/plans",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminPlanProductsPage/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/project-setup/base-price",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminCategoryBasePricePage/>
      </ProtectedRoute>
    )
  },
  {
    path: "admin-panel/project-setup/features",
    element: (
      <ProtectedRoute requireRole={['admin']}>
        <AdminFeatureProductsPage/>
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

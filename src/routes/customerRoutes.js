import ProtectedRoute from "../components/ProtectedRoute";
import CustomerDashboard from "../pages/CustomerDashboard";
import Cart from "../pages/Cart";
import OrderPage from "../pages/OrderPage";
import OrderDetailPage from "../pages/OrderDetailPage";
import ProjectDetails from "../pages/ProjectDetails";
import WalletDetails from "../pages/WalletDetails";
import UserUpdateDashboard from "../pages/UserUpdateDashboard";
import UserInvoices from "../pages/UserInvoices";
import DirectPayment from "../pages/DirectPayment";
import ContactSupport from "../pages/ContactSupport";
import InstallmentPayment from "../pages/InstallmentPayment";
import Profile from "../pages/Profile";
import TicketDetail from "../pages/TicketDetail";
import CompleteProfile from "../pages/CompleteProfile";
import ProjectsAndPlans from "../pages/ProjectsAndPlans";

const CustomerProtectedRoute = ({ children }) => (
  <ProtectedRoute requireRole={['customer']}>
    {children}
  </ProtectedRoute>
);

export const customerRoutes = [
  {
    path: "dashboard",
    element: (
      <CustomerProtectedRoute>
        <CustomerDashboard/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "projects-and-plans",
    element: (
      <CustomerProtectedRoute>
        <ProjectsAndPlans/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "cart",
    element: (
      <CustomerProtectedRoute>
        <Cart/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "order",
    element: (
      <CustomerProtectedRoute>
        <OrderPage/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "order-detail/:orderId",
    element: (
      <CustomerProtectedRoute>
        <OrderDetailPage/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "project-details/:orderId",
    element: (
      <CustomerProtectedRoute>
        <ProjectDetails/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "wallet",
    element: (
      <CustomerProtectedRoute>
        <WalletDetails/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "my-updates",
    element: (
      <CustomerProtectedRoute>
        <UserUpdateDashboard/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "my-invoices",
    element: (
      <CustomerProtectedRoute>
        <UserInvoices/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "direct-payment",
    element: (
      <CustomerProtectedRoute>
        <DirectPayment/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "support",
    element: (
      <CustomerProtectedRoute>
        <ContactSupport/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "installment-payment/:orderId/:installmentNumber",
    element: (
      <CustomerProtectedRoute>
        <InstallmentPayment/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "profile",
    element: (
      <CustomerProtectedRoute>
        <Profile/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "support-tickets/:ticketId",
    element: (
      <CustomerProtectedRoute>
        <TicketDetail/>
      </CustomerProtectedRoute>
    )
  },
  {
    path: "complete-profile",
    element: (
      <CustomerProtectedRoute>
        <CompleteProfile/>
      </CustomerProtectedRoute>
    )
  }
];

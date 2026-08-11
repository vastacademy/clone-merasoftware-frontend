import Home from "../pages/Home";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import CategoryProduct from "../pages/CategoryProduct";
import ProductDetails from "../pages/ProductDetails";
import SearchProduct from "../pages/SearchProduct";
import Cancel from "../pages/Cancel";
import Success from "../pages/Success";
import TermsAndConditionsPage from "../pages/TermsAndConditionsPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import CookiesPolicyPage from "../pages/CookiesPolicyPage";
import DeliveryPolicyPage from "../pages/DeliveryPolicyPage";
import RefundPolicyPage from "../pages/RefundPolicyPage";
import DisclaimersPage from "../pages/DisclaimersPage";
import ContactUsForm from "../pages/ContactUsForm";
import RoleBasedHome from "../components/RoleBasedHome";
import ServiceCard from "../pages/ServiceCard";
import UserDemo from "../pages/UserDemo";
import Practice from "../pages/Practice";

export const publicRoutes = [
  {
    path: "",
    element: <RoleBasedHome />
  },
  {
    path: "home",
    element: <Home />
  },
  {
    path: "login",
    element: <Login/>
  },
  {
    path: "unauthorized",
    element: <div className="flex items-center justify-center min-h-screen text-2xl font-bold">Unauthorized Access</div>
  },
  {
    path: "forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "product-category/",
    element: <CategoryProduct/>
  },
  {
    path: "product/:id",
    element: <ProductDetails/>
  },
  {
    path: "cancel",
    element: <Cancel/>
  },
  {
    path: "success",
    element: <Success/>
  },
  {
    path: "search",
    element: <SearchProduct/>
  },
  {
    path: "terms-and-conditions",
    element: <TermsAndConditionsPage/>
  },
  {
    path: "privacy-policy",
    element: <PrivacyPolicyPage/>
  },
  {
    path: "cookies-policy",
    element: <CookiesPolicyPage/>
  },
  {
    path: "delivery-policy",
    element: <DeliveryPolicyPage/>
  },
  {
    path: "refund-policy",
    element: <RefundPolicyPage/>
  },
  {
    path: "disclaimers",
    element: <DisclaimersPage/>
  },
  {
    path: "contact-us",
    element: <ContactUsForm/>
  },
  {
    path: "/service-card",
    element: <ServiceCard/>
  },
  {
    path: "demo",
    element: <UserDemo/>
  },
  {
    path: "practice",
    element: <Practice/>
  }
];

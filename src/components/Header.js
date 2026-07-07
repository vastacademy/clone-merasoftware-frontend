import React from "react";
import { useSelector } from "react-redux";
import CustomerHeader from "./CustomerHeader";
import AdminHeader from "./AdminHeader";

const Header = () => {
  const user = useSelector((state) => state?.user?.user);

  // Role-based header rendering
  if (user?.role === 'admin') {
    return <AdminHeader />;
  }

  return <CustomerHeader />;
};

export default Header;

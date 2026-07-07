import React, { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createRoleBasedRouter } from './index';

const DynamicRouterWrapper = () => {
  const user = useSelector(state => state?.user?.user);
  const initialized = useSelector(state => state?.user?.initialized);

  // Recreate router when user role changes
  // Dependencies: user._id and user.role to detect role changes
  const router = useMemo(() =>
    createRoleBasedRouter(user, initialized),
    [user?._id, user?.role, initialized]
  );

  return <RouterProvider router={router} />;
};

export default DynamicRouterWrapper;

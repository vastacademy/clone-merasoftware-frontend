import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createRoleBasedRouter } from './index';

export const useDynamicRouter = () => {
  const user = useSelector(state => state?.user?.user);
  const initialized = useSelector(state => state?.user?.initialized);

  const router = useMemo(() => {
    return createRoleBasedRouter(user, initialized);
  }, [user, initialized]);

  return router;
};

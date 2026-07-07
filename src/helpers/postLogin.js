import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { setUserDetails, updateWalletBalance } from "../store/userSlice";

const postLogin = ({
  dataApi,
  dispatch,
  navigate,
  toast,
  fetchUserDetails,
  fetchUserAddToCart,
}) => {
  const user = dataApi?.data?.user;
  if (!user) {
    return;
  }

  const isDetailsCompleted = dataApi?.data?.isDetailsCompleted || false;
  const userSnapshot = {
    ...user,
    isDetailsCompleted,
  };

  CookieManager.setUserDetails({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isDetailsCompleted,
  });

  dispatch(setUserDetails(userSnapshot));
  StorageService.setUserDetails(userSnapshot);

  if (dataApi.data.walletBalance !== undefined) {
    dispatch(updateWalletBalance(dataApi.data.walletBalance));
  }

  toast.success(dataApi.message);
  navigate("/home", { replace: true });

  if (fetchUserDetails) {
    void fetchUserDetails();
  }

  if (fetchUserAddToCart) {
    void fetchUserAddToCart();
  }
};

export default postLogin;

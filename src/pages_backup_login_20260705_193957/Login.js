import React, { useContext, useState } from "react";
import loginIcons from "../assest/signin.gif";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SummaryApi from "../common";
import Context from "../context";
import CookieManager from "../utils/cookieManager";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { fetchUserDetails, fetchUserAddToCart } = useContext(Context);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = SummaryApi.signIn;
    const payload = { email: data.email, password: data.password };

    try {
      const dataResponse = await fetch(endpoint.url, {
        method: endpoint.method,
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const dataApi = await dataResponse.json();

      if (!dataApi.success) {
        toast.error(dataApi.message || "Login failed");
        return;
      }

      const role = dataApi?.data?.user?.role;

      CookieManager.setUserDetails({
        _id: dataApi.data.user._id,
        name: dataApi.data.user.name,
        email: dataApi.data.user.email,
        role: dataApi.data.user.role,
        isDetailsCompleted: dataApi.data.isDetailsCompleted || false,
      });

      await fetchUserDetails();

      const userRole = dataApi?.data?.user?.role;

      // Role-based redirect
      if (userRole === 'admin') {
        toast.success(dataApi.message);
        // Admin redirect to home
        navigate("/home");
      } else {
        // Customer flow
        await fetchUserAddToCart();
        toast.success(dataApi.message);
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="login">
      <div className="max-auto container p-4">
        <div className="bg-white p-5 w-full max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto">
            <img src={loginIcons} alt="login icon" />
          </div>

          <h2 className="text-center text-lg font-semibold mt-3">
            Login
          </h2>

          <form className="pt-6 flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="grid">
              <label>Email: </label>
              <div className="bg-slate-200 p-2">
                <input
                  type="email"
                  placeholder="enter email"
                  name="email"
                  value={data.email}
                  onChange={handleOnChange}
                  className="w-full h-full outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label>Password: </label>
              <div className="bg-slate-200 p-2 flex">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="enter password"
                  value={data.password}
                  onChange={handleOnChange}
                  className="w-full h-full outline-none bg-transparent"
                />
                <div
                  className="cursor-pointer text-xl"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <span>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                </div>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 w-full max-w-[180px] rounded-full hover:scale-110 transition-all mx-auto block mt-6 disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;

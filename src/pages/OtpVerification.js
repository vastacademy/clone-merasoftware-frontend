import React, { useState, useEffect, useContext } from 'react';
import { toast } from "sonner";
import SummaryApi from "../common";
import CookieManager from '../utils/cookieManager';
import { useNavigate } from 'react-router-dom';
import loginIcons from "../assest/signin.gif";
import { useDispatch, useSelector } from 'react-redux';
import { setUserDetails, updateWalletBalance } from '../store/userSlice';
import Context from '../context';

const OtpVerification = ({ userData, onBackToLogin }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerKey, setTimerKey] = useState(0); // Added state to restart timer
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const storeUser = useSelector(state => state.user.user);
  const context = useContext(Context);

  useEffect(() => {
    setTimeLeft(120); // Reset timer on timerKey change
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerKey]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleInputChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!/^\d*$/.test(pastedData)) return;
    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
    for (let i = digits.length; i < 6; i++) {
      const nextInput = document.getElementById(`otp-input-${i}`);
      if (nextInput) {
        nextInput.focus();
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.verifyOtp.url, {
        method: SummaryApi.verifyOtp.method,
        credentials: "include",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          userId: userData.userId,
          otp: otpValue,
          role: userData.role
        })
      });
      const data = await response.json();
        if (data.success) {
          CookieManager.setUserDetails({
            _id: data.data.user._id,
            name: data.data.user.name,
            email: data.data.user.email,
            role: data.data.user.role,
             // ✅ Use backend isDetailsCompleted value
          isDetailsCompleted: data.data.isDetailsCompleted || false
          });
          dispatch(setUserDetails(data.data.user));
          if (data.data.walletBalance) {
            dispatch(updateWalletBalance(data.data.walletBalance));
          }
          toast.success(data.message);

          if (context.fetchUserDetails) {
            void context.fetchUserDetails();
          }
          if (context.fetchUserAddToCart) {
            void context.fetchUserAddToCart();
          }

          navigate("/home", { replace: true });
        } else {
          toast.error(data.message);
        }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.resendOtp.url, {
        method: SummaryApi.resendOtp.method,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ userId: userData.userId })
      });
      const data = await response.json();
      if (data.success) {
        setTimerKey(prev => prev + 1); // Trigger timer restart
        toast.success("New OTP sent to your email");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="otp-verification">
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 w-96 rounded-xl shadow-md">
          <div className="w-20 h-20 mx-auto">
            <img src={loginIcons} alt="Verification icon" />
          </div>
          <h2 className="text-xl font-bold text-center mt-4">Email Verification</h2>
          <p className="text-center text-gray-600 mt-2 text-sm">
            We've sent a verification code to
          </p>
          <p className="text-center font-medium text-sm text-gray-800">
            {userData.email}
          </p>

          <form className="mt-6" onSubmit={handleSubmit}>
            <div className="flex justify-center space-x-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-10 h-12 text-center text-xl font-bold border border-gray-300 rounded-md bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              ))}
            </div>

            {timeLeft > 0 && (
              <p className="text-center text-sm text-gray-600 mb-3">
                Time remaining: <span className="font-medium text-black">{formatTime(timeLeft)}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 w-full max-w-[200px] rounded-full hover:scale-105 transition-all mx-auto block disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
          </form>

          <div className="mt-5 text-center">
            {timeLeft === 0 && (
              <>
                <p className="text-sm text-red-600 mb-1">
                  Please check your <span className="font-medium">Spam folder</span> before resending.
                </p>
                <p
                  onClick={handleResendOtp}
                  className="text-gray-800 text-sm font-semibold cursor-pointer hover:underline"
                >
                  Resend OTP
                </p>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className="text-gray-600 hover:text-gray-800 hover:underline text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OtpVerification;

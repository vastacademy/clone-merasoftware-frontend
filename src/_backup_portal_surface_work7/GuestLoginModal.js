import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import SummaryApi from "../common";

const GuestLoginModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ name: "", phone: "", email: "" });

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(SummaryApi.guestLogin.url, {
        method: SummaryApi.guestLogin.method,
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });

      const dataApi = await response.json();

      if (!dataApi.success) {
        // Distinct toast per outcome so the user immediately understands why,
        // instead of every rejection looking like a generic failure.
        if (dataApi.outcomeType === "real_user") {
          toast.info(dataApi.message || "This account already exists. Please sign in.");
        } else if (dataApi.outcomeType === "conflict") {
          toast.warning(dataApi.message || "This email or phone is already in use.");
        } else {
          toast.error(dataApi.message || "Could not start guest session");
        }
        return;
      }

      // Success toast is left to postLogin() (via onSuccess), which already
      // shows the backend's own distinct message ("Guest session resumed" vs
      // "Guest account created") — avoids a duplicate toast here.
      onSuccess(dataApi);
    } catch (error) {
      console.error("Guest login error:", error);
      toast.error("Could not start guest session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Try it as a Guest</h3>
        <p className="text-sm text-slate-600 mb-6">
          Explore the portal with a temporary demo account. No payment, no commitment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleOnChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={data.phone}
              onChange={handleOnChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleOnChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Starting..." : "Enter as Guest"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestLoginModal;

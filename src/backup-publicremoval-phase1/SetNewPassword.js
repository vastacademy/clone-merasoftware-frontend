import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import SummaryApi from "../common";

const SetNewPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(SummaryApi.setNewPassword.url, {
        method: SummaryApi.setNewPassword.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to update password");
        return;
      }
      toast.success("Password updated successfully");
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error setting new password:", error);
      toast.error("Error updating password");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/home", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <KeyRound size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-white">Set your password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your account was created with a default password. Set your own password to secure it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-300">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 focus:bg-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50 focus:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Password"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-4 w-full text-center text-sm font-medium text-slate-400 transition hover:text-slate-200"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default SetNewPassword;

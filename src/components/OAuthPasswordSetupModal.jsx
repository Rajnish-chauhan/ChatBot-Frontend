import React, { useState } from "react";
import { setCredentials } from "../api/ChatApi";

export default function OAuthPasswordSetupModal({ isOpen, initialUsername, onSuccess }) {
  const [setupUsername, setSetupUsername] = useState(initialUsername || "");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");

    if (!setupUsername.trim() || !setupPassword.trim()) {
      setSetupError("Please fill in all required fields.");
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setSetupError("Passwords do not match. Please ensure both passwords match.");
      return;
    }

    if (setupPassword.length < 6) {
      setSetupError("Password must be at least 6 characters long.");
      return;
    }

    setSetupLoading(true);

    try {
      const res = await setCredentials(setupUsername.trim(), setupPassword);
      onSuccess(res.token, res.username);
    } catch (err) {
      setSetupError(err.message || "Failed to set credentials.");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Set Username & Password
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          You signed in with Google. Customize your username and password so you can sign in directly anytime.
        </p>

        {setupError && (
          <div className="mb-3 p-2 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded text-center">
            {setupError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Choose Username
            </label>
            <input
              type="text"
              required
              defaultValue={setupUsername}
              onChange={(e) => setSetupUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Set Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={setupConfirmPassword}
                onChange={(e) => setSetupConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 pr-10 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
                  setupConfirmPassword && setupPassword !== setupConfirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {setupConfirmPassword && setupPassword !== setupConfirmPassword && (
              <p className="text-red-500 text-[11px] mt-1">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={setupLoading || (setupConfirmPassword && setupPassword !== setupConfirmPassword)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 mt-2"
          >
            {setupLoading ? "Saving..." : "Save Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
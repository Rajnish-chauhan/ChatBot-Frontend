import React, { useState, useEffect } from "react";
import { setCredentials, checkUsernameExists } from "../api/ChatApi";

export default function OAuthPasswordSetupModal({ isOpen, initialUsername, onSuccess }) {
  const [setupUsername, setSetupUsername] = useState(initialUsername || "");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (initialUsername) {
      setSetupUsername(initialUsername);
    }
  }, [initialUsername]);

  // Live check whether the chosen username is already taken by another user
  useEffect(() => {
    const trimmed = setupUsername.trim();
    if (!isOpen || !trimmed || trimmed.length < 2 || trimmed === initialUsername) {
      setUsernameExists(false);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameExists(trimmed);
        setUsernameExists(Boolean(res?.exists));
      } catch {
        setUsernameExists(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [setupUsername, initialUsername, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");

    if (!setupUsername.trim() || !setupPassword.trim()) {
      setSetupError("Please fill in all required fields.");
      return;
    }

    if (usernameExists) {
      setSetupError("This username is already taken. Please choose another.");
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
      if (onSuccess) onSuccess(res.token, res.username);
    } catch (err) {
      setSetupError(err.message || "Failed to set credentials.");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Complete Account Setup
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          You signed in with Google. Set your username and password to finalize your account.
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
              value={setupUsername}
              onChange={(e) => setSetupUsername(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
                usernameExists
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-700 focus:ring-blue-500"
              }`}
            />
            {setupUsername.trim().length >= 2 && setupUsername.trim() !== initialUsername && (
              <p className={`text-[11px] mt-1 ${usernameExists ? "text-red-500" : "text-emerald-500"}`}>
                {checkingUsername
                  ? "Checking username..."
                  : usernameExists
                  ? "Username is already taken."
                  : "Username is available."}
              </p>
            )}
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
            disabled={
              setupLoading ||
              usernameExists ||
              checkingUsername ||
              Boolean(setupConfirmPassword && setupPassword !== setupConfirmPassword)
            }
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50 mt-2"
          >
            {setupLoading ? "Saving..." : "Save Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
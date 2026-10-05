import React, { useState } from "react";
import { setCredentials } from "../api/ChatApi";

export default function OAuthPasswordSetupModal({ isOpen, initialUsername, onSuccess }) {
  const [setupUsername, setSetupUsername] = useState(initialUsername || "");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSetupError("");
    setSetupLoading(true);

    try {
      const res = await setCredentials(setupUsername, setupPassword);
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
          You signed in with Google. Set your credentials so you can log in directly using your username & password anytime.
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
            <input
              type="password"
              required
              placeholder="••••••••"
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={setupLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
          >
            {setupLoading ? "Saving..." : "Save Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
}
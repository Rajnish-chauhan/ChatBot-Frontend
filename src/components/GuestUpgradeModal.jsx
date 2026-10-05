import React, { useState } from "react";
import { sendOtp, upgradeGuest } from "../api/ChatApi";

export default function GuestUpgradeModal({ isOpen, onClose, onSuccess }) {
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeOtp, setUpgradeOtp] = useState("");
  const [upgradeUsername, setUpgradeUsername] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  
  const [upgradeOtpSent, setUpgradeOtpSent] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setUpgradeError("");
    setUpgradeLoading(true);

    try {
      await sendOtp(upgradeEmail);
      setUpgradeOtpSent(true);
    } catch (err) {
      setUpgradeError(err.message || "Failed to send verification email.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpgradeError("");
    setUpgradeLoading(true);

    try {
      const res = await upgradeGuest(upgradeEmail, upgradeOtp, upgradeUsername, upgradePassword);
      onSuccess(res.token, res.username);
    } catch (err) {
      setUpgradeError(err.message || "Failed to link and save account.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Save Your Guest Chats
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Verify your email via OTP to keep all your sessions permanently.
        </p>

        {upgradeError && (
          <div className="mb-3 p-2 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded text-center">
            {upgradeError}
          </div>
        )}

        {!upgradeOtpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={upgradeEmail}
                onChange={(e) => setUpgradeEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={upgradeLoading}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                {upgradeLoading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={upgradeOtp}
                onChange={(e) => setUpgradeOtp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm text-center tracking-widest"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={upgradeUsername}
                onChange={(e) => setUpgradeUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={upgradePassword}
                onChange={(e) => setUpgradePassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={upgradeLoading}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {upgradeLoading ? "Saving..." : "Save Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
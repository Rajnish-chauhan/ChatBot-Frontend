import React, { useState, useEffect } from "react";
import { sendOtp, upgradeGuest, checkEmailExists } from "../api/ChatApi";

export default function GuestUpgradeModal({ isOpen, onClose, onSuccess }) {
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeOtp, setUpgradeOtp] = useState("");
  const [upgradeUsername, setUpgradeUsername] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgradeConfirmPassword, setUpgradeConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [upgradeOtpSent, setUpgradeOtpSent] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [upgradeError, setUpgradeError] = useState("");
  const [liveEmailError, setLiveEmailError] = useState("");

  useEffect(() => {
    if (!upgradeEmail || !upgradeEmail.includes("@")) {
      setLiveEmailError("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      const exists = await checkEmailExists(upgradeEmail);
      if (exists) {
        setLiveEmailError("Email is already linked to another account.");
      } else {
        setLiveEmailError("");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [upgradeEmail]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (liveEmailError) return;

    setUpgradeError("");
    setUpgradeLoading(true);

    try {
      await sendOtp(upgradeEmail.trim());
      setUpgradeOtpSent(true);
    } catch (err) {
      setUpgradeError(err.message || "Failed to send verification email.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (upgradePassword !== upgradeConfirmPassword) {
      setUpgradeError("Passwords do not match.");
      return;
    }

    if (upgradePassword.length < 6) {
      setUpgradeError("Password must be at least 6 characters long.");
      return;
    }

    setUpgradeError("");
    setUpgradeLoading(true);

    try {
      const res = await upgradeGuest(
        upgradeEmail.trim(),
        upgradeOtp.trim(),
        upgradeUsername.trim(),
        upgradePassword
      );
      onSuccess(res.token, res.username);
    } catch (err) {
      setUpgradeError(err.message || "Failed to link and save account.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1c1c1c] p-7 rounded-[20px] shadow-2xl w-full max-w-[420px] border border-slate-200 dark:border-[#2d2d2d] transition-colors">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
          Save Your Guest Chats
        </h3>
        <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Verify your email via OTP to keep all your sessions permanently.
        </p>

        {upgradeError && (
          <div className="mb-4 p-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-center">
            {upgradeError}
          </div>
        )}

        {!upgradeOtpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={upgradeEmail}
                onChange={(e) => setUpgradeEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#2a2a2a] border text-slate-900 dark:text-white text-[15px] focus:outline-none transition-colors placeholder-slate-400 dark:placeholder-slate-500 ${
                  liveEmailError
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-300 dark:border-[#3a3a3a] focus:border-blue-500"
                }`}
              />
              {liveEmailError && (
                <p className="text-red-500 text-xs mt-2 font-medium">{liveEmailError}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-[#333333] dark:hover:bg-[#404040] dark:text-slate-300 rounded-xl text-[14px] font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={upgradeLoading || !!liveEmailError}
                className="flex-1 py-3 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-[14px] font-medium transition disabled:opacity-50"
              >
                {upgradeLoading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={upgradeOtp}
                onChange={(e) => setUpgradeOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-white text-sm text-center tracking-[0.25em] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Choose Username
              </label>
              <input
                type="text"
                required
                value={upgradeUsername}
                onChange={(e) => setUpgradeUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Set Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={upgradeConfirmPassword}
                  onChange={(e) => setUpgradeConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-[#2a2a2a] border text-slate-900 dark:text-white text-sm focus:outline-none transition-colors ${
                    upgradeConfirmPassword && upgradePassword !== upgradeConfirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 dark:border-[#3a3a3a] focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
              {upgradeConfirmPassword && upgradePassword !== upgradeConfirmPassword && (
                <p className="text-red-500 text-[11px] mt-1">Passwords do not match.</p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-[#333333] dark:hover:bg-[#404040] dark:text-slate-300 rounded-xl text-[14px] font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={upgradeLoading || (upgradeConfirmPassword && upgradePassword !== upgradeConfirmPassword)}
                className="flex-1 py-3 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-[14px] font-medium transition disabled:opacity-50"
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
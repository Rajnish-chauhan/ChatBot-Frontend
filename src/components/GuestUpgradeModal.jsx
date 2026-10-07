import React, { useState, useEffect } from "react";
import { sendOtp, upgradeGuest, checkEmailExists } from "../api/ChatApi";

export default function GuestUpgradeModal({ isOpen, onClose, onSuccess }) {
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeOtp, setUpgradeOtp] = useState("");
  const [upgradeUsername, setUpgradeUsername] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  
  const [upgradeOtpSent, setUpgradeOtpSent] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  
  const [upgradeError, setUpgradeError] = useState("");
  const [liveEmailError, setLiveEmailError] = useState(""); 

  useEffect(() => {
    if (!upgradeEmail || !upgradeEmail.includes('@')) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1c1c1c] p-7 rounded-[20px] shadow-2xl w-full max-w-[420px] border border-[#2d2d2d]">
        <h3 className="text-xl font-bold text-white mb-1.5">
          Save Your Guest Chats
        </h3>
        <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
          Verify your email via OTP to keep all your sessions permanently.
        </p>

        {upgradeError && (
          <div className="mb-4 p-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center">
            {upgradeError}
          </div>
        )}

        {!upgradeOtpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={upgradeEmail}
                onChange={(e) => setUpgradeEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-3 rounded-xl bg-[#2a2a2a] border text-white text-[15px] focus:outline-none transition-colors placeholder-slate-500 ${
                  liveEmailError ? "border-red-500/50 focus:border-red-500" : "border-[#3a3a3a] focus:border-blue-500"
                }`}
              />
              {liveEmailError && (
                <p className="text-red-400 text-xs mt-2 font-medium">{liveEmailError}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#333333] hover:bg-[#404040] text-slate-300 rounded-xl text-[14px] font-medium transition"
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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                6-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={upgradeOtp}
                onChange={(e) => setUpgradeOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm text-center tracking-[0.25em] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Choose Username
              </label>
              <input
                type="text"
                required
                value={upgradeUsername}
                onChange={(e) => setUpgradeUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Set Password
              </label>
              <input
                type="password"
                required
                value={upgradePassword}
                onChange={(e) => setUpgradePassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#333333] hover:bg-[#404040] text-slate-300 rounded-xl text-[14px] font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={upgradeLoading}
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
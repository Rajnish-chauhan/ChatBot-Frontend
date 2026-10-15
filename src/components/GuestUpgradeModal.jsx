import React, { useState, useEffect } from "react";
import {
  sendOtp,
  verifyOtpCode,
  registerWithOtp,
  checkEmailExists,
  checkUsernameExists,
} from "../api/ChatApi";

const EyeIcon = ({ isOpen, className = "w-4 h-4" }) =>
  isOpen ? (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const GuestUpgradeModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live availability states for email and username
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounced live email existence check
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@") || step !== 1) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkEmailExists(trimmed);
        setEmailExists(Boolean(res?.exists));
      } catch {
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, step]);

  // Debounced live username existence check
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2 || step !== 2) {
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
  }, [username, step]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (emailExists) {
      setError("This email is already registered. Please log in instead.");
      return;
    }

    try {
      setLoading(true);
      const checkRes = await checkEmailExists(email);
      if (checkRes && checkRes.exists) {
        setEmailExists(true);
        setError("This email is already registered. Please log in instead.");
        setLoading(false);
        return;
      }

      await sendOtp(email);
      setSuccessMsg("Verification code sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteUpgrade = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }

    if (usernameExists) {
      setError("This username is already taken. Please choose another.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    try {
      setLoading(true);
      await verifyOtpCode(email, otp.trim());
      const data = await registerWithOtp({
        username: username.trim(),
        email: email.trim(),
        password,
        otp: otp.trim(),
      });

      if (onSuccess) onSuccess(data, true);
      onClose();
    } catch (err) {
      setError(err.message || "Upgrade failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#18191e] border border-[#2b2d35] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#2b2d35] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Upgrade to Full Account</h2>
            <p className="text-xs text-gray-400 mt-0.5">Get 50 daily requests and save chat history</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#23252c] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="text-xs text-red-400 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="text-xs text-green-400 p-2.5 rounded-lg bg-green-950/40 border border-green-800/40">
              {successMsg}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Your Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#121316] border text-sm text-white focus:outline-none ${
                    emailExists ? "border-red-500" : "border-[#2b2d35] focus:border-blue-500"
                  }`}
                />
                {email.includes("@") && (
                  <p className={`text-[11px] ${emailExists ? "text-red-400" : "text-emerald-400"}`}>
                    {checkingEmail
                      ? "Checking email..."
                      : emailExists
                      ? "This email is already registered."
                      : "Email is available."}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || emailExists || checkingEmail}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? "Sending Code..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteUpgrade} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Email</label>
                <input
                  type="text"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-[#121316] border border-[#2b2d35] text-xs text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300">Verification Code (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-[#121316] border border-[#2b2d35] text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300">Choose Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="rajnish_01"
                  required
                  className={`w-full px-3.5 py-2 rounded-lg bg-[#121316] border text-sm text-white focus:outline-none ${
                    usernameExists ? "border-red-500" : "border-[#2b2d35] focus:border-blue-500"
                  }`}
                />
                {username.trim().length >= 2 && (
                  <p className={`text-[11px] ${usernameExists ? "text-red-400" : "text-emerald-400"}`}>
                    {checkingUsername
                      ? "Checking username..."
                      : usernameExists
                      ? "Username is already taken."
                      : "Username is available."}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2 pr-9 rounded-lg bg-[#121316] border border-[#2b2d35] text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <EyeIcon isOpen={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || usernameExists || checkingUsername}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Complete Upgrade"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-gray-400 hover:text-gray-300 text-center mt-1"
              >
                ← Back to change email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestUpgradeModal;
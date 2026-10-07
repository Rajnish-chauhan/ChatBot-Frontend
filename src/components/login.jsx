import React, { useState, useEffect } from "react";
import { loginUser, guestLogin, sendOtp, registerWithOtp, checkEmailExists } from "../api/ChatApi";

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [liveEmailError, setLiveEmailError] = useState(""); 

  useEffect(() => {
    if (!isRegistering || !email || !email.includes('@')) {
      setLiveEmailError("");
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      const exists = await checkEmailExists(email);
      if (exists) {
        setLiveEmailError("Email is already registered. Please sign in instead.");
      } else {
        setLiveEmailError("");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, isRegistering]);

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(username, password);
      onLoginSuccess(data.token, data.username, false, data.requiresPasswordSetup || false);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await guestLogin();
      onLoginSuccess(data.token, "Guest", true, false);
    } catch (err) {
      setError(err.message || "Failed to initialize session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || liveEmailError) return;
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await sendOtp(email);
      setOtpSent(true);
      setSuccessMsg("OTP sent successfully! Please check your email.");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim() || !username.trim() || !password.trim()) return;

    setLoading(true);
    setError("");
    try {
      const data = await registerWithOtp(email, otp, username, password);
      onLoginSuccess(data.token, data.username, false, false);
    } catch (err) {
      setError(err.message || "Failed to verify OTP and register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121212] p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1c] rounded-[20px] shadow-xl border border-slate-200 dark:border-[#2d2d2d] p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isRegistering ? "Create Account" : "Sign In"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isRegistering 
              ? "Register with your email to save your chat history" 
              : "Enter your username or email and password to continue"}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm text-center border border-emerald-100 dark:border-emerald-500/20">
            {successMsg}
          </div>
        )}

        {!isRegistering && (
          <>
            <form onSubmit={handleStandardLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors text-sm"
                  placeholder="Username or Email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors tracking-widest text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 mt-4"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-[#2d2d2d]">
              <button 
                type="button" 
                onClick={() => { setError(""); setIsRegistering(true); }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Register with OTP
              </button>
              
              <button 
                type="button" 
                onClick={handleContinueWithoutLogin}
                disabled={loading}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
              >
                Continue as Guest
              </button>
            </div>
          </>
        )}

        {isRegistering && (
          <form onSubmit={otpSent ? handleCompleteRegistration : handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || otpSent}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm text-slate-900 dark:text-white disabled:opacity-60 ${
                  liveEmailError ? "border-red-500/50 focus:ring-red-500/50" : "border-slate-300 dark:border-[#3a3a3a] focus:ring-blue-500"
                }`}
                placeholder="you@example.com"
                required
              />
              {liveEmailError && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{liveEmailError}</p>
              )}
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors text-sm tracking-widest"
                    placeholder="123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Choose Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors text-sm"
                    placeholder="Username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors text-sm tracking-widest"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !!liveEmailError}
              className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50 mt-4"
            >
              {loading 
                ? "Processing..." 
                : (otpSent ? "Complete Registration" : "Send OTP to Email")}
            </button>

            <div className="text-center mt-5">
              <button 
                type="button" 
                onClick={() => { setError(""); setSuccessMsg(""); setIsRegistering(false); }}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#2d2d2d]">
          <button
            type="button"
            onClick={() => window.location.href = "http://localhost:8080/oauth2/authorization/google"}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#2a2a2a] border border-slate-300 dark:border-[#3a3a3a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#333] font-medium py-3 rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

      </div>
    </div>
  );
}
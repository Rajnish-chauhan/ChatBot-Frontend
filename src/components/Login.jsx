import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  LogIn as LogInIcon, 
  UserPlus, 
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { 
  login, 
  guestLogin, 
  sendOtp, 
  verifyOtpCode,
  registerWithOtp, 
  sendForgotPasswordOtp, 
  resetPasswordWithOtp, 
  OAUTH2_GOOGLE_URL 
} from '../api/ChatApi';
import Logo from './Logo';

const Login = ({ isOpen, onClose, onSuccess, onLoginSuccess }) => {
  // Modal view states: welcome, login, register_email, register_otp, register_password, forgot_email, forgot_verify
  const [mode, setMode] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form input states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleAuthSuccess = (userData) => {
    if (onSuccess) onSuccess(userData);
    if (onLoginSuccess) onLoginSuccess(userData);
    onClose();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  // Immediate guest session entry
  const handleGuestEntry = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await guestLogin();
      handleAuthSuccess(data.user || data);
    } catch (err) {
      setError(err.message || 'Failed to initialize guest session.');
    } finally {
      setLoading(false);
    }
  };

  // Existing account login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await login(emailOrUsername.trim(), password);
      handleAuthSuccess(data.user || data);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Registration Step 1: Send OTP to provided email
  const handleSendRegisterOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendOtp(email.trim());
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
      setMode('register_otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Registration Step 2: Verify OTP code first
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtpCode(email.trim(), otp.trim());
      setSuccessMsg('Email verified successfully. Now choose your username and password.');
      setMode('register_password');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Registration Step 3: Set username and password after OTP verification
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const data = await registerWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        username: username.trim(),
        password,
      });
      handleAuthSuccess(data.user || data);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Request password reset OTP
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendForgotPasswordOtp(email.trim());
      setSuccessMsg('A password reset code has been sent to your email.');
      setMode('forgot_verify');
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Set new password with OTP verification
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword) {
      setError('Please enter the OTP and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      setSuccessMsg('Password successfully updated. Please log in.');
      setTimeout(() => switchMode('login'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = OAUTH2_GOOGLE_URL;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#13161c] border border-[#212634] rounded-3xl shadow-2xl p-6 sm:p-8 text-white transition-all">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <Logo size={48} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome to ChatBot</h2>
          <p className="text-xs text-gray-400 mt-1">Select an option to start chatting</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2 p-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Welcome selection view */}
        {mode === 'welcome' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/20"
              >
                <LogInIcon className="w-4 h-4" />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={handleGuestEntry}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1e222e] hover:bg-[#282d3d] border border-[#2b3142] text-gray-200 rounded-xl text-sm font-medium transition"
              >
                <UserCheck className="w-4 h-4 text-gray-400" />
                <span>{loading ? 'Entering...' : 'Guest'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('register_email')}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#161a24] hover:bg-[#202534] border border-[#262c3e] text-gray-200 rounded-xl text-sm font-medium transition"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Register with Email</span>
            </button>

            <div className="pt-4 text-center text-[11px] text-gray-500 space-y-1">
              <div>
                <a href="/privacy-policy.html" target="_blank" rel="noreferrer" className="hover:text-gray-400 underline">
                  Terms & Conditions
                </a>
                {' '}•{' '}
                <a href="/privacy-policy.html" target="_blank" rel="noreferrer" className="hover:text-gray-400 underline">
                  Privacy Policy
                </a>
              </div>
              <p>© 2026 rajnishsystems.in. All rights reserved.</p>
            </div>
          </div>
        )}

        {/* Existing account login view */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Email or Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot_email')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('welcome')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Options
            </button>
          </form>
        )}

        {/* Registration Step 1: Input email to receive OTP */}
        {mode === 'register_email' && (
          <form onSubmit={handleSendRegisterOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                We will send a 6-digit OTP code to verify your email.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification OTP'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('welcome')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Options
            </button>
          </form>
        )}

        {/* Registration Step 2: Verify OTP first before asking for password */}
        {mode === 'register_otp' && (
          <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Enter 6-digit OTP sent to <span className="text-white font-medium">{email}</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white text-center tracking-widest focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <button
                type="button"
                onClick={handleSendRegisterOtp}
                disabled={loading}
                className="hover:text-blue-400 underline"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => switchMode('register_email')}
                className="hover:text-white"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* Registration Step 3: Set username and password after OTP verification */}
        {mode === 'register_password' && (
          <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Email verified: <strong>{email}</strong></span>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Choose Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose username"
                  className="w-full pl-10 pr-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Password recovery phase 1: Email collection */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleSendForgotOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </form>
        )}

        {/* Password recovery phase 2: Verification and credential update */}
        {mode === 'forgot_verify' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs text-gray-400 mb-1">6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white text-center tracking-widest focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-xs text-gray-400 hover:text-gray-200 text-center pt-1"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
import React, { useState, useEffect } from 'react';
import {
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
  ShieldCheck,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  login,
  guestLogin,
  sendOtp,
  verifyOtpCode,
  registerWithOtp,
  checkEmailExists,
  checkUsernameExists,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  OAUTH2_GOOGLE_URL,
} from '../api/ChatApi';
import Logo from './Logo';

const Login = ({
  isOpen,
  initialMode = 'welcome',
  canClose = false,
  onClose,
  onSuccess,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form field states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);

  // Live availability states for email and username
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'welcome');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    const trimmed = email.trim();
    if (mode !== 'register_email' || !trimmed || !trimmed.includes('@')) {
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
  }, [email, mode]);

  useEffect(() => {
    const trimmed = username.trim();
    if (mode !== 'register_password' || !trimmed || trimmed.length < 2) {
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
  }, [username, mode]);

  if (!isOpen) return null;

  const handleAuthSuccess = (userData, isNewRegistration = false) => {
    const callback = onLoginSuccess || onSuccess;
    if (callback) callback(userData, isNewRegistration);
    if (onClose) onClose();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleGuestEntry = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await guestLogin();
      handleAuthSuccess(data.user || data, false);
    } catch (err) {
      setError(err.message || 'Failed to initialize guest session.');
    } finally {
      setLoading(false);
    }
  };

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
      handleAuthSuccess(data.user || data, false);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegisterOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (emailExists) {
      setError('This email is already registered. Please sign in instead.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const checkRes = await checkEmailExists(email.trim());
      if (checkRes?.exists) {
        setEmailExists(true);
        setError('This email is already registered. Please sign in instead.');
        return;
      }

      await sendOtp(email.trim());
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
      setMode('register_otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      setSuccessMsg('');
      setMode('register_password');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (usernameExists) {
      setError('This username is already taken. Please choose another.');
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
      const checkUser = await checkUsernameExists(username.trim());
      if (checkUser?.exists) {
        setUsernameExists(true);
        setError('This username is already taken. Please choose another.');
        return;
      }

      const data = await registerWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        username: username.trim(),
        password,
      });
      handleAuthSuccess(data.user || data, true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Send 6-digit reset OTP to registered email
  const handleSendForgotOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await sendForgotPasswordOtp(email.trim());
      if (res?.email) {
        setEmail(res.email);
      }
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccessMsg(`A 6-digit password reset code has been sent to ${res?.email || email.trim()}.`);
      setMode('forgot_verify');
    } catch (err) {
      setError(err.message || 'No registered account found or failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 2: Verify OTP and save new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      setEmailOrUsername(email.trim());
      setPassword('');
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Invalid OTP or failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = OAUTH2_GOOGLE_URL;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#13161c] border border-[#212634] rounded-3xl shadow-2xl p-6 sm:p-8 text-white transition-all">
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-[#212634] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

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
                  onClick={() => {
                    if (emailOrUsername.includes('@')) {
                      setEmail(emailOrUsername.trim());
                    }
                    switchMode('forgot_email');
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showLoginPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none ${
                    emailExists ? 'border-red-500' : 'border-[#2b3246] focus:border-blue-500'
                  }`}
                />
              </div>
              {email.trim().includes('@') ? (
                <p className={`text-[11px] mt-1 ${emailExists ? 'text-red-400' : 'text-emerald-400'}`}>
                  {checkingEmail
                    ? 'Checking email availability...'
                    : emailExists
                    ? 'This email is already registered. Please log in.'
                    : 'Email is available for registration.'}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">
                  We will send a 6-digit OTP code to verify your email.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || emailExists || checkingEmail}
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
                  className={`w-full pl-10 pr-4 py-2 bg-[#1b1f2b] border rounded-xl text-sm text-white focus:outline-none ${
                    usernameExists ? 'border-red-500' : 'border-[#2b3246] focus:border-blue-500'
                  }`}
                />
              </div>
              {username.trim().length >= 2 && (
                <p className={`text-[11px] mt-1 ${usernameExists ? 'text-red-400' : 'text-emerald-400'}`}>
                  {checkingUsername
                    ? 'Checking username availability...'
                    : usernameExists
                    ? 'This username is already taken.'
                    : 'Username is available.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showRegisterPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-10 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameExists || checkingUsername}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Forgot Password Step 1: Request OTP */}
        {mode === 'forgot_email' && (
          <form onSubmit={handleSendForgotOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Registered Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email or username"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                We will send a 6-digit OTP code to your registered email address to reset your password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Sending Reset Code...' : 'Send Reset OTP'}
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

        {/* Forgot Password Step 2: Verify OTP and set new password */}
        {mode === 'forgot_verify' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                6-Digit OTP Code sent to <span className="text-white font-medium">{email}</span>
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
                  className="w-full pl-10 pr-4 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white text-center tracking-widest focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle new password visibility"
                >
                  {showResetPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type={showConfirmResetPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-10 py-2 bg-[#1b1f2b] border border-[#2b3246] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle confirm new password visibility"
                >
                  {showConfirmResetPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <button
                type="button"
                onClick={handleSendForgotOtp}
                disabled={loading}
                className="hover:text-blue-400 underline"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="hover:text-white"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
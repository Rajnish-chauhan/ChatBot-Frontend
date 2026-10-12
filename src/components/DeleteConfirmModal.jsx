import React, { useState } from "react";
import { deleteUserAccount } from "../api/ChatApi";

// Eye icon for password visibility toggle
const EyeIcon = ({ isOpen, className = "w-4 h-4" }) =>
  isOpen ? (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const DeleteConfirmModal = ({ isOpen, onClose, onDeleted, currentUser }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Determine if user has a password set (supports both isPasswordSet and passwordSet)
  const isPasswordRequired = currentUser
    ? Boolean(currentUser.isPasswordSet ?? currentUser.passwordSet)
    : true;

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    if (isPasswordRequired && !password.trim()) {
      setError("Please enter your password to confirm account deletion.");
      return;
    }

    try {
      setLoading(true);
      // Backend validates password matches before deleting account
      await deleteUserAccount(password.trim());
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.href = "/?login=true";
      }
      onClose();
    } catch (err) {
      setError(err.message || "Incorrect password. Account deletion denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#181a20] border border-[#2b2f3a] rounded-3xl shadow-2xl p-6 space-y-4">
        {/* Warning Header */}
        <div className="flex items-center gap-3 text-red-400">
          <div className="p-2.5 rounded-2xl bg-red-950/40 border border-red-800/40">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete Account?</h3>
            <p className="text-[11px] text-gray-400">This action is permanent and irreversible.</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          All your saved conversation sessions, memory vectors, and preferences will be permanently wiped from the database.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="text-xs text-red-400 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 leading-relaxed">
            {error}
          </div>
        )}

        {/* Form with Password Confirmation */}
        <form onSubmit={handleDelete} className="space-y-4 pt-1">
          {isPasswordRequired && (
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-medium text-gray-300">
                Confirm Your Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#111317] border border-[#2b2f3a] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <EyeIcon isOpen={showPassword} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#2b2f3a] text-gray-300 hover:bg-[#23252c] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
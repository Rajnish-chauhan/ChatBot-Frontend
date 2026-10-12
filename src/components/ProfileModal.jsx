import React, { useState, useRef } from "react";
import { updateUserProfile, changeUserPassword } from "../api/ChatApi";

// Eye icon toggle for password visibility
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

const ProfileModal = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onOpenDeleteConfirm,
  onOpenLogoutConfirm,
  onOpenLogin,
}) => {
  const isGuest = currentUser?.isGuest;

  const isPasswordAlreadySet = Boolean(
    currentUser?.isPasswordSet ?? currentUser?.passwordSet
  );

  // Profile picture state
  const [profilePicPreview, setProfilePicPreview] = useState(currentUser?.profilePic || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  // Change password accordion hidden by default
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Image size must be less than 2MB");
      return;
    }

    setPhotoError("");
    setPhotoSuccess("");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setProfilePicPreview(base64Data);

      try {
        setIsUploadingPhoto(true);
        await updateUserProfile({ profilePic: base64Data });
        setPhotoSuccess("Profile picture updated successfully.");
        if (onProfileUpdated) onProfileUpdated();
      } catch (err) {
        setPhotoError(err.message || "Failed to update profile picture");
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (isPasswordAlreadySet && !currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changeUserPassword(currentPassword.trim(), newPassword.trim());
      setPasswordSuccess(
        isPasswordAlreadySet
          ? "Password changed successfully."
          : "Password created successfully. You can now log in directly."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border bg-[#181a20] border-[#2b2f3a]">
        <div className="px-6 py-4 border-b flex items-center justify-between border-[#2b2f3a]">
          <h2 className="text-base font-semibold text-white">
            {isGuest ? "Guest Session" : "Profile & Settings"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-[#252833]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {isGuest ? (
            <div className="flex flex-col items-center text-center py-2 space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">G</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Temporary Guest Session</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                  You are currently using ChatBot as a guest. Log in or create an account to save your chat history permanently.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Log In / Sign Up</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogoutConfirm) onOpenLogoutConfirm();
                }}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors pt-2"
              >
                End Guest Session
              </button>
            </div>
          ) : (
            <>
              {/* Profile Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {(currentUser?.username?.[0] || "U").toUpperCase()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white font-medium"
                  >
                    {isUploadingPhoto ? "Saving..." : "Change"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="mt-3 text-xs text-blue-500 hover:underline transition-colors font-medium"
                >
                  Upload New Picture
                </button>

                {photoError && <p className="text-xs text-red-400 mt-1">{photoError}</p>}
                {photoSuccess && <p className="text-xs text-green-400 mt-1">{photoSuccess}</p>}
              </div>

              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Username</label>
                <input
                  type="text"
                  value={currentUser?.username || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm cursor-not-allowed select-none bg-[#111317] border-[#2b2f3a] text-gray-400"
                />
              </div>

              {/* Password Section (Collapsed by default, opens on user click) */}
              <div className="border rounded-2xl overflow-hidden border-[#2b2f3a] bg-[#121317]">
                <button
                  type="button"
                  onClick={() => setIsPasswordFormOpen(!isPasswordFormOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-medium transition-colors text-gray-200 hover:bg-[#1a1c22]"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {isPasswordAlreadySet ? "Change Password" : "Create Password (First Time)"}
                    </span>
                    {!isPasswordAlreadySet && (
                      <p className="text-[11px] text-blue-400 mt-0.5">
                        Set a password to sign in directly without Google
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isPasswordFormOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isPasswordFormOpen && (
                  <form onSubmit={handlePasswordSubmit} className="p-4 border-t space-y-3 border-[#2b2f3a]">
                    {passwordError && (
                      <div className="text-xs text-red-400 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="text-xs text-green-400 p-2.5 rounded-lg bg-green-950/40 border border-green-800/40">
                        {passwordSuccess}
                      </div>
                    )}

                    {isPasswordAlreadySet && (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                            className="w-full px-3 py-2 pr-9 rounded-lg border text-sm focus:outline-none focus:border-blue-500 bg-[#181a20] border-[#2b2f3a] text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                          >
                            <EyeIcon isOpen={showCurrentPassword} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">
                        {isPasswordAlreadySet ? "New Password" : "Set New Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="At least 6 characters"
                          className="w-full px-3 py-2 pr-9 rounded-lg border text-sm focus:outline-none focus:border-blue-500 bg-[#181a20] border-[#2b2f3a] text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        >
                          <EyeIcon isOpen={showNewPassword} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 pr-9 rounded-lg border text-sm focus:outline-none focus:border-blue-500 bg-[#181a20] border-[#2b2f3a] text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        >
                          <EyeIcon isOpen={showConfirmPassword} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {passwordLoading
                        ? "Saving..."
                        : isPasswordAlreadySet
                        ? "Update Password"
                        : "Save New Password"}
                    </button>
                  </form>
                )}
              </div>

              {/* Account Actions */}
              <div className="pt-4 border-t space-y-2.5 border-[#2b2f3a]">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLogoutConfirm) onOpenLogoutConfirm();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 border-[#333640] text-gray-300 hover:bg-[#23252c] hover:text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Log Out
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenDeleteConfirm) onOpenDeleteConfirm();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors text-center"
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
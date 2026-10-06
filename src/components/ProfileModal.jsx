import React, { useState } from "react";
import { deleteAccount } from "../api/ChatApi";

export default function ProfileModal({ isOpen, onClose, username, isGuest, onAccountDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      onAccountDeleted();
    } catch (error) {
      alert("Failed to delete account: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Account Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold uppercase">
              {username.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Username</p>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{username}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${isGuest ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isGuest ? "Guest Account" : "Registered User"}
              </span>
            </div>
          </div>

          <div className="border-t border-red-100 dark:border-red-900/30 pt-6 mt-6">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Danger Zone</h4>
            
            {!showConfirm ? (
              <button 
                onClick={() => setShowConfirm(true)}
                className="w-full py-2.5 px-4 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors text-sm"
              >
                Delete Account & Data
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  Are you sure? This action is permanent and will instantly erase your account, settings, and all chat history.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 bg-white dark:bg-[#2d2d2d] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
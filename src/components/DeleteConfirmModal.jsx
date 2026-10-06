import React, { useState } from "react";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800">
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            Are you sure you want to permanently delete your account? All of your chat history, preferences, and personal data will be immediately erased from our servers.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-white dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete My Account"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
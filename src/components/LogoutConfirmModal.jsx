import React from "react";

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#18191e] border border-[#2b2d35] rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-gray-200">
          <div className="p-2 rounded-xl bg-gray-800 border border-gray-700">
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">Log Out</h3>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Are you sure you want to log out of your session?
        </p>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl border border-[#2b2d35] text-gray-300 hover:bg-[#23252c] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
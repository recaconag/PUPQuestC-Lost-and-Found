import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "⚠️",
      iconBg: "bg-red-900/40",
      iconText: "text-red-400",
      confirmBg: "bg-red-700 hover:bg-red-800",
      confirmBorder: "border-red-600/50",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-yellow-900/40",
      iconText: "text-yellow-400",
      confirmBg: "bg-yellow-700 hover:bg-yellow-800",
      confirmBorder: "border-yellow-600/50",
    },
    info: {
      icon: "ℹ️",
      iconBg: "bg-blue-900/40",
      iconText: "text-blue-400",
      confirmBg: "bg-blue-700 hover:bg-blue-800",
      confirmBorder: "border-blue-600/50",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className={`${styles.iconBg} rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
              <span className={`text-2xl ${styles.iconText}`}>{styles.icon}</span>
            </div>
            <h2 className="text-xl font-bold gold-text mb-2">{title}</h2>
            <p className="text-gray-400 mb-4">{message}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 ${styles.confirmBg} disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center border ${styles.confirmBorder}`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

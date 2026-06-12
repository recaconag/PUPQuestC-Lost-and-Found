import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { FaWifi } from "react-icons/fa";

interface OnlineStatusContextType {
  isOnline: boolean;
  showOfflineBanner: boolean;
  showOnlineBanner: boolean;
  dismissOfflineBanner: () => void;
  dismissOnlineBanner: () => void;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isOnline) {
      setShowOfflineBanner(false);
      setShowOnlineBanner(true);
      const timer = setTimeout(() => {
        setShowOnlineBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineBanner(true);
      setShowOnlineBanner(false);
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial status
    const currentStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(currentStatus);
    setShowOfflineBanner(!currentStatus);

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dismissOfflineBanner = () => {
    setShowOfflineBanner(false);
  };

  const dismissOnlineBanner = () => {
    setShowOnlineBanner(false);
  };

  return (
    <OnlineStatusContext.Provider
      value={{
        isOnline,
        showOfflineBanner,
        showOnlineBanner,
        dismissOfflineBanner,
        dismissOnlineBanner,
      }}
    >
      {children}
      {showOfflineBanner && !isOnline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-slide-up">
          <div className="bg-gray-900 border border-yellow-600/50 rounded-xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-900/30 rounded-full flex items-center justify-center border border-yellow-600/50">
              <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">You're offline</p>
              <p className="text-gray-400 text-xs">Some features may not be available</p>
            </div>
            <button
              onClick={dismissOfflineBanner}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {showOnlineBanner && isOnline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-slide-up">
          <div className="bg-gray-900 border border-green-600/50 rounded-xl p-4 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center border border-green-600/50">
              <FaWifi className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">You're back online</p>
              <p className="text-gray-400 text-xs">All features are now available</p>
            </div>
            <button
              onClick={dismissOnlineBanner}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatus() {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    throw new Error("useOnlineStatus must be used within an OnlineStatusProvider");
  }
  return context;
}

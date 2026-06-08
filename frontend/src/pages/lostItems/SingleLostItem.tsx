import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetSingleLostItemQuery,
  useMarkLostItemAsFoundMutation,
} from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTag,
  FaEnvelope,
  FaEdit,
  FaCheckCircle,
  FaTimes,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
  FaLock,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";
import { formatDate } from "../../utils/formatDate";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const SingleLostItem = () => {
  const { lostItem: lostItemId }: any = useParams();
  const navigate = useNavigate();
  const currentUser = useUserVerification();

  const { data: singleLostItem, isLoading } =
    useGetSingleLostItemQuery(lostItemId);
  const [markAsFound, { isLoading: isMarkingFound }] =
    useMarkLostItemAsFoundMutation();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [markFoundError, setMarkFoundError] = useState<string | null>(null);
  const [markFoundSuccess, setMarkFoundSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" className="mb-4" />
          <p className="text-gray-400">Loading lost item details...</p>
        </div>
      </div>
    );
  }

  const lostItem = singleLostItem?.data;

  if (!lostItem) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-red-600 text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold gold-text mb-4">Item Not Found</h2>
            <p className="text-gray-300 mb-6">
              The lost item you're looking for doesn't exist or may have been removed.
            </p>
            <Link
              to="/lostItems"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold rounded-lg transition-all duration-200 border border-red-600/50 shadow-lg"
            >
              <FaArrowLeft className="mr-2" />
              Back to Lost Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { lostItemName, date, isFound, img, description, location, user, category, userId, categoryId } = lostItem;

  const isLoggedIn = !!currentUser;
  const isOwner = isLoggedIn && currentUser.id === userId;

  const handleCopyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silent fail */
    }
  };

  const handleContactOwner = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/lostItems/${lostItemId}` } });
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleReportFound = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/lostItems/${lostItemId}` } });
      return;
    }
    const params = new URLSearchParams();
    if (lostItemName) params.set("name", lostItemName);
    if (categoryId) params.set("categoryId", categoryId);
    navigate(`/reportFoundItem?${params.toString()}`);
  };

  const handleMarkAsFound = () => {
    setMarkFoundError(null);
    setIsConfirmOpen(true);
  };

  const handleConfirmMarkAsFound = async () => {
    setIsConfirmOpen(false);
    setMarkFoundError(null);
    try {
      await markAsFound({ id: lostItemId }).unwrap();
      setMarkFoundSuccess(true);
      setTimeout(() => navigate("/dashboard/myLostItems"), 2200);
    } catch (err: any) {
      console.error("[SingleLostItem] markAsFound failed:", err);
      setMarkFoundError(
        err?.data?.message ?? "Failed to update status. Please try again."
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="glass-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/lostItems"
              className="inline-flex items-center text-red-600 hover:text-yellow-500 transition-colors duration-200 font-medium mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Lost Items
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold gold-text mb-2">
              {lostItemName || "Lost Item"}
            </h1>
            <p className="text-gray-300">Lost item details and information</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Section */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-800/60 backdrop-blur-sm">
                  <img
                    src={img}
                    alt={lostItemName}
                    className="w-full h-full object-cover transition-transform duration-200"
                    loading="lazy"
                    width={500}
                    height={500}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/bgimg.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isFound ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 shadow-lg backdrop-blur-sm border border-yellow-400/50">
                      ✓ Found
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg backdrop-blur-sm border border-red-600/50">
                      Still Lost
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-8">
              {/* Description */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-bold gold-text mb-4">Description</h2>
                <p className="text-gray-300 leading-relaxed">
                  {description || "No description available for this item."}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center text-yellow-500 mb-2">
                    <FaCalendarAlt className="mr-3" />
                    <span className="font-semibold">Date Lost</span>
                  </div>
                  <p className="text-gray-300">
                    {formatDate(date) || "Date not specified"}
                  </p>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center text-yellow-500 mb-2">
                    <FaMapMarkerAlt className="mr-3" />
                    <span className="font-semibold">Location</span>
                  </div>
                  <p className="text-gray-300">{location || "Location not specified"}</p>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center text-yellow-500 mb-2">
                    <FaTag className="mr-3" />
                    <span className="font-semibold">Category</span>
                  </div>
                  <p className="text-gray-300">{category?.name || "Uncategorized"}</p>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center text-yellow-500 mb-2">
                    <FaUser className="mr-3" />
                    <span className="font-semibold">Reported By</span>
                  </div>
                  <p className="text-gray-300">{user?.name || user?.email || "Anonymous"}</p>
                </div>
              </div>

              {/* Action Panel */}
              <div className="glass-card rounded-2xl p-6">
                {isFound ? (
                  <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-4 text-center">
                    <p className="text-yellow-400 font-semibold flex items-center justify-center gap-2">
                      <FaCheckCircle /> This item has been marked as found!
                    </p>
                  </div>
                ) : isOwner ? (
                  /* ── Owner View ── */
                  <>
                    <h3 className="text-lg font-bold gold-text mb-2">Manage Your Post</h3>
                    <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                      Update your report or mark it as found once it has been returned to you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        to="/dashboard/myLostItems"
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <FaEdit /> Edit Post
                      </Link>
                      <button
                        onClick={handleMarkAsFound}
                        disabled={isMarkingFound || markFoundSuccess}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg"
                      >
                        {isMarkingFound ? (
                          <><Spinner size="sm" /> Updating…</>
                        ) : markFoundSuccess ? (
                          <><FaCheckCircle /> Found! Redirecting…</>
                        ) : (
                          <><FaCheckCircle /> Mark as Found</>
                        )}
                      </button>
                    </div>
                    {markFoundError && (
                      <p className="mt-3 text-sm text-red-400 text-center">
                        ✕ {markFoundError}
                      </p>
                    )}
                    {markFoundSuccess && (
                      <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-900/20 border border-green-500/40" role="status">
                        <FaCheckCircle className="text-green-400 flex-shrink-0" />
                        <span className="text-sm text-green-300 font-medium">
                          Congratulations! We’re glad you found your item. Redirecting to your dashboard…
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Finder / Guest View ── */
                  <>
                    <h3 className="text-lg font-bold gold-text mb-2">Found This Item?</h3>
                    <p className="text-gray-300 mb-5 leading-relaxed text-sm">
                      If you have found this item, contact the owner directly or report it through
                      our platform to help reunite them with their belongings.
                      {!isLoggedIn && (
                        <span className="block mt-2 text-yellow-400/80 italic">
                          You must be logged in to use these actions.
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleReportFound}
                        title={!isLoggedIn ? "Sign in to perform this action" : undefined}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl border border-red-600/50"
                      >
                        {!isLoggedIn && <FaLock className="w-3.5 h-3.5 opacity-70" />}
                        Report Found Item
                      </button>
                      <button
                        onClick={handleContactOwner}
                        title={!isLoggedIn ? "Sign in to perform this action" : undefined}
                        className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        {!isLoggedIn && <FaLock className="w-3.5 h-3.5 opacity-70" />}
                        Contact Owner
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mark as Found — Confirmation Modal ── */}
      <AnimatePresence>
        {isConfirmOpen && (
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsConfirmOpen(false); }}
          >
            <motion.div
              key="confirm-card"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="glass-card rounded-2xl w-full max-w-sm overflow-hidden"
              ref={useFocusTrap(true)}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-gradient-to-r from-green-900/30 to-gray-800/60">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle className="text-yellow-400 w-4 h-4" />
                  <h3 className="text-lg font-bold gold-text tracking-tight">Confirm Recovery</h3>
                </div>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-150 p-1.5 rounded-lg"
                  aria-label="Close"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Are you sure you have recovered this item? This will mark your
                  report as <span className="text-green-400 font-semibold">Found</span> and
                  remove the post from the public lost gallery.
                </p>
                <p className="text-xs text-gray-500 italic">
                  You can still view it in your dashboard under "My Lost Items".
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-5">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 py-3.5 px-6 rounded-xl text-sm font-semibold text-gray-300 bg-gray-700/60 hover:bg-gray-600/60 border border-gray-600/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMarkAsFound}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 border border-green-600/50 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:ring-offset-gray-900"
                >
                  <FaCheckCircle className="w-4 h-4" />
                  Yes, Mark as Found
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contact Owner Modal ── */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div
            key="contact-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsContactModalOpen(false);
                setIsCopied(false);
              }
            }}
          >
            <motion.div
              key="contact-card"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="glass-card rounded-2xl w-full max-w-sm overflow-hidden"
              ref={useFocusTrap(true)}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60 bg-gradient-to-r from-red-900/30 to-gray-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h3 className="text-lg font-bold gold-text tracking-tight">
                    Owner Contact Info
                  </h3>
                </div>
                <button
                  onClick={() => { setIsContactModalOpen(false); setIsCopied(false); }}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-150 p-1.5 rounded-lg"
                  aria-label="Close modal"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-3">
                {/* Username row */}
                <div className="bg-gray-700/40 border border-gray-700/60 rounded-xl px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                    Name
                  </p>
                  <div className="flex items-center gap-2">
                    <FaUser className="text-yellow-500 flex-shrink-0 w-3.5 h-3.5" />
                    <span className="text-white font-medium">
                      {user?.name || user?.email || "Anonymous"}
                    </span>
                  </div>
                </div>

                {/* Email row */}
                <div className="bg-gray-700/40 border border-gray-700/60 rounded-xl px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                    Email Address
                  </p>
                  {user?.email ? (
                    <>
                      <div className="flex items-start gap-2">
                        <FaEnvelope className="text-yellow-500 flex-shrink-0 w-3.5 h-3.5 mt-0.5" />
                        <a
                          href={`mailto:${user.email}`}
                          className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors break-all leading-snug"
                        >
                          {user.email}
                        </a>
                      </div>

                      {/* Copy button + inline feedback */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={handleCopyEmail}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${isCopied
                            ? "bg-green-800/40 border-green-600/50 text-green-300"
                            : "bg-red-900/30 border-red-700/50 text-red-300 hover:bg-red-800/40 hover:text-red-200"
                            }`}
                        >
                          {isCopied ? (
                            <><FaCheck className="w-3 h-3" /> Copied!</>
                          ) : (
                            <><FaCopy className="w-3 h-3" /> Copy Email</>
                          )}
                        </button>

                        {isCopied && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-green-400 font-medium"
                          >
                            Email copied to clipboard!
                          </motion.span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400 pl-5">Not provided</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-5">
                <button
                  onClick={() => { setIsContactModalOpen(false); setIsCopied(false); }}
                  className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 border border-red-700/60 shadow-lg hover:shadow-red-900/30 text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SingleLostItem;

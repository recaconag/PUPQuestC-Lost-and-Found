import {
  useGetSingleFoundItemQuery,
  useCreateClaimMutation,
} from "../../redux/api/api";
import EditFoundItemModal from "./EditFoundItemModal";
import { Spinner } from "flowbite-react";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaTag,
  FaTimes,
  FaEdit,
  FaLock,
} from "react-icons/fa";
import { useUserVerification } from "../../auth/auth";
import { FormField } from "../../ui/forms/FormField";
import { createClaimSchema, type CreateClaimValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupButton } from "../../ui/PupButton";
import { formatDate } from "../../utils/formatDate";

const SingleFoundItem = () => {
  const { foundItem: foundItemParam } = useParams<{ foundItem: string }>();
  const foundItemId = foundItemParam;
  const currentUser = useUserVerification();
  const navigate = useNavigate();
  const isLoggedIn = !!currentUser;

  // All hooks must come before any conditional returns (Rules of Hooks)
  const { data: singleFoundItem, isLoading, refetch } =
    useGetSingleFoundItemQuery(foundItemId!, { skip: !foundItemId });

  const [createClaim, { isLoading: claimLoading }] = useCreateClaimMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const claimModalRef = useFocusTrap(isClaimModalOpen);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useZodForm<typeof createClaimSchema, CreateClaimValues>(createClaimSchema, {
    defaultValues: { lostDate: "", distinguishingFeatures: "" },
  });

  // Guard: no foundItemId in the URL
  if (!foundItemId) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold gold-text mb-4">
              Item Not Found
            </h1>
            <p className="text-gray-300 mb-6">
              The requested item could not be found.
            </p>
            <Link
              to="/found-items"
              className="inline-flex items-center text-red-600 hover:text-yellow-500 transition-colors duration-200 font-medium mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Found Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleClaimModal = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/found-items/${foundItemId}` } });
      return;
    }
    setIsClaimModalOpen(true);
  };

  const onSubmit = async (data: CreateClaimValues) => {
    setIsSubmitting(true);

    try {
      const claimData = {
        foundItemId: foundItemId,
        distinguishingFeatures: data.distinguishingFeatures,
        lostDate: new Date(data.lostDate).toISOString(),
      };

      const res = await createClaim(claimData);
      if (res.data?.success) {
        setIsClaimModalOpen(false);
        reset();
      } else {
      }
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" className="mb-4" />
          <p className="text-gray-400">Loading found item details...</p>
        </div>
      </div>
    );
  }

  // Extract the item data from API response
  const foundItemData = singleFoundItem?.data;
  const isOwner = !!(currentUser as any)?.id &&
    foundItemData?.user?.id === (currentUser as any)?.id;

  // Handle case where item is not found
  if (!foundItemData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="glass-card rounded-xl p-8 md:p-10">
            <h2 className="text-lg font-semibold gold-text mb-3">Item Not Found</h2>
            <p className="text-gray-400 text-sm mb-6">
              The item you're looking for doesn't exist or may have been removed.
            </p>
            <Link
              to="/found-items"
              className="inline-flex items-center px-5 py-2.5 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
            >
              <FaArrowLeft className="mr-2" />
              Back to Found Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Header with Back Button */}
        <div className="bg-gray-900 border-b border-gray-700/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Link
              to="/found-items"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors duration-200 text-sm mb-3"
            >
              <FaArrowLeft className="mr-1.5" />
              Back to Found Items
            </Link>
            <h1 className="text-xl font-semibold gold-text">
              {foundItemData?.foundItemName || "Found Item"}
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-6">
              <div className="relative">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    src={foundItemData?.img}
                    alt={foundItemData?.foundItemName}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/bgimg.png";
                    }}
                  />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {foundItemData?.isClaimed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-yellow-900/60 text-yellow-300 border border-yellow-600/50 shadow-[0_0_8px_rgba(202,138,4,0.25)]">
                      Claimed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                      Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-8">
              {/* Description */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Description</h2>
                <p className="text-gray-200 leading-relaxed text-sm">
                  {foundItemData?.description ||
                    "No description available for this item."}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-center text-gray-400 mb-1.5 gap-2">
                    <FaCalendarAlt className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Date Found</span>
                  </div>
                  <p className="text-gray-200 text-sm">
                    {formatDate(foundItemData?.date) || "Date not specified"}
                  </p>
                </div>

                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-center text-gray-400 mb-1.5 gap-2">
                    <FaMapMarkerAlt className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Location</span>
                  </div>
                  <p className="text-gray-200 text-sm">
                    {foundItemData?.location || "Location not specified"}
                  </p>
                </div>

                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-center text-gray-400 mb-1.5 gap-2">
                    <FaTag className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Category</span>
                  </div>
                  <p className="text-gray-200 text-sm">
                    {foundItemData?.category?.name || "Uncategorized"}
                  </p>
                </div>

                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-center text-gray-400 mb-1.5 gap-2">
                    <FaUser className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wide">Reported By</span>
                  </div>
                  <p className="text-gray-200 text-sm">
                    {foundItemData?.user?.name || foundItemData?.user?.email || "Anonymous"}
                  </p>
                </div>
              </div>

              {/* Claim Process Information */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  How to Claim
                </h3>
                <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                  {foundItemData?.claimProcess ||
                    "To claim this item, provide the date you lost it and any distinguishing features that can help verify ownership."}
                </p>

                {foundItemData?.isClaimed ? (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-center">
                    <p className="text-yellow-400 text-sm font-medium">
                      This item has already been claimed.
                    </p>
                  </div>
                ) : isOwner ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      disabled
                      className="flex-1 bg-gray-700/60 text-gray-400 font-semibold py-3 px-4 rounded-lg cursor-not-allowed text-sm border border-gray-600/40"
                    >
                      Owner View: You reported this item
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-800 text-red-400 hover:bg-red-900/30 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                      Edit Post
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleClaimModal}
                    title={!isLoggedIn ? "Sign in to perform this action" : undefined}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 focus:ring-offset-gray-900 ${isLoggedIn
                      ? "bg-red-800 hover:bg-red-700 text-white"
                      : "bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 border border-gray-600/50"
                      }`}
                  >
                    {!isLoggedIn && <FaLock className="w-3.5 h-3.5 text-gray-400" />}
                    {isLoggedIn ? "Submit a Claim" : "Sign in to Claim"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Found Item Modal */}
      {isEditModalOpen && foundItemData && (
        <EditFoundItemModal
          item={foundItemData}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Custom Claim Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div ref={claimModalRef} className="relative w-full max-w-md glass-card rounded-xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold gold-text">Claim Process</h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
                aria-label="Close modal"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-300 mb-6 text-sm">
                Please provide the following information to verify your
                ownership of this item.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <FormField<CreateClaimValues> name="lostDate" label="When did you lose this item?" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <input
                      id={id}
                      type="date"
                      aria-invalid={hasError ? "true" : undefined}
                      aria-describedby={ariaDescribedBy}
                      aria-required="true"
                      {...register("lostDate")}
                      className={`w-full p-3 bg-gray-800/50 border ${hasError ? "border-red-600/70" : "border-red-900/40 hover:border-red-800/60"} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200`}
                    />
                  )}
                </FormField>

                <FormField<CreateClaimValues> name="distinguishingFeatures" label="Distinguishing Features" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <textarea
                      id={id}
                      rows={4}
                      aria-invalid={hasError ? "true" : undefined}
                      aria-describedby={ariaDescribedBy}
                      aria-required="true"
                      placeholder="Describe unique features, colors, brands, scratches, or any other identifying characteristics..."
                      {...register("distinguishingFeatures")}
                      className={`w-full p-3 bg-gray-800/50 border ${hasError ? "border-red-600/70" : "border-red-900/40 hover:border-red-800/60"} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 resize-none`}
                    />
                  )}
                </FormField>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="flex-1 px-4 py-3 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <PupButton type="submit" disabled={isSubmitting || claimLoading} className="flex-1 px-4 py-3">
                    {isSubmitting || claimLoading ? (
                      <div className="flex items-center justify-center">
                        <Spinner size="sm" className="mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      "Submit Claim"
                    )}
                  </PupButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleFoundItem;

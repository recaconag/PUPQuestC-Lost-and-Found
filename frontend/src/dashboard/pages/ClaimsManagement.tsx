import { useState, useEffect } from "react";
import { FaEye, FaSearch, FaCheck, FaTimes, FaQrcode } from "react-icons/fa";
import {
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useGenerateClaimQRMutation,
} from "../../redux/api/api";
import ConfirmDialog from "../../components/modal/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import { formatDate } from "../../utils/formatDate";

const ClaimsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [claimForDetail, setClaimForDetail] = useState<any>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: allClaims, isLoading } = useGetAllClaimsQuery({ page, limit, search: debouncedSearch });
  const [updateClaimStatus, { isLoading: isStatusLoading }] = useUpdateClaimStatusMutation();
  const [generateClaimQR, { isLoading: isQrGenerating }] = useGenerateClaimQRMutation();

  const allFetchedClaims = allClaims?.data || [];
  // Apply client-side status filter
  const claims = statusFilter === "ALL"
    ? allFetchedClaims
    : allFetchedClaims.filter((claim: any) => claim.status === statusFilter);
  const pagination = allClaims?.meta;

  const handleBulkApprove = async () => {
    const pendingClaims = claims.filter(
      (claim: any) => claim.status === "PENDING"
    );
    if (pendingClaims.length === 0) {
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to approve ${pendingClaims.length} pending claims?`
      )
    ) {
      try {
        const promises = pendingClaims.map((claim: any) =>
          updateClaimStatus({
            claimId: claim.id,
            status: "APPROVED",
          }).unwrap()
        );
        await Promise.all(promises);
      } catch {
      }
    }
  };

  const handleStatusConfirm = async () => {
    if (!selectedClaim || !newStatus) return;
    setStatusError(null);
    try {
      await updateClaimStatus({
        claimId: selectedClaim.id,
        status: newStatus,
      }).unwrap();
      setIsStatusModalOpen(false);
      setSelectedClaim(null);
      setNewStatus("");
    } catch (err: any) {
      setStatusError(err?.data?.message ?? "Failed to update status. Please try again.");
    }
  };

  const handleStatusCancel = () => {
    setIsStatusModalOpen(false);
    setSelectedClaim(null);
    setNewStatus("");
    setStatusError(null);
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      const result = await generateClaimQR(claimId).unwrap();
      if (result?.data?.qrCodeImage) {
        setQrCodeImage(result.data.qrCodeImage);
        setIsQrModalOpen(true);
      }
    } catch (err: any) {
      setStatusError(err?.data?.message ?? "Failed to generate QR code. Please try again.");
    }
  };

  const handleRejectClaim = (claimId: string) => {
    setClaimToReject(claimId);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!claimToReject) return;
    setIsRejectDialogOpen(false);
    try {
      await updateClaimStatus({ claimId: claimToReject, status: "REJECTED" }).unwrap();
    } catch (err: any) {
      setStatusError(err?.data?.message ?? "Failed to reject claim. Please try again.");
    } finally {
      setClaimToReject(null);
    }
  };

  const handleRejectCancel = () => {
    setIsRejectDialogOpen(false);
    setClaimToReject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-900/50 text-yellow-300 border border-yellow-600/50 shadow-[0_0_8px_rgba(202,138,4,0.2)]";
      case "APPROVED":
        return "bg-emerald-900/40 text-emerald-300 border border-emerald-600/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
      case "REJECTED":
        return "bg-red-900/40 text-red-300 border border-red-700/40";
      case "CLAIMED":
        return "bg-blue-900/40 text-blue-300 border border-blue-700/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]";
      default:
        return "bg-gray-700/50 text-gray-300 border border-gray-600/40";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            Claims Management
          </h1>
          <p className="text-gray-400 mt-1">Review and manage item claims</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBulkApprove}
            className="inline-flex items-center px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-all duration-200 shadow-md border border-red-600/50"
          >
            <FaCheck className="mr-2" />
            Bulk/All Approve Pending
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Claims</p>
              <p className="text-2xl font-bold text-white">{claims.length}</p>
            </div>
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/30">
              <FaEye className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                {
                  claims.filter((claim: any) => claim.status === "PENDING")
                    .length
                }
              </p>
            </div>
            <div className="bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/30">
              <FaSearch className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-500">
                {
                  claims.filter((claim: any) => claim.status === "APPROVED")
                    .length
                }
              </p>
            </div>
            <div className="bg-green-900/40 p-3 rounded-lg border border-green-700/30">
              <FaCheck className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-500">
                {
                  claims.filter((claim: any) => claim.status === "REJECTED")
                    .length
                }
              </p>
            </div>
            <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
              <FaTimes className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLAIMED">Claimed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/70 border-b border-yellow-700/15">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Found Item
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Category
                </th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Proof Details
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Claimant
                </th>
                <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Lost Date
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {claims.map((claim: any) => (
                <tr
                  key={claim.id}
                  className="hover:bg-yellow-900/10 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={claim.foundItem?.img || "/default-item.png"}
                        alt={claim.foundItem?.foundItemName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setClaimForDetail(claim);
                          setDetailModalOpen(true);
                        }}
                        loading="lazy"
                      />
                      <div>
                        <div 
                          className="font-medium text-white text-sm sm:text-base cursor-pointer hover:text-yellow-500 transition-colors"
                          onClick={() => {
                            setClaimForDetail(claim);
                            setDetailModalOpen(true);
                          }}
                        >
                          {claim.foundItem?.foundItemName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 truncate max-w-[150px] sm:max-w-xs">
                          {claim.foundItem?.description}
                        </div>
                        <button 
                          onClick={() => {
                            setClaimForDetail(claim);
                            setDetailModalOpen(true);
                          }}
                          className="text-xs text-yellow-500 hover:text-yellow-400 underline mt-1 block md:hidden font-medium"
                        >
                          View Proof Details
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {claim.foundItem?.category?.name}
                    </span>
                  </td>
                  <td 
                    className="hidden md:table-cell px-6 py-4 cursor-pointer hover:bg-yellow-900/20 transition-all rounded-lg"
                    onClick={() => {
                      setClaimForDetail(claim);
                      setDetailModalOpen(true);
                    }}
                    title="Click to view full proof details"
                  >
                    <div className="max-w-xs">
                      <div className="text-white text-sm font-medium mb-1 flex items-center gap-1.5 hover:text-yellow-500 transition-colors">
                        Proof Details:
                        <FaEye className="text-xs text-gray-400" />
                      </div>
                      <div className="text-gray-400 text-sm line-clamp-2">
                        {claim.distinguishingFeatures || "No proof provided"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <div className="text-white text-sm">
                        {claim.user?.name || claim.user?.email}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {claim.user?.email}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-gray-300">
                    {formatDate(claim.lostDate)}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      {claim.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            disabled={isQrGenerating}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve claim and generate QR code"
                          >
                            <FaCheck className="mr-1" />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            disabled={isStatusLoading}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject this claim"
                          >
                            <FaTimes className="mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </>
                      )}
                      {claim.status === "APPROVED" && (
                        <button
                          onClick={() => handleApproveClaim(claim.id)}
                          disabled={isQrGenerating}
                          className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Regenerate QR code for this claim"
                        >
                          <FaQrcode className="mr-1" />
                          <span className="hidden sm:inline">Regenerate QR</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {claims.length === 0 && (
          <EmptyState
            icon={<FaSearch className="w-full h-full" />}
            title="No Claims Found"
            description={
              debouncedSearch
                ? "No claims match your search criteria. Try adjusting your search terms."
                : "No claims have been submitted yet. Claims will appear here when users report found items."
            }
            action={
              debouncedSearch ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Clear Search
                </button>
              ) : null
            }
          />
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} claims
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPage}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPage, p + 1))}
                disabled={pagination.page === pagination.totalPage}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaCheck className="text-blue-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold gold-text mb-2">
                  Change Claim Status
                </h2>
                <p className="text-gray-400 mb-4">
                  Are you sure you want to change the status of this claim?
                </p>
              </div>

              {selectedClaim && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={selectedClaim.foundItem?.img || "/default-item.png"}
                      alt={selectedClaim.foundItem?.foundItemName}
                      className="w-12 h-12 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div>
                      <h3 className="font-medium gold-text">
                        {selectedClaim.foundItem?.foundItemName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {selectedClaim.foundItem?.category?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Current Status:
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                          selectedClaim.status
                        )}`}
                      >
                        {selectedClaim.status}
                      </span>
                    </span>
                    <span className="text-sm text-gray-400">
                      New Status:
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                          newStatus
                        )}`}
                      >
                        {newStatus}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {statusError && (
                <div className="mb-4 px-4 py-2.5 bg-red-900/40 border border-red-600/50 rounded-lg text-sm text-red-300 text-left">
                  {statusError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleStatusCancel}
                  disabled={isStatusLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusConfirm}
                  disabled={isStatusLoading || !selectedClaim?.id}
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center border border-red-600/50"
                >
                  {isStatusLoading ? (
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
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && qrCodeImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl p-8 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mb-6">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaQrcode className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold gold-text mb-2">
                  Claim Approved - QR Code Generated
                </h2>
                <p className="text-gray-400 mb-6">
                  Share this QR code with the claimant. They will need to present it at the property office for item pickup.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 mb-6">
                <img
                  src={qrCodeImage}
                  alt="Claim QR Code"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsQrModalOpen(false);
                    setQrCodeImage(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeImage;
                    link.download = `claim-qr-${selectedClaim?.id}.png`;
                    link.click();
                  }}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium border border-red-600/50"
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRejectDialogOpen}
        onClose={handleRejectCancel}
        onConfirm={handleRejectConfirm}
        title="Reject Claim"
        message="Are you sure you want to reject this claim? This action cannot be undone."
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
        isLoading={isStatusLoading}
      />

      {/* Proof Details Modal */}
      {detailModalOpen && claimForDetail && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-card rounded-xl p-6 w-full max-w-lg mx-4 border border-yellow-700/20 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                  Claim Distinguishing Features
                </h2>
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setClaimForDetail(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                  <img
                    src={claimForDetail.foundItem?.img || "/default-item.png"}
                    alt={claimForDetail.foundItem?.foundItemName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {claimForDetail.foundItem?.foundItemName}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Category: {claimForDetail.foundItem?.category?.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm bg-gray-900/30 p-3 rounded-lg">
                  <div>
                    <p className="text-gray-500 font-medium">Claimant</p>
                    <p className="text-white font-medium">{claimForDetail.user?.name || claimForDetail.user?.email}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{claimForDetail.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Lost Date</p>
                    <p className="text-white font-medium">{formatDate(claimForDetail.lostDate)}</p>
                    <p className="text-xs text-gray-400">Claim Status: {claimForDetail.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-yellow-500/80 mb-2">
                    Submitted Distinguishing Features / Proof Details:
                  </h4>
                  <div className="bg-gray-950/60 border border-yellow-700/10 rounded-lg p-4 text-white text-sm whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                    {claimForDetail.distinguishingFeatures || "No distinguishing features or proof details were provided for this claim request."}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setClaimForDetail(null);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-sm font-medium rounded-lg transition-all shadow-md border border-red-600/50"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsManagement;

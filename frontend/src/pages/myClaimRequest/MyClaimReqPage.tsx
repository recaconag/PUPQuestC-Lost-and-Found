import { useMyClaimsQuery, useGenerateClaimQRMutation } from "../../redux/api/api";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaTimes,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaQrcode,
} from "react-icons/fa";
import { formatDate } from "../../utils/formatDate";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const MyClaimReqPage = () => {
  const { data: myClaims, isLoading } = useMyClaimsQuery({});

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLoadError, setQrLoadError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  const qrModalRef = useFocusTrap(isQrModalOpen);

  const [generateClaimQR] = useGenerateClaimQRMutation();

  // Get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <FaClock className="w-4 h-4" />,
          color: "from-yellow-500 to-yellow-600",
          bgColor: "bg-yellow-900/30 border-yellow-500/50",
          textColor: "text-yellow-300",
          label: "Pending",
        };
      case "APPROVED":
      case "ACCEPTED":
        return {
          icon: <FaCheckCircle className="w-4 h-4" />,
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-900/30 border-green-500/50",
          textColor: "text-green-300",
          label: "Approved",
        };
      case "CLAIMED":
        return {
          icon: <FaCheckCircle className="w-4 h-4" />,
          color: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-900/30 border-blue-500/50",
          textColor: "text-blue-300",
          label: "Claimed / Returned",
        };
      case "REJECTED":
        return {
          icon: <FaTimesCircle className="w-4 h-4" />,
          color: "from-red-500 to-red-600",
          bgColor: "bg-red-900/30 border-red-500/50",
          textColor: "text-red-300",
          label: "Rejected",
        };
      default:
        return {
          icon: <FaClock className="w-4 h-4" />,
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-gray-900/30 border-gray-500/50",
          textColor: "text-gray-300",
          label: "Unknown",
        };
    }
  };

  // Filter and sort claims
  const filteredAndSortedClaims = useMemo(() => {
    if (!myClaims?.data) return [];

    let filtered = myClaims.data.filter((claim: any) => {
      const matchesSearch =
        searchTerm === "" ||
        claim?.foundItem?.foundItemName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        claim?.foundItem?.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        claim?.foundItem?.location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || claim?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort claims
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case "foundItemName":
          aValue = a?.foundItem?.foundItemName?.toLowerCase() || "";
          bValue = b?.foundItem?.foundItemName?.toLowerCase() || "";
          break;
        case "status":
          aValue = a?.status || "";
          bValue = b?.status || "";
          break;
        default:
          aValue = a?.createdAt || "";
          bValue = b?.createdAt || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [myClaims?.data, searchTerm, statusFilter, sortBy, sortOrder]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleViewQRCode = async (claim: any) => {
    setQrLoadError(null);
    setQrCodeImage(null);
    setIsQrModalOpen(true);
    setIsQrLoading(true);
    try {
      const result = await generateClaimQR(claim.id).unwrap();
      if (result?.data?.qrCodeImage) {
        setQrCodeImage(result.data.qrCodeImage);
      } else {
        setQrLoadError("QR code could not be retrieved.");
      }
    } catch (err: any) {
      setQrLoadError(err?.data?.message ?? "Failed to load QR code. Please try again.");
    } finally {
      setIsQrLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        {/* Loading skeletons */}
        <div className="glass-panel">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg mb-6 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-8 max-w-md mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filter skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 h-12 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-48 h-12 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/80 rounded-2xl p-6 animate-pulse shadow-xl border border-gray-700"
              >
                <div className="h-48 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl mb-4"></div>
                <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-3"></div>
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section */}
      <div className="glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent mb-6">
              My Claims
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track the status of your item claims and view detailed information
              about each request.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900/80 rounded-2xl p-6 shadow-xl border border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item name, description, or location..."
                className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 focus:border-yellow-500 transition-all duration-200"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-4 py-3 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 focus:border-yellow-500 transition-all duration-200"
              >
                <option value="createdAt-desc">Latest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="foundItemName-asc">Item Name (A-Z)</option>
                <option value="foundItemName-desc">Item Name (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="status-desc">Status (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-300">
            {filteredAndSortedClaims.length > 0 ? (
              <span>
                Showing {filteredAndSortedClaims.length} claim
                {filteredAndSortedClaims.length !== 1 ? "s" : ""}
                {searchTerm && (
                  <span className="ml-2 text-cyan-400">for "{searchTerm}"</span>
                )}
                {statusFilter !== "ALL" && (
                  <span className="ml-2 text-cyan-400">
                    with status "{statusFilter}"
                  </span>
                )}
              </span>
            ) : (
              <span>No claims found</span>
            )}
          </div>
        </div>

        {/* Claims Table */}
        {filteredAndSortedClaims.length === 0 ? (
          <div className="text-center py-16">
            <div className="glass-card rounded-2xl p-8 md:p-10 max-w-md mx-auto">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-bold gold-text mb-4">
                No Claims Found
              </h3>
              <p className="text-gray-300 mb-6">
                {searchTerm || statusFilter !== "ALL"
                  ? "No claims match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't submitted any claims yet. Browse found items and claim your lost belongings!"}
              </p>
              {(searchTerm || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 mr-4 border border-gray-700/60"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/found-items"
                className="inline-block px-6 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold rounded-lg transition-all duration-200 shadow-md border border-red-600/50"
              >
                Browse Found Items
              </Link>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/60 border-b border-yellow-700/15">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Found By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Claim Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAndSortedClaims.map((claim: any) => {
                    const statusConfig = getStatusConfig(claim?.status);

                    return (
                      <tr
                        key={claim.id}
                        className="hover:bg-yellow-900/10 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12 mr-4">
                              <img
                                className="w-12 h-12 rounded-lg object-cover"
                                src={claim?.foundItem?.img}
                                alt={claim?.foundItem?.foundItemName}
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/bgimg.png";
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {claim?.foundItem?.foundItemName}
                              </div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {claim?.foundItem?.description ||
                                  "No description provided."}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${statusConfig.color} text-white shadow-lg`}
                          >
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-gray-400" />
                            <span className="truncate max-w-xs">
                              {claim?.foundItem?.location ||
                                "Location not specified"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center">
                            <FaUser className="mr-2 text-gray-400" />
                            <span>
                              {claim?.foundItem?.user?.name || claim?.foundItem?.user?.email || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-400" />
                            <span>
                              {formatDate(claim?.createdAt) || "Date not available"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link to={`/found-items/${claim?.foundItem?.id}`}>
                              <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl border border-red-600/50">
                                <FaEye className="mr-2" />
                                View Details
                              </button>
                            </Link>
                            {(claim?.status === "APPROVED" || claim?.status === "CLAIMED") && (
                              <button
                                onClick={() => handleViewQRCode(claim)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl border border-blue-600/50"
                              >
                                <FaQrcode className="mr-2" />
                                View QR
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={qrModalRef} className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mb-6">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaQrcode className="text-green-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold gold-text mb-2">
                  Your Claim QR Code
                </h2>
                <p className="text-gray-400 mb-4">
                  Present this QR code at the property office to claim your item.
                </p>
              </div>

              {isQrLoading ? (
                <div className="bg-gray-700 rounded-lg p-10 mb-6 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                  <p className="text-gray-300 text-sm">Loading QR code...</p>
                </div>
              ) : qrLoadError ? (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-6 mb-6">
                  <p className="text-red-300 text-sm">{qrLoadError}</p>
                </div>
              ) : qrCodeImage ? (
                <div className="bg-white rounded-lg p-6 mb-6">
                  <img
                    src={qrCodeImage}
                    alt="Claim QR Code"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <p className="text-gray-300">QR code will be generated by the admin upon approval.</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsQrModalOpen(false);
                  setQrCodeImage(null);
                  setQrLoadError(null);
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyClaimReqPage;

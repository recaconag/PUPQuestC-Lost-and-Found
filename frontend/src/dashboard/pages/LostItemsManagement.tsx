import { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  useDeleteMyLostItemMutation,
  useMarkLostItemAsFoundMutation,
  useEditMyLostItemMutation,
  useCategoryQuery,
  useApproveLostItemMutation,
  useGetAllLostItemsAdminQuery,
} from "../../redux/api/api";
import EmptyState from "../../components/shared/EmptyState";
import { IoMdRadioButtonOn } from "react-icons/io";
import { formatDate } from "../../utils/formatDate";
interface LostItem {
  id: string;
  lostItemName: string;
  description: string;
  category: { id: string; name: string };
  location: string;
  date: string;
  isFound: boolean;
  approvalStatus: string;
  isExpired: boolean;
  img?: string;
  user: { name: string; email?: string };
}

const LostItemsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LostItem | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [markingAsFoundId, setMarkingAsFoundId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<LostItem | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    lostItemName: "",
    description: "",
    location: "",
    date: "",
    categoryId: "",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: lostItemsData,
    isLoading,
    error,
  } = useGetAllLostItemsAdminQuery({ page, limit, search: debouncedSearch });

  const { data: categoriesData } = useCategoryQuery({});
  const [deleteMyLostItem] = useDeleteMyLostItemMutation();
  const [markAsFound] = useMarkLostItemAsFoundMutation();
  const [editMyLostItem] = useEditMyLostItemMutation();
  const [approveLostItem] = useApproveLostItemMutation();
  const handleEdit = (item: LostItem) => {
    setEditingItem(item);
    setEditFormData({
      lostItemName: item.lostItemName,
      description: item.description,
      location: item.location,
      date: new Date(item.date).toISOString().split("T")[0],
      categoryId: item.category?.id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsEditLoading(true);
    try {
      await editMyLostItem({
        id: editingItem.id,
        ...editFormData,
        date: new Date(editFormData.date).toISOString(),
      }).unwrap();
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: LostItem) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleteLoading(true);
    try {
      await deleteMyLostItem(deletingItem.id).unwrap();
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (error) {
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    setIsDeleteLoading(false);
  };

  const handleMarkAsFound = async (id: string, currentStatus: boolean) => {
    setMarkingAsFoundId(id);
    try {
      await markAsFound({ id }).unwrap();
    } catch (error) {
    } finally {
      setMarkingAsFoundId(null);
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">
            Error loading lost items. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const items = lostItemsData?.data || [];
  const pagination = lostItemsData?.meta;

  const pendingCount = items.filter((i: LostItem) => i.approvalStatus === "PENDING").length;

  const getStatusBadge = (item: LostItem) => {
    if (item.approvalStatus === "PENDING") return <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">Pending</span>;
    if (item.isExpired) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">Expired</span>;
    if (item.isFound) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">Found</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">Active</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            Lost Items Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage all lost item reports in the system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Reports", value: items.length, color: "text-white", bg: "bg-red-900/40 border-red-700/30", icon: <FaEye className="text-white" /> },
          { label: "Active", value: items.filter((i: LostItem) => !i.isFound && i.approvalStatus === "PUBLISHED" && !i.isExpired).length, color: "text-red-400", bg: "bg-yellow-900/40 border-yellow-700/30", icon: <IoMdRadioButtonOn className="text-red-400" /> },
          { label: "Found", value: items.filter((i: LostItem) => i.isFound).length, color: "text-green-400", bg: "bg-green-900/40 border-green-700/30", icon: <FaCheck className="text-green-400" /> },
          { label: "Pending Approval", value: pendingCount, color: "text-orange-400", bg: "bg-orange-900/40 border-orange-700/30", icon: <FaEye className="text-orange-400" /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-400 text-sm">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
              <div className={`p-3 rounded-lg border ${bg}`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search lost items..."
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
              <option value="ACTIVE">Active</option>
              <option value="FOUND">Found</option>
              <option value="PENDING">Pending Approval</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/70 border-b border-yellow-700/15">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Item
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Date Lost
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Reported By
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item: LostItem) => (
                <tr
                  key={item.id}
                  className="hover:bg-yellow-900/10 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">
                        {item.lostItemName}
                      </div>
                      <div className="text-sm text-gray-400 truncate max-w-xs">
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {item.category?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{item.location}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDate(item.date) || "No Date Reported"}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item)}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {item.user?.name || item.user?.email || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {item.approvalStatus === "PENDING" && (
                        <button
                          onClick={() => approveLostItem(item.id)}
                          title="Approve & Publish"
                          className="p-2 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleMarkAsFound(item.id, item.isFound)}
                        disabled={markingAsFoundId === item.id}
                        className={`p-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center ${item.isFound
                          ? "text-red-500 hover:bg-red-500 hover:text-white disabled:bg-red-400"
                          : "text-green-500 hover:bg-green-500 hover:text-white disabled:bg-green-400"
                          }`}
                        title={
                          item.isFound ? "Mark as Not Found" : "Mark as Found"
                        }
                      >
                        {markingAsFoundId === item.id ? (
                          <svg
                            className={`animate-spin h-4 w-4 ${item.isFound ? "text-red-500" : "text-green-500"
                              }`}
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
                        ) : item.isFound ? (
                          <FaTimes className="text-red-400" />
                        ) : (
                          <FaCheck className="text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <EmptyState
            icon={<FaSearch className="w-full h-full" />}
            title="No Lost Items Found"
            description={
              debouncedSearch
                ? "No lost items match your search criteria. Try adjusting your search terms."
                : "No lost items have been reported yet. Lost item reports will appear here when users submit them."
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold gold-text mb-4">
              Edit Lost Item
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editFormData.lostItemName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lostItemName: e.target.value,
                    })
                  }
                  disabled={isEditLoading}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  disabled={isEditLoading}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  disabled={isEditLoading}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Date Lost
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      date: e.target.value,
                    })
                  }
                  disabled={isEditLoading}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      categoryId: e.target.value,
                    })
                  }
                  disabled={isEditLoading}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select a category</option>
                  {categoriesData?.data?.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded-lg transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center border border-red-600/50 shadow-md"
                >
                  {isEditLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    "Update Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isEditLoading}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FaTrash className="text-red-600 text-xl" />
                </div>
                <h2 className="text-xl font-bold gold-text mb-2">
                  Delete Lost Item
                </h2>
                <p className="text-gray-400 mb-4">
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </p>
              </div>

              {deletingItem && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium gold-text mb-2">
                    {deletingItem.lostItemName}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {deletingItem.description}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Location: {deletingItem.location}</span>
                    <span>
                      Date: {formatDate(deletingItem.date)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  disabled={isDeleteLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isDeleteLoading ? (
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
                      Deleting...
                    </>
                  ) : (
                    "Delete Item"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostItemsManagement;

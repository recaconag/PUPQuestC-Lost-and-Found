import { useState, useEffect } from "react";
import { FaTrash, FaSearch, FaShieldAlt, FaUser, FaBan, FaCheckSquare, FaSquare } from "react-icons/fa";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
  useSoftDeleteUserMutation,
} from "../../redux/api/api";
import EmptyState from "../../components/shared/EmptyState";
import { formatDate } from "../../utils/formatDate";

interface ApiUser {
  id: string;
  name: string;
  email: string;
  activated: boolean;
  password: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  userImg: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: string;
  lastLogin?: string;
  itemsReported: number;
  claimsMade: number;
  profileImage?: string;
}

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: allUsersData, isLoading } = useGetAllUsersQuery({ page, limit, search: debouncedSearch });
  const [blockUser] = useBlockUserMutation();
  const [changeUserRole] = useChangeUserRoleMutation();
  const [softDeleteUser] = useSoftDeleteUserMutation();

  // Transform API user data to match our interface
  const transformUser = (apiUser: ApiUser): User => ({
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.activated ? "ACTIVE" : "SUSPENDED",
    createdAt: apiUser.createdAt,
    lastLogin: undefined,
    itemsReported: 0,
    claimsMade: 0,
    profileImage: apiUser.userImg || undefined,
  });

  const users = allUsersData?.data ? allUsersData.data.map(transformUser) : [];
  const pagination = allUsersData?.meta;

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await changeUserRole({ id, role: newRole }).unwrap();
    } catch (error) {
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === "SUSPENDED") {
        await blockUser(id).unwrap();
      } else if (newStatus === "ACTIVE") {
        await blockUser(id).unwrap();
      } else {
      }
    } catch (error) {
    }
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setIsDeleteLoading(true);
    try {
      await softDeleteUser(deletingUser.id).unwrap();
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
    } catch (error) {
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
    setIsDeleteLoading(false);
  };

  const handleSelectItem = (userId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === users.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(users.map((user: User) => user.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} user(s)?`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const promises = Array.from(selectedItems).map(id => softDeleteUser(id).unwrap());
      await Promise.all(promises);
      setSelectedItems(new Set());
    } catch (error) {
      console.error("[UsersManagement] Bulk delete failed:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500";
      case "USER":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "SUSPENDED":
        return "bg-yellow-500";
      case "BANNED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <FaShieldAlt className="text-red-500" />;
      case "USER":
        return <FaUser className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
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
            User Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage verified users and permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/30">
              <FaUser className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-green-500">
                {users.filter((user: User) => user.status === "ACTIVE").length}
              </p>
            </div>
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/30">
              <FaUser className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Admins</p>
              <p className="text-2xl font-bold text-red-500">
                {users.filter((user: User) => user.role === "ADMIN").length}
              </p>
            </div>
            <div className="bg-blue-900/40 p-3 rounded-lg border border-blue-700/30">
              <FaShieldAlt className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Suspended by Admin</p>
              <p className="text-2xl font-bold text-yellow-500">
                {
                  users.filter((user: User) => user.status === "SUSPENDED")
                    .length
                }
              </p>
            </div>
            <div className="bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/30">
              <FaBan className="text-white" />
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/70"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && (
          <div className="bg-gray-800/50 border-b border-yellow-700/20 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-300">
              {selectedItems.size} user{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTrash className="mr-1" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/70 border-b border-yellow-700/15">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                    title={selectedItems.size === users.length ? "Deselect all" : "Select all"}
                  >
                    {selectedItems.size === users.length && users.length > 0 ? (
                      <FaCheckSquare className="w-4 h-4" />
                    ) : (
                      <FaSquare className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  User
                </th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Status
                </th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user: User) => (
                <tr
                  key={user.id}
                  className="hover:bg-yellow-900/10 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <button
                      onClick={() => handleSelectItem(user.id)}
                      className="hover:text-yellow-400 transition-colors"
                      title={selectedItems.has(user.id) ? "Deselect" : "Select"}
                    >
                      {selectedItems.has(user.id) ? (
                        <FaCheckSquare className="w-4 h-4" />
                      ) : (
                        <FaSquare className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(user.role)}
                      <div>
                        <div className="font-medium text-white text-sm sm:text-base">
                          {user.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity ${getRoleColor(
                        user.role
                      )}`}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleStatusChange(user.id, e.target.value)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                        user.status
                      )}`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-gray-300">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1.5 sm:p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                        title="Delete User"
                        aria-label="Delete User"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <EmptyState
            icon={<FaUser className="w-full h-full" />}
            title="No Users Found"
            description={
              debouncedSearch
                ? "No users match your search criteria. Try adjusting your search terms."
                : "No users have registered yet. Users will appear here when they sign up."
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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
                  Delete User
                </h2>
                <p className="text-gray-400 mb-4">
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </p>
              </div>

              {deletingUser && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center space-x-3 mb-2">
                    {getRoleIcon(deletingUser.role)}
                    <div>
                      <h3 className="font-medium gold-text">
                        {deletingUser.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {deletingUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Role: {deletingUser.role}</span>
                    <span>Status: {deletingUser.status}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Joined: {formatDate(deletingUser.createdAt)}
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
                  className="flex-1 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center border border-red-600/50"
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
                    "Delete User"
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

export default UsersManagement;

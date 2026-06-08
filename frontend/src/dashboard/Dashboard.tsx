import {
  FaUsers,
  FaBoxOpen,
  FaClipboardList,
  FaExclamationTriangle,
  FaChartLine,
} from "react-icons/fa";
import { useAdminStatsQuery, useGetRecentActivityQuery } from "../redux/api/api";
import { Link } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";

const Dashboard = () => {
  const { data: adminStats, isLoading } = useAdminStatsQuery({});
  const { data: activityData, isLoading: activityLoading } = useGetRecentActivityQuery({});
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          {/* Welcome Section Skeleton */}
          <div className="bg-gray-700 rounded-2xl h-32 mb-6"></div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-700 rounded-xl h-24"></div>
            ))}
          </div>

          {/* Recent Activity Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Feed Skeleton */}
            <div className="bg-gray-700 rounded-2xl p-6">
              <div className="h-6 bg-gray-600 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start space-x-3 p-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-600 rounded-full w-16"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="bg-gray-700 rounded-2xl p-6">
              <div className="h-6 bg-gray-600 rounded w-1/3 mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-600 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const recentActivity: any[] = activityData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 border border-yellow-600/20 shadow-[0_4px_20px_rgba(128,0,0,0.5)] rounded-2xl p-8 text-white relative overflow-hidden">
        <h1 className="text-2xl font-bold mb-2 gold-text">
          Welcome back to the Dashboard!
        </h1>
        <p className="text-yellow-100/80 font-medium">
          Here's what's happening with your lost and found system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Found Items</p>
              <p className="text-2xl font-bold text-white">
                {adminStats?.data?.foundItems || "0"}
              </p>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/30 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
              <FaBoxOpen className="text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Lost Items</p>
              <p className="text-2xl font-bold text-red-400">
                {adminStats?.data?.lostItems || "0"}
              </p>
            </div>
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/30 shadow-[0_0_12px_rgba(128,0,0,0.35)]">
              <FaExclamationTriangle className="text-red-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Claims</p>
              <p className="text-2xl font-bold text-yellow-400">
                {adminStats?.data?.pendingClaims || "0"}
              </p>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/30 shadow-[0_0_12px_rgba(234,179,8,0.25)]">
              <FaClipboardList className="text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-emerald-400">
                {adminStats?.data?.totalUsers || "0"}
              </p>
            </div>
            <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-700/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <FaUsers className="text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold gold-text">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {activityLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-gray-600 mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-600 rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-gray-600 rounded-full w-16" />
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <EmptyState
                icon={<FaChartLine className="w-full h-full" />}
                title="No Recent Activity"
                description="No recent activity has been recorded yet. Activity will appear here as users interact with the system."
              />
            ) : (
              recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.type === "found"
                      ? "bg-yellow-500"
                      : activity.type === "claim"
                        ? "bg-yellow-400"
                        : activity.type === "lost"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {activity.title}
                    </p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${activity.status === "new"
                      ? "bg-yellow-900/50 text-yellow-300"
                      : activity.status === "pending"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : activity.status === "active"
                          ? "bg-red-900/50 text-red-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold gold-text mb-6">Quick Actions</h2>

          <div className="space-y-3">
            <Link to="/dashboard/categories">
              <button className="w-full group flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700/50 hover:border-yellow-600/50 hover:bg-yellow-900/10 transition-all duration-200 rounded-xl text-white font-medium shadow-sm">
                <span>Add New Category</span>
                <FaChartLine className="w-5 h-5 text-yellow-500 transition-transform" />
              </button>
            </Link>

            <Link to="/dashboard/users">
              <button className="w-full group flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700/50 hover:border-yellow-600/50 hover:bg-yellow-900/10 transition-all duration-200 rounded-xl text-white font-medium shadow-sm">
                <span>Manage Users</span>
                <FaUsers className="w-5 h-5 text-yellow-500 transition-transform" />
              </button>
            </Link>

            <Link to="/dashboard/settings">
              <button className="w-full group flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700/50 hover:border-yellow-600/50 hover:bg-yellow-900/10 transition-all duration-200 rounded-xl text-white font-medium shadow-sm">
                <span>Settings</span>
                <FaBoxOpen className="w-5 h-5 text-yellow-500 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

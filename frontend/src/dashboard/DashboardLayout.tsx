import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import pupquestcFavicon from "../assets/logo/pupquestc-favicon.ico";
import {
  FaTachometerAlt,
  FaSearch,
  FaClipboardList,
  FaUsers,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCog,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaSignOutAlt,
  FaUser,
  FaList,
  FaQrcode,
} from "react-icons/fa";
import { useUserVerification, signOut } from "../auth/auth";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const user = useUserVerification() as any;
  const { t } = useTranslation();

  const menuItems = [
    {
      title: t("sidebar.dashboard"),
      icon: <FaTachometerAlt />,
      path: "/dashboard",
      badge: null,
      adminOnly: true,
    },
    {
      title: t("sidebar.foundItems"),
      icon: <FaSearch />,
      path: "/dashboard/found-items",
      adminOnly: true,
      badge: null,
    },
    {
      title: t("sidebar.lostItems"),
      icon: <FaExclamationTriangle />,
      path: "/dashboard/lost-items",
      adminOnly: true,
      badge: null,
    },
    {
      title: t("sidebar.claims"),
      icon: <FaClipboardList />,
      path: "/dashboard/claims",
      adminOnly: true,
      badge: null,
    },
    {
      title: "QR Scanner",
      icon: <FaQrcode />,
      path: "/dashboard/qr-scanner",
      adminOnly: true,
      badge: null,
    },
    {
      title: t("sidebar.users"),
      icon: <FaUsers />,
      path: "/dashboard/users",
      badge: null,
      adminOnly: true,
    },
    {
      title: t("sidebar.categories"),
      icon: <FaBoxOpen />,
      path: "/dashboard/categories",
      badge: null,
      adminOnly: true,
    },
    {
      title: t("sidebar.myLostItems"),
      icon: <FaExclamationTriangle />,
      path: "/dashboard/myLostItems",
      badge: null,
      adminOnly: false,
    },
    {
      title: t("sidebar.myFoundItems"),
      icon: <FaBoxOpen />,
      path: "/dashboard/myFoundItems",
      badge: null,
      adminOnly: false,
    },
    {
      title: t("sidebar.myClaims"),
      icon: <FaClipboardList />,
      path: "/dashboard/myClaimRequest",
      badge: null,
      adminOnly: false,
    },
    {
      title: t("sidebar.settings"),
      icon: <FaCog />,
      path: "/dashboard/settings",
      badge: null,
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user?.role == "ADMIN"
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getPageTitle = () => {
    const sorted = [...menuItems].sort((a, b) => b.path.length - a.path.length);
    const match = sorted.find((item) => isActive(item.path));
    return match?.title ?? "Dashboard";
  };

  const handleSignOut = () => {
    signOut(navigate);
  };

  return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full glass-panel z-50 transition-all duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-yellow-700/20">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <img
                src={pupquestcFavicon}
                alt="PUPQuestC Logo"
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="font-bold text-lg gold-text">PUPQuestC</h1>
                <p className="text-gray-400 text-xs">
                  {user?.role === "ADMIN" ? "Admin Dashboard" : "Dashboard"}
                </p>
              </div>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-2"
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {filteredMenuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive(item.path)
                  ? "bg-red-900/20 text-yellow-500 border-l-[3px] border-yellow-500 animate-gold-pulse"
                  : "text-gray-400 hover:bg-gray-800/60 hover:text-white"
                  }`}
              >
                <div
                  className={`flex-shrink-0 ${sidebarCollapsed ? "mx-auto" : "mr-3"
                    }`}
                >
                  {item.icon}
                </div>

                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm border border-yellow-700/20 text-yellow-100 text-xs font-medium rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.title}
                    {item.badge && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 mx-3 border-t border-yellow-700/15"></div>

          {/* Quick Actions */}
          <div className="px-3 space-y-1">
            <Link
              to="/"
              className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 group relative"
            >
              <div
                className={`flex-shrink-0 ${sidebarCollapsed ? "mx-auto" : "mr-3"
                  }`}
              >
                <FaHome />
              </div>
              {!sidebarCollapsed && (
                <span className="font-medium">{t("sidebar.backToSite")}</span>
              )}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm border border-yellow-700/20 text-yellow-100 text-xs font-medium rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {t("sidebar.backToSite")}
                </div>
              )}
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 group relative"
              aria-label={t("sidebar.signOut")}
            >
              <div
                className={`flex-shrink-0 ${sidebarCollapsed ? "mx-auto" : "mr-3"
                  }`}
              >
                <FaSignOutAlt />
              </div>
              {!sidebarCollapsed && (
                <span className="font-medium">{t("sidebar.signOut")}</span>
              )}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm border border-yellow-700/20 text-yellow-100 text-xs font-medium rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {t("sidebar.signOut")}
                </div>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`w-full max-w-full lg:w-auto lg:max-w-none min-w-0 overflow-x-hidden transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
      >
        {/* Top Navbar */}
        <header className="glass-panel border-b border-yellow-600/10 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="Open menu"
            >
              <FaBars />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:ml-0 ml-4">
              <h1 className="text-xl font-semibold gold-text">
                {getPageTitle()}
              </h1>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-white text-sm font-medium">
                  {user?.name || "User"}
                </p>
                <p className="text-gray-400 text-xs">{user?.role || "USER"}</p>
              </div>

              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="relative group cursor-pointer">
                    {user?.userImg ? (
                      <img
                        src={user?.userImg}
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-gray-700/60 group-hover:border-yellow-500 transition-all duration-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center border-2 border-gray-700/60 group-hover:border-yellow-500 transition-all duration-200 shadow-lg">
                        <span className="text-white font-semibold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() ||
                            user?.email?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                }
                className="bg-gray-800 border border-gray-700 shadow-lg z-[9999]"
              >
                <DropdownHeader className="bg-gray-700/50">
                  <div className="flex items-center space-x-3 py-2">
                    {user?.userImg ? (
                      <img
                        src={user?.userImg}
                        alt="User"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {user?.name?.charAt(0)?.toUpperCase() ||
                            user?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="block text-white font-medium text-sm">
                        {user?.email ? user?.email : "User"}
                      </span>
                      <span className="block text-gray-400 text-xs">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </DropdownHeader>

                {user?.role === "ADMIN" && (
                  <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 w-full"
                    >
                      <FaTachometerAlt className="text-yellow-500" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownItem>
                )}

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center space-x-2 w-full"
                  >
                    <FaCog className="text-yellow-500" />
                    <span>{t("sidebar.settings")}</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link
                    to="/dashboard/myLostItems"
                    className="flex items-center space-x-2 w-full"
                  >
                    <FaList className="text-yellow-500" />
                    <span>{t("sidebar.myLostItems")}</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link
                    to="/dashboard/myFoundItems"
                    className="flex items-center space-x-2 w-full"
                  >
                    <FaSearch className="text-yellow-500" />
                    <span>{t("sidebar.myFoundItems")}</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link
                    to="/dashboard/myClaimRequest"
                    className="flex items-center space-x-2 w-full"
                  >
                    <FaUser className="text-yellow-500" />
                    <span>{t("sidebar.myClaims")}</span>
                  </Link>
                </DropdownItem>

                <DropdownItem className="hover:bg-gray-700 text-gray-300 hover:text-white">
                  <Link to="/" className="flex items-center space-x-2 w-full">
                    <FaHome className="text-yellow-500" />
                    <span>{t("sidebar.backToSite")}</span>
                  </Link>
                </DropdownItem>

                <DropdownDivider className="border-gray-700/60" />

                <DropdownItem
                  onClick={handleSignOut}
                  className="hover:bg-red-600 text-gray-300 hover:text-white"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <FaSignOutAlt className="text-red-500 group-hover:text-white transition-colors" />
                    <span>{t("sidebar.signOut")}</span>
                  </div>
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

    </div>
  );
};

export default DashboardLayout;

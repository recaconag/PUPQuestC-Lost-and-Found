import { signOut, useUserVerification } from "../../auth/auth";
import pupquestcFavicon from "../../assets/logo/pupquestc-favicon.ico";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import { PupNavLink } from "../../ui/PupNavLink";
import { ui } from "../../ui/tokens";
import {
  FaSearch,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaList,
  FaTachometerAlt,
} from "react-icons/fa";

export function Navbars() {
  const navigate = useNavigate();
  const users: any = useUserVerification();
  const { t } = useTranslation();

  const handleSignOut = () => {
    signOut(navigate);
  };

  const allNavItems = [
    { name: t("nav.home"), path: "/", requiresAuth: false },
    { name: t("nav.lostItems"), path: "/lostItems", requiresAuth: false },
    { name: t("nav.foundItems"), path: "/found-items", requiresAuth: false },
    { name: t("nav.aiSearch"), path: "/ai-search", requiresAuth: false },
    { name: t("nav.reportLost"), path: "/reportlostItem", requiresAuth: true },
    { name: t("nav.reportFound"), path: "/reportFoundItem", requiresAuth: true },
  ];

  const navItems = allNavItems.filter((item) => !item.requiresAuth || !!users);

  return (
    <Navbar
      fluid
      className="sticky top-0 z-50 glass-panel border-b border-yellow-600/10 bg-white/90 dark:bg-gray-900/90"
    >
      {/* BRAND */}
      <Link to="/" className="flex items-center">
        <NavbarBrand>
          <div className="flex items-center space-x-3">
            <img
              src={pupquestcFavicon}
              alt="PUPQuestC Logo"
              className="h-10 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <span className="text-xl font-bold gold-text">
                PUPQuestC
              </span>
              <p className="text-gray-600 dark:text-gray-400 text-xs">PUPQC Lost & Found</p>
            </div>
          </div>
        </NavbarBrand>
      </Link>

      {/* RIGHT SIDE */}
      <div className="flex items-center md:order-2">

        {users?.email ? (
          <div className="flex items-center space-x-3">

            {/* USER INFO */}
            <div className="hidden lg:block text-right">
              <p className="text-gray-900 dark:text-white text-sm font-medium">
                {users?.name || "User"}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {users?.role || "USER"}
              </p>
            </div>

            {/* DROPDOWN */}
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <div className="relative group cursor-pointer">
                  {users?.userImg ? (
                    <img
                      src={users?.userImg}
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-gray-700/60 group-hover:border-yellow-500 transition-all duration-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-red-700 to-red-900 rounded-full flex items-center justify-center border-2 border-gray-700/60 group-hover:border-yellow-500 transition-all duration-200 shadow-lg">
                      <span className="text-white font-semibold text-sm">
                        {users?.name?.charAt(0)?.toUpperCase() ||
                          users?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                </div>
              }
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              {/* HEADER */}
              <DropdownHeader className="bg-gray-100 dark:bg-gray-800/60">
                <div className="flex items-center space-x-3 py-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-700 to-red-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {users?.email?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-900 dark:text-white text-sm font-medium">
                      {users?.email || "User"}
                    </span>
                    <span className="block text-gray-600 dark:text-gray-400 text-xs">
                      {users?.role}
                    </span>
                  </div>
                </div>
              </DropdownHeader>

              {/* ADMIN */}
              {users?.role === "ADMIN" && (
                <DropdownItem className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Link to="/dashboard" className="flex items-center gap-2 w-full">
                    <FaTachometerAlt className="text-yellow-500" />
                    {t("nav.dashboard")}
                  </Link>
                </DropdownItem>
              )}

              {/* LINKS */}
              <DropdownItem className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Link to="/dashboard/settings" className="flex items-center gap-2 w-full">
                  <FaCog className="text-yellow-500" />
                  {t("nav.settings")}
                </Link>
              </DropdownItem>

              <DropdownItem className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Link to="/dashboard/myLostItems" className="flex items-center gap-2 w-full">
                  <FaList className="text-yellow-500" />
                  {t("nav.myLostItems")}
                </Link>
              </DropdownItem>

              <DropdownItem className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Link to="/dashboard/myFoundItems" className="flex items-center gap-2 w-full">
                  <FaSearch className="text-yellow-500" />
                  {t("nav.myFoundItems")}
                </Link>
              </DropdownItem>

              <DropdownItem className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Link to="/dashboard/myClaimRequest" className="flex items-center gap-2 w-full">
                  <FaUser className="text-yellow-500" />
                  {t("nav.myClaims")}
                </Link>
              </DropdownItem>

              <DropdownDivider className="border-gray-200 dark:border-gray-700" />

              {/* SIGN OUT */}
              <DropdownItem
                onClick={handleSignOut}
                className="hover:bg-red-100 dark:hover:bg-red-700 text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-white"
              >
                <div className="flex items-center gap-2 w-full">
                  <FaSignOutAlt className="text-red-400" />
                  {t("nav.signOut")}
                </div>
              </DropdownItem>
            </Dropdown>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link to="/login">
              <button className="bg-red-800 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 text-sm">
                {t("nav.login")}
              </button>
            </Link>

            <Link to="/register">
              <button className="border border-red-700 text-red-500 hover:bg-red-800 hover:text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 text-sm">
                {t("nav.register")}
              </button>
            </Link>
          </div>
        )}

        {/* Mobile only: hamburger */}
        <NavbarToggle className="md:hidden" />
      </div>

      <NavbarCollapse
        className={[
          // Mobile: vertical menu panel
          `mt-3 space-y-1 rounded-xl p-2 ${ui.surface}`,
          // Desktop: clean horizontal list (original feel)
          `md:mt-0 md:order-1 md:flex md:flex-1 md:items-center md:justify-center ${ui.nav.desktopGap} md:space-y-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0`,
        ].join(" ")}
      >
        {navItems.map((item) => (
          <PupNavLink key={item.name} to={item.path} label={item.name} />
        ))}

        <a
          href="/#aboutUs"
          className={[
            "relative text-sm font-medium tracking-wide text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
            ui.motion,
            ui.focusRing,
            ui.linkUnderline,
            "after:w-0 hover:after:w-full",
            ui.nav.mobileItem,
            ui.nav.desktopItem,
          ].join(" ")}
        >
          {t("nav.about")}
        </a>
      </NavbarCollapse>
    </Navbar>
  );
}
/**
 * main.tsx — Application Entry Point
 *
 * This is the very first file that runs when the app loads in the browser.
 * It does three important things:
 *
 * 1. ROUTING — Defines all the URL paths (e.g. /login, /found-items/:id)
 *    and maps each path to its corresponding page component.
 *
 * 2. ROUTE GUARDS — Wraps protected pages in <ProtectedRoute> so that
 *    users who are not logged in get redirected to /login automatically.
 *
 * 3. PROVIDERS — Wraps the whole app in <Providers> which sets up
 *    Redux (global state), React Query, and i18n (language support).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/index.ts";
import App from "./App.tsx";
import Providers from "./providers/Providers.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NotFound from "./pages/notFound/NotFound.tsx";
import DashboardError from "./pages/notFound/DashboardError.tsx";
import Home from "./pages/home/Home.tsx";
import Register from "./pages/register/Register.tsx";
import Login from "./pages/login/Login.tsx";
import FoundItemsPage from "./pages/foundItems/FoundItems.tsx";
import SingleFoundItem from "./pages/foundItems/SingleFoundItem.tsx";
import LostItemsPage from "./pages/lostItems/LostItems.tsx";
import MyClaimReqPage from "./pages/myClaimRequest/MyClaimReqPage.tsx";
import SingleLostItem from "./pages/lostItems/SingleLostItem.tsx";
import DashboardLayout from "./dashboard/DashboardLayout.tsx";
import Dashboard from "./dashboard/Dashboard.tsx";
import FoundItemsManagement from "./dashboard/pages/FoundItemsManagement.tsx";
import LostItemsManagement from "./dashboard/pages/LostItemsManagement.tsx";
import ClaimsManagement from "./dashboard/pages/ClaimsManagement.tsx";
import UsersManagement from "./dashboard/pages/UsersManagement.tsx";
import CategoriesManagement from "./dashboard/pages/CategoriesManagement.tsx";
import Settings from "./dashboard/pages/Settings.tsx";
import MyFoundItems from "./dashboard/myFoundItems/MyFoundItems.tsx";
import MyLostItems from "./dashboard/myLostItems/MyLostItems.tsx";
import QRScanner from "./dashboard/pages/QRScanner.tsx";
import ReportLostItem from "./pages/reportlostItem/ReportLostItem.tsx";
import ReportFoundItem from "./pages/reportFoundItem/ReportFoundItem.tsx";
import AiSearch from "./pages/aiSearch/AiSearch.tsx";
import ProtectedRoute from "./components/shared/ProtectedRoute.tsx";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail.tsx";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword.tsx";
import RecoveryOtp from "./pages/forgotPassword/RecoveryOtp.tsx";
import ResetPassword from "./pages/forgotPassword/ResetPassword.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "register", element: <Register /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "login", element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "recovery-otp", element: <RecoveryOtp /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "found-items", element: <FoundItemsPage /> },
      { path: "lostItems", element: <LostItemsPage /> },
      { path: "found-items/:foundItem", element: <SingleFoundItem /> },
      { path: "lostItems/:lostItem", element: <SingleLostItem /> },
      { path: "ai-search", element: <AiSearch /> },
      {
        path: "reportlostItem",
        element: (
          <ProtectedRoute>
            <ReportLostItem />
          </ProtectedRoute>
        ),
      },
      {
        path: "reportFoundItem",
        element: (
          <ProtectedRoute>
            <ReportFoundItem />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
  {
    path: "/dashboard",
    errorElement: <DashboardError />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><Dashboard /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "found-items",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><FoundItemsManagement /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "lost-items",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><LostItemsManagement /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "claims",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><ClaimsManagement /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "qr-scanner",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><QRScanner /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><UsersManagement /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "categories",
        element: (
          <ProtectedRoute adminOnly>
            <DashboardLayout><CategoriesManagement /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <DashboardLayout><Settings /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "myFoundItems",
        element: (
          <ProtectedRoute>
            <DashboardLayout><MyFoundItems /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "myLostItems",
        element: (
          <ProtectedRoute>
            <DashboardLayout><MyLostItems /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "myClaimRequest",
        element: (
          <ProtectedRoute>
            <DashboardLayout><MyClaimReqPage /></DashboardLayout>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
);

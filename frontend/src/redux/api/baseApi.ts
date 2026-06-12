/**
 * redux/api/baseApi.ts — RTK Query Base Configuration
 *
 * This file sets up the foundation for all API calls in the app.
 * All network requests (fetching items, logging in, submitting claims, etc.)
 * are built on top of this base.
 *
 * Key responsibilities:
 *
 * 1. BASE URL — Reads the server address from .env (VITE_SERVER_URL)
 *    so the same code works on both localhost and in production.
 *
 * 2. AUTH HEADER — Automatically attaches the user's JWT token to every
 *    request so the server knows who is making the call.
 *
 * 3. AUTO LOGOUT — If the server returns a 401 (Unauthorized) or 403
 *    (Forbidden) error, the user's token is cleared and they are logged out.
 *
 * 4. CACHE TAGS — Defines the list of data types (tagTypes) that RTK Query
 *    uses to automatically refresh data when mutations happen.
 *    Example: after submitting a claim, the "claims" tag is invalidated
 *    so the list re-fetches automatically.
 *
 * All actual API endpoints are injected in api.ts using baseApi.injectEndpoints().
 */
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
  createApi,
} from "@reduxjs/toolkit/query/react";
import { clearAccessToken, getAccessToken } from "../../auth/auth";

const getBaseUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return `${import.meta.env.VITE_SERVER_URL}/api`;
  }
  return "http://localhost:5000/api";
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const status = (result.error as any)?.status;
  if (status === 401 || status === 403) {
    clearAccessToken();
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: [
    "mylostItems",
    "myFoundItems",
    "myClaims",
    "users",
    "adminData",
    "services",
    "faqs",
    "recentActivity",
    "foundItems",
    "claims",
    "categories",
    "systemSettings",
  ],

  endpoints: () => ({}),
});

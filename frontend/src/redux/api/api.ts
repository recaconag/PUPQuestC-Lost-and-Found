import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // login and register
    login: builder.mutation({
      query: (data: any) => {
        return {
          url: "/login",
          method: "POST",
          body: data,
        };
      },
    }),
    registers: builder.mutation({
      query: (data: any) => {
        return {
          url: "/register",
          method: "POST",
          body: data,
        };
      },
    }),

    // item category
    category: builder.query({
      query: () => {
        return {
          url: "/item-categories",
          method: "GET",
        };
      },
      providesTags: ["categories"],
    }),
    createCategory: builder.mutation({
      query: (data: any) => {
        return {
          url: "/item-categories",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["categories"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => {
        return {
          url: `/item-categories/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["categories"],
    }),
    deleteCategory: builder.mutation({
      query: (id: string) => {
        return {
          url: `/item-categories/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["categories"],
    }),

    // lost item
    getLostItems: builder.query({
      query: (data: any) => {
        return {
          url: "/lost-items",
          method: "GET",
          params: data,
        };
      },
      providesTags: ["mylostItems"],
    }),
    createLostItem: builder.mutation({
      query: (data: any) => {
        return {
          url: "/lost-items",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["mylostItems"],
    }),
    getSingleLostItem: builder.query({
      query: (id: string) => {
        return {
          url: `/lost-items/${id}`,
          method: "GET",
        };
      },
    }),
    getMyLostItem: builder.query({
      query: () => {
        return {
          url: `/my/lost-items`,
          method: "GET",
        };
      },
      providesTags: ["mylostItems"],
    }),
    editMyLostItem: builder.mutation({
      query: (data: any) => {
        return {
          url: `/my/lost-items`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["mylostItems"],
    }),
    deleteMyLostItem: builder.mutation({
      query: (id: string) => {
        return {
          url: `/my/lost-items/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["mylostItems"],
    }),

    // found item
    getMyFoundItem: builder.query({
      query: () => {
        return {
          url: `/my/found-items`,
          method: "GET",
        };
      },
      providesTags: ["myFoundItems", "foundItems"],
    }),
    createFoundItem: builder.mutation({
      query: (data: any) => {
        return {
          url: `/found-items`,
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["foundItems"],
    }),
    getFoundItems: builder.query({
      query: (data: any) => {
        return {
          url: "/found-items",
          method: "GET",
          params: data,
        };
      },
      providesTags: ["foundItems"],
    }),
    getSingleFoundItem: builder.query({
      query: (id: string) => {
        return {
          url: `/found-items/${id}`,
          method: "GET",
        };
      },
    }),
    editMyFoundItem: builder.mutation({
      query: (data: any) => {
        return {
          url: `/my/found-items`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["myFoundItems", "foundItems"],
    }),
    deleteMyFoundItem: builder.mutation({
      query: (id: string) => {
        return {
          url: `/my/found-items/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["myFoundItems", "foundItems"],
    }),

    // change password
    changePassword: builder.mutation({
      query: (data: any) => {
        return {
          url: `/change-password`,
          method: "POST",
          body: data,
        };
      },
    }),
    // change email
    changeEmail: builder.mutation({
      query: (data: any) => {
        return {
          url: `/change-email`,
          method: "POST",
          body: data,
        };
      },
    }),
    // create claim
    createClaim: builder.mutation({
      query: (data: any) => {
        return {
          url: `/claims`,
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["adminData"],
    }),
    // my claim
    myClaims: builder.query({
      query: () => {
        return {
          url: `/my/claims`,
          method: "GET",
        };
      },
    }),
    // admin stats
    adminStats: builder.query({
      query: () => {
        return {
          url: `/admin/stats`,
          method: "GET",
        };
      },
      // providesTags: ["adminData"],
    }),
    // admin stats
    blockUser: builder.mutation({
      query: (id: string) => {
        return {
          url: `/block/user/${id}`,
          method: "PUT",
        };
      },
      invalidatesTags: ["users"],
    }),

    // change user role
    changeUserRole: builder.mutation({
      query: ({ id, role }: { id: string; role: string }) => {
        return {
          url: `/change-role/${id}`,
          method: "PUT",
          body: { role },
        };
      },
      invalidatesTags: ["users"],
    }),

    // soft delete user
    softDeleteUser: builder.mutation({
      query: (id: string) => {
        return {
          url: `/delete-user/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["users"],
    }),

    // get all users
    getAllUsers: builder.query({
      query: ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
        return {
          url: "/users",
          method: "GET",
          params: { page, limit, search },
        };
      },
      providesTags: ["users"],
    }),

    // get all claims (admin)
    getAllClaims: builder.query({
      query: ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
        return {
          url: "/claims",
          method: "GET",
          params: { page, limit, search },
        };
      },
      providesTags: ["adminData"],
    }),

    // update claim status
    updateClaimStatus: builder.mutation({
      query: ({ claimId, ...data }: any) => {
        return {
          url: `/claims/${claimId}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["adminData"],
    }),

    // generate QR code for approved claim
    generateClaimQR: builder.mutation({
      query: (claimId: string) => {
        return {
          url: `/claims/generate-qr/${claimId}`,
          method: "POST",
        };
      },
      invalidatesTags: ["adminData"],
    }),

    // verify QR code scanner
    verifyClaimQR: builder.mutation({
      query: ({ claimId, scannedToken }: { claimId: string; scannedToken: string }) => {
        return {
          url: `/claims/verify-qr/${claimId}`,
          method: "POST",
          body: { scannedToken },
        };
      },
      invalidatesTags: ["adminData"],
    }),

    // mark lost item as found
    markLostItemAsFound: builder.mutation({
      query: (data: any) => {
        return {
          url: "/lost-items/toggle-status",
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["mylostItems", "foundItems"],
    }),

    // services
    getServices: builder.query({
      query: () => {
        return {
          url: "/services",
          method: "GET",
        };
      },
      providesTags: ["services"],
    }),
    createService: builder.mutation({
      query: (data: any) => {
        return {
          url: "/services",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["services"],
    }),

    // faqs
    getFaqs: builder.query({
      query: () => {
        return {
          url: "/faqs",
          method: "GET",
        };
      },
      providesTags: ["faqs"],
    }),
    createFaq: builder.mutation({
      query: (data: any) => {
        return {
          url: "/faqs",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["faqs"],
    }),

    // recent activity for dashboard
    getRecentActivity: builder.query({
      query: () => {
        return {
          url: "/recent-activity",
          method: "GET",
        };
      },
      providesTags: ["recentActivity"],
    }),

    // update profile image
    updateProfileImage: builder.mutation({
      query: (data: { userImg: string }) => ({
        url: "/update-profile-image",
        method: "PATCH",
        body: data,
      }),
    }),

    // OTP verification
    verifyOtp: builder.mutation({
      query: (data: { email: string; otp: string }) => ({
        url: "/verify-otp",
        method: "POST",
        body: data,
      }),
    }),

    // resend OTP
    resendOtp: builder.mutation({
      query: (data: { email: string }) => ({
        url: "/resend-otp",
        method: "POST",
        body: data,
      }),
    }),

    // AI search — text query
    aiSearch: builder.mutation({
      query: (data: { query: string }) => {
        return {
          url: "/ai-search",
          method: "POST",
          body: data,
        };
      },
    }),

    // =========================================================================
    // PHASE 3 FIXED: AI search — image query (Multipart FormData stream handler)
    // =========================================================================
    aiImageSearch: builder.mutation({
      query: (formData: FormData) => ({
        url: "/upload-ai", // Tumitira na sa bagong Cloudinary + Gemini route controller natin!
        method: "POST",
        body: formData, // Ipinapasa ang buong raw FormData containing the file natively
        // RTK Query will automatically clear the content-type header so the browser can format it as a clean multipart/form-data boundary sequence safely!
      }),
    }),

    // update profile name
    updateProfileName: builder.mutation({
      query: (data: {
        firstName: string;
        middleName?: string;
        lastName: string;
      }) => ({
        url: "/update-profile-name",
        method: "PATCH",
        body: data,
      }),
    }),

    // forgot password — request recovery OTP
    forgotPassword: builder.mutation({
      query: (data: { email: string }) => ({
        url: "/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    // verify recovery OTP
    verifyRecoveryOtp: builder.mutation({
      query: (data: { email: string; otp: string }) => ({
        url: "/verify-recovery-otp",
        method: "POST",
        body: data,
      }),
    }),

    // reset password
    resetPassword: builder.mutation({
      query: (data: { email: string; otp: string; newPassword: string }) => ({
        url: "/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // verify 2FA OTP (second login step)
    verify2FA: builder.mutation({
      query: (data: { userId: string; otp: string }) => ({
        url: "/login/verify-2fa",
        method: "POST",
        body: data,
      }),
    }),

    // system settings (admin)
    getSystemSettings: builder.query({
      query: () => ({ url: "/admin/system-settings", method: "GET" }),
      providesTags: ["systemSettings"],
    }),
    updateSystemSettings: builder.mutation({
      query: (data: {
        passwordExpiryDays?: number;
        sessionTimeoutMinutes?: number;
        maxLoginAttempts?: number;
        enable2FA?: boolean;
        itemExpiryDays?: number;
        maxImageSizeMb?: number;
        autoDeleteExpiredItems?: boolean;
        requireItemApproval?: boolean;
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecure?: boolean;
        smtpFromName?: string;
        smtpFromEmail?: string;
      }) => ({
        url: "/admin/system-settings",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["systemSettings"],
    }),

    // test email (uses current form values, not yet saved)
    testEmail: builder.mutation({
      query: (data: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPass: string;
        smtpSecure: boolean;
        smtpFromName: string;
        smtpFromEmail: string;
      }) => ({ url: "/admin/test-email", method: "POST", body: data }),
    }),

    // admin: get ALL items including PENDING/expired
    getAllFoundItemsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => ({
        url: "/admin/all-items/found",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["foundItems"],
    }),
    getAllLostItemsAdmin: builder.query({
      query: ({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) => ({
        url: "/admin/all-items/lost",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["mylostItems"],
    }),

    // approve items (admin)
    approveFoundItem: builder.mutation({
      query: (id: string) => ({
        url: `/admin/approve/found/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["foundItems"],
    }),
    approveLostItem: builder.mutation({
      query: (id: string) => ({
        url: `/admin/approve/lost/${id}`,
        method: "PUT",
      }),
      invalidatesTags: ["mylostItems"],
    }),
  }),
});

export const {
  useGetLostItemsQuery,
  useLoginMutation,
  useRegistersMutation,
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateLostItemMutation,
  useGetSingleLostItemQuery,
  useCreateFoundItemMutation,
  useGetFoundItemsQuery,
  useGetSingleFoundItemQuery,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useCreateClaimMutation,
  useMyClaimsQuery,
  useGetMyLostItemQuery,
  useEditMyLostItemMutation,
  useDeleteMyLostItemMutation,
  useGetMyFoundItemQuery,
  useEditMyFoundItemMutation,
  useDeleteMyFoundItemMutation,
  useAdminStatsQuery,
  useBlockUserMutation,
  useChangeUserRoleMutation,
  useSoftDeleteUserMutation,
  useGetAllUsersQuery,
  useGetAllClaimsQuery,
  useUpdateClaimStatusMutation,
  useGenerateClaimQRMutation,
  useVerifyClaimQRMutation,
  useMarkLostItemAsFoundMutation,
  useGetServicesQuery,
  useCreateServiceMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useGetRecentActivityQuery,
  useUpdateProfileImageMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useAiSearchMutation,
  useAiImageSearchMutation,
  useForgotPasswordMutation,
  useVerifyRecoveryOtpMutation,
  useResetPasswordMutation,
  useUpdateProfileNameMutation,
  useVerify2FAMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useApproveFoundItemMutation,
  useApproveLostItemMutation,
  useGetAllFoundItemsAdminQuery,
  useGetAllLostItemsAdminQuery,
  useTestEmailMutation,
} = api;

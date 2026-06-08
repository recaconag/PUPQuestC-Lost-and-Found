import { useState, useRef, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaDatabase,
  FaEnvelope,
  FaGlobe,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";
import {
  useChangePasswordMutation,
  useUpdateProfileImageMutation,
  useUpdateProfileNameMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useTestEmailMutation,
} from "../../redux/api/api";
import { setAccessToken, useUserVerification } from "../../auth/auth";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { FormField } from "../../ui/forms/FormField";
import { changePasswordSchema, type ChangePasswordValues, updateProfileNameSchema, type UpdateProfileNameValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";

const splitName = (fullName: string) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const Settings = () => {
  const user = useUserVerification();
  const { t } = useTranslation();
  const isAdmin = (user as any)?.role === 'ADMIN';
  const ADMIN_TABS = ["security", "system", "email"];
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAdmin && ADMIN_TABS.includes(activeTab)) {
      setActiveTab("account");
    }
  }, [isAdmin, activeTab]);

  // Mutations
  const [changePassword, { isLoading: isPasswordLoading }] = useChangePasswordMutation();
  const [updateProfileImage, { isLoading: isAvatarSaving }] = useUpdateProfileImageMutation();
  const [updateProfileName, { isLoading: isNameSaving }] = useUpdateProfileNameMutation();
  const { data: sysSettingsData } = useGetSystemSettingsQuery(undefined, { skip: !isAdmin });
  const [updateSystemSettings, { isLoading: isSecSaving }] = useUpdateSystemSettingsMutation();
  const [testEmail, { isLoading: isTestingEmail }] = useTestEmailMutation();

  // Security settings (admin) — synced from DB
  const [secSettings, setSecSettings] = useState({
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    enable2FA: false,
  });
  const [secSuccess, setSecSuccess] = useState(false);
  const [secError, setSecError] = useState<string | null>(null);

  useEffect(() => {
    if ((sysSettingsData as any)?.data) {
      const d = (sysSettingsData as any).data;
      setSecSettings({
        passwordExpiryDays: d.passwordExpiryDays ?? 90,
        sessionTimeoutMinutes: d.sessionTimeoutMinutes ?? 30,
        maxLoginAttempts: d.maxLoginAttempts ?? 5,
        enable2FA: d.enable2FA ?? false,
      });
    }
  }, [sysSettingsData]);

  // System (item management) settings — synced from DB
  const [sysItemSettings, setSysItemSettings] = useState({
    itemExpiryDays: 30,
    maxImageSizeMb: 5,
    autoDeleteExpiredItems: true,
    requireItemApproval: false,
  });
  const [sysSuccess, setSysSuccess] = useState(false);
  const [sysError, setSysError] = useState<string | null>(null);

  useEffect(() => {
    if ((sysSettingsData as any)?.data) {
      const d = (sysSettingsData as any).data;
      setSysItemSettings({
        itemExpiryDays: d.itemExpiryDays ?? 30,
        maxImageSizeMb: d.maxImageSizeMb ?? 5,
        autoDeleteExpiredItems: d.autoDeleteExpiredItems ?? true,
        requireItemApproval: d.requireItemApproval ?? false,
      });
    }
  }, [sysSettingsData]);

  // SMTP settings — synced from DB
  const [smtpSettings, setSmtpSettings] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: false,
    smtpFromName: "PUPQuestC Support",
    smtpFromEmail: "",
  });
  const [smtpSuccess, setSmtpSuccess] = useState<string | null>(null);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpSaving, setSmtpSaving] = useState(false);

  useEffect(() => {
    if ((sysSettingsData as any)?.data) {
      const d = (sysSettingsData as any).data;
      setSmtpSettings({
        smtpHost: d.smtpHost || "smtp.gmail.com",
        smtpPort: d.smtpPort || 587,
        smtpUser: d.smtpUser || "",
        smtpPass: d.smtpPass || "",
        smtpSecure: d.smtpSecure ?? false,
        smtpFromName: d.smtpFromName || "PUPQuestC Support",
        smtpFromEmail: d.smtpFromEmail || "",
      });
    }
  }, [sysSettingsData]);

  const handleTestEmail = async () => {
    setSmtpError(null);
    setSmtpSuccess(null);
    try {
      const res = await testEmail(smtpSettings).unwrap();
      setSmtpSuccess((res as any).message || "Test email sent successfully!");
      setTimeout(() => setSmtpSuccess(null), 6000);
    } catch (err: any) {
      setSmtpError(err?.data?.message || "Failed to send test email.");
    }
  };

  const handleSaveSmtpSettings = async () => {
    setSmtpError(null);
    setSmtpSuccess(null);
    setSmtpSaving(true);
    try {
      await updateSystemSettings(smtpSettings).unwrap();
      setSmtpSuccess("SMTP settings saved successfully.");
      setTimeout(() => setSmtpSuccess(null), 4000);
    } catch (err: any) {
      setSmtpError(err?.data?.message || "Failed to save SMTP settings.");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setSysError(null);
    setSysSuccess(false);
    try {
      await updateSystemSettings(sysItemSettings).unwrap();
      setSysSuccess(true);
      setTimeout(() => setSysSuccess(false), 3000);
    } catch (err: any) {
      setSysError(err?.data?.message ?? "Failed to save system settings.");
    }
  };

  const handleSaveSecuritySettings = async () => {
    setSecError(null);
    setSecSuccess(false);
    try {
      await updateSystemSettings(secSettings).unwrap();
      setSecSuccess(true);
      setTimeout(() => setSecSuccess(false), 3000);
    } catch (err: any) {
      setSecError(err?.data?.message ?? "Failed to save security settings.");
    }
  };

  // Password form
  const {
    handleSubmit: handlePasswordSubmit,
    register: registerPassword,
    formState: { errors: passwordErrors },
  } = useZodForm<typeof changePasswordSchema, ChangePasswordValues>(changePasswordSchema, {
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Name form
  const {
    handleSubmit: handleNameSubmit,
    register: registerName,
    setValue: setNameValue,
    formState: { errors: nameErrors },
  } = useZodForm<typeof updateProfileNameSchema, UpdateProfileNameValues>(updateProfileNameSchema, {
    defaultValues: { firstName: "", middleName: "", lastName: "" },
  });
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    const parts = splitName((user as any)?.name || "");
    setNameValue("firstName", parts.firstName);
    setNameValue("middleName", parts.middleName);
    setNameValue("lastName", parts.lastName);
  }, [(user as any)?.name, setNameValue]);

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
  const AVATAR_ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

  const processAvatarFile = async (file: File) => {
    setAvatarError(null);
    setAvatarSaved(false);
    if (!AVATAR_ACCEPTED.includes(file.type)) {
      setAvatarError("Only JPG and PNG images are allowed.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Profile image must be under 2 MB.");
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setAvatarUploading(true);
    setAvatarProgress(0);
    const formData = new FormData();
    formData.append("image", file);
    const baseUrl = import.meta.env.VITE_SERVER_URL
      ? `${import.meta.env.VITE_SERVER_URL}/api`
      : "http://localhost:5000/api";
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      "";
    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          setAvatarProgress(Math.round((e.loaded / e.total) * 100));
      });
      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", `${baseUrl}/upload`);
        xhr.setRequestHeader("authorization", `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setPendingAvatarUrl(data.data.url);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatarUrl) return;
    try {
      const res: any = await updateProfileImage({ userImg: pendingAvatarUrl });
      if (res?.data?.data?.token) {
        setAccessToken(res.data.data.token);
      }
      setAvatarSaved(true);
      setPendingAvatarUrl(null);
    } catch {
      setAvatarError("Failed to save profile image. Please try again.");
    }
  };

  const handleAvatarClear = () => {
    setAvatarPreview(null);
    setPendingAvatarUrl(null);
    setAvatarError(null);
    setAvatarSaved(false);
    setAvatarProgress(0);
  };

  const [language, setLanguage] = useState(
    localStorage.getItem("pupquestc-lang") || "en"
  );

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("pupquestc-lang", lang);
  };

  const handleUpdateName = async (data: UpdateProfileNameValues) => {
    setNameError(null);
    setNameSuccess(false);
    try {
      const res: any = await updateProfileName({
        firstName: data.firstName.trim(),
        middleName: data.middleName.trim(),
        lastName: data.lastName.trim(),
      }).unwrap();
      if (res?.data?.token) setAccessToken(res.data.token);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      setNameError(err?.data?.message ?? "Failed to update profile. Please try again.");
    }
  };

  const handleChangePassword = async (data: ChangePasswordValues) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const res: any = await changePassword(data);
      if (res?.error?.data?.message) {
        setPasswordError(res.error.data.message);
        return;
      }
      if (res?.data?.statusCode === 200) {
        handlePasswordSubmit(() => { })(); // Reset form
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err: any) {
      setPasswordError(err?.data?.message ?? "Failed to change password.");
    }
  };

  const tabs = [
    { id: "account", label: t("settings.tabs.account"), icon: <FaUser />, adminOnly: false },
    { id: "security", label: t("settings.tabs.security"), icon: <FaShieldAlt />, adminOnly: true },
    { id: "system", label: t("settings.tabs.system"), icon: <FaDatabase />, adminOnly: true },
    { id: "email", label: t("settings.tabs.email"), icon: <FaEnvelope />, adminOnly: true },
  ].filter(tab => !tab.adminOnly || isAdmin);

  const inputCls = "w-full px-4 py-2.5 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200";
  const inputAdminCls = "w-full px-4 py-2 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200";
  const readonlyCls = "w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-lg text-gray-400 cursor-not-allowed select-none";
  const maroonBtn = "inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 border border-red-600/50 shadow-md text-sm";

  return (
    <div className="min-h-screen bg-gray-900/40 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            {t("settings.title")}
          </h1>
          <p className="text-gray-400 mt-1">{t("settings.subtitle")}</p>
        </div>

        {/* ── Horizontal tab bar (admins only) ── */}
        {tabs.length > 1 && (
          <div className="glass-card rounded-xl p-1.5 flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                  ? "bg-red-700 text-white shadow-md border border-red-600/50"
                  : "text-gray-400 hover:bg-gray-700/60 hover:text-white"
                  }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content card ── */}
        <div className="glass-card rounded-2xl p-8">

          {/* ════ ACCOUNT TAB ════ */}
          {activeTab === "account" && (
            <div>
              <h2 className="text-xl font-semibold gold-text mb-8">{t("settings.account.title")}</h2>

              {/* ── Section 1: Profile Information ── */}
              <div className="space-y-6 pb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                    <FaUser className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{t("settings.account.profileInformation")}</h3>
                </div>

                {/* Avatar row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-yellow-500/30 bg-gray-700 shadow-xl">
                      {(avatarPreview || (user as any)?.userImg) ? (
                        <img src={avatarPreview || (user as any)?.userImg} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 bg-gradient-to-br from-gray-700 to-gray-800">
                          {((user as any)?.name?.[0] || (user as any)?.email?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                    </div>
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin" />
                      </div>
                    )}
                    {avatarSaved && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={avatarUploading} onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-600 text-gray-900 font-semibold rounded-lg transition-all duration-200 shadow text-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {avatarUploading ? `Uploading ${avatarProgress}%…` : t("settings.account.choosePhoto")}
                      </button>
                      {pendingAvatarUrl && (
                        <button type="button" disabled={isAvatarSaving} onClick={handleSaveAvatar}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 shadow border border-red-600/50 text-sm">
                          {isAvatarSaving ? t("settings.account.saving") : t("settings.account.saveProfilePicture")}
                        </button>
                      )}
                      {(avatarPreview || pendingAvatarUrl) && (
                        <button type="button" onClick={handleAvatarClear}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-all duration-200 border border-gray-700/60 text-sm">
                          {t("settings.account.cancel")}
                        </button>
                      )}
                    </div>
                    {avatarUploading && (
                      <div className="w-full max-w-xs h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-200" style={{ width: `${avatarProgress}%` }} />
                      </div>
                    )}
                    {avatarSaved && <p className="text-xs text-green-400 font-medium">{t("settings.account.profileSaved")}</p>}
                    {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
                    <p className="text-xs text-gray-500">{t("settings.account.jpgPngMax")}</p>
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="sr-only"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) processAvatarFile(file); e.target.value = ""; }} aria-hidden />

                {/* Name + Identity form */}
                <form onSubmit={handleNameSubmit(handleUpdateName)} className="space-y-6">
                  {/* Name row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField<UpdateProfileNameValues> name="firstName" label={t("settings.account.firstName")} errors={nameErrors} required>
                      {({ id, hasError, ariaDescribedBy }) => (
                        <PupInput
                          id={id}
                          type="text"
                          placeholder="Juan"
                          {...registerName("firstName")}
                          hasError={hasError}
                          ariaDescribedBy={ariaDescribedBy}
                          aria-required="true"
                        />
                      )}
                    </FormField>
                    <FormField<UpdateProfileNameValues> name="middleName" label={t("settings.account.middleName")} errors={nameErrors} hint={t("settings.account.middleNameOptional")}>
                      {({ id, hasError, ariaDescribedBy }) => (
                        <PupInput
                          id={id}
                          type="text"
                          placeholder="dela"
                          {...registerName("middleName")}
                          hasError={hasError}
                          ariaDescribedBy={ariaDescribedBy}
                        />
                      )}
                    </FormField>
                    <FormField<UpdateProfileNameValues> name="lastName" label={t("settings.account.lastName")} errors={nameErrors} required>
                      {({ id, hasError, ariaDescribedBy }) => (
                        <PupInput
                          id={id}
                          type="text"
                          placeholder="Cruz"
                          {...registerName("lastName")}
                          hasError={hasError}
                          ariaDescribedBy={ariaDescribedBy}
                          aria-required="true"
                        />
                      )}
                    </FormField>
                  </div>

                  {/* Read-only identity row */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-400">
                      {t("settings.account.emailAddress")} <span className="text-gray-600 font-normal text-xs">{t("settings.account.readOnly")}</span>
                    </label>
                    <input type="text" value={(user as any)?.email || ""} readOnly className={readonlyCls} />
                  </div>

                  {/* Language Preference */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <FaGlobe className="w-3.5 h-3.5 text-yellow-400" />
                      {t("settings.account.languagePreference")}
                    </label>
                    <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className={inputCls}>
                      <option value="en">English</option>
                      <option value="tl">Tagalog (Filipino)</option>
                    </select>
                  </div>

                  {nameError && (
                    <p className="text-sm text-red-400 flex items-center gap-1.5"><span aria-hidden>✕</span> {nameError}</p>
                  )}
                  {nameSuccess && (
                    <p className="text-sm text-green-400 flex items-center gap-1.5"><FaCheckCircle className="w-3.5 h-3.5" /> {t("settings.account.profileUpdated")}</p>
                  )}

                  <PupButton type="submit" disabled={isNameSaving} className={maroonBtn}>
                    {isNameSaving ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("settings.account.saving")}</>) : t("settings.account.updateProfile")}
                  </PupButton>
                </form>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-gray-700/60 mb-8" />

              {/* ── Section 2: Account Security ── */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <FaShieldAlt className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{t("settings.account.accountSecurity")}</h3>
                </div>
                <p className="text-sm text-gray-500">{t("settings.account.changePasswordHint")}</p>

                <form onSubmit={handlePasswordSubmit(handleChangePassword)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField<ChangePasswordValues> name="currentPassword" label={t("settings.account.currentPassword")} errors={passwordErrors} required>
                      {({ id, hasError, ariaDescribedBy }) => (
                        <div className="relative">
                          <PupInput
                            id={id}
                            type={showPassword ? "text" : "password"}
                            placeholder="Current password"
                            {...registerPassword("currentPassword")}
                            hasError={hasError}
                            ariaDescribedBy={ariaDescribedBy}
                            aria-required="true"
                            className="pr-10"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                            aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </FormField>
                    <FormField<ChangePasswordValues> name="newPassword" label={t("settings.account.newPassword")} errors={passwordErrors} required>
                      {({ id, hasError, ariaDescribedBy }) => (
                        <PupInput
                          id={id}
                          type="password"
                          placeholder="New password"
                          {...registerPassword("newPassword")}
                          hasError={hasError}
                          ariaDescribedBy={ariaDescribedBy}
                          aria-required="true"
                        />
                      )}
                    </FormField>
                  </div>

                  {passwordError && (
                    <p className="text-sm text-red-400 flex items-center gap-1.5"><span aria-hidden>✕</span> {passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-green-400 flex items-center gap-1.5"><FaCheckCircle className="w-3.5 h-3.5" /> {t("settings.account.passwordChanged")}</p>
                  )}

                  <PupButton type="submit" disabled={isPasswordLoading} className={maroonBtn}>
                    {isPasswordLoading ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("settings.account.changing")}</>) : t("settings.account.changePassword")}
                  </PupButton>
                </form>
              </div>
            </div>
          )}

          {/* ════ SECURITY TAB (admin) ════ */}
          {activeTab === "security" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold gold-text">Security Settings</h2>
              <p className="text-sm text-gray-500">These values are stored globally and applied to every login session in real-time.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password Expiry (days)</label>
                  <p className="text-xs text-gray-500 mb-2">Set to 0 to disable expiry checks.</p>
                  <input type="number" min={0} value={secSettings.passwordExpiryDays}
                    onChange={(e) => setSecSettings((p) => ({ ...p, passwordExpiryDays: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className={inputAdminCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Session Timeout (minutes)</label>
                  <p className="text-xs text-gray-500 mb-2">JWT expiry applied on next login. Set to 0 to use default (7 days).</p>
                  <input type="number" min={0} value={secSettings.sessionTimeoutMinutes}
                    onChange={(e) => setSecSettings((p) => ({ ...p, sessionTimeoutMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className={inputAdminCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Login Attempts</label>
                  <p className="text-xs text-gray-500 mb-2">Account locked for 30 min after this many failures. Min 1.</p>
                  <input type="number" min={1} value={secSettings.maxLoginAttempts}
                    onChange={(e) => setSecSettings((p) => ({ ...p, maxLoginAttempts: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={inputAdminCls} />
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-gray-700/60">
                <div>
                  <label className="text-sm font-medium text-gray-300">Require 2FA for All Users</label>
                  <p className="text-sm text-gray-500">A 6-digit OTP is emailed after each password verification.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSecSettings((p) => ({ ...p, enable2FA: !p.enable2FA }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 ${secSettings.enable2FA ? "bg-red-600" : "bg-gray-700"
                    }`}
                  aria-pressed={secSettings.enable2FA}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${secSettings.enable2FA ? "translate-x-6" : "translate-x-1"
                    }`} />
                </button>
              </div>

              {secError && <p className="text-sm text-red-400 flex items-center gap-1.5"><span aria-hidden>✕</span> {secError}</p>}
              {secSuccess && <p className="text-sm text-green-400 flex items-center gap-1.5"><FaCheckCircle className="w-3.5 h-3.5" /> Security settings saved successfully.</p>}

              <button type="button" onClick={handleSaveSecuritySettings} disabled={isSecSaving} className={maroonBtn}>
                {isSecSaving ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>) : "Save Security Settings"}
              </button>
            </div>
          )}

          {/* ════ SYSTEM TAB (admin) ════ */}
          {activeTab === "system" && isAdmin && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold gold-text">System Settings</h2>
              <p className="text-sm text-gray-500">Controls item lifecycle and upload limits. Changes take effect immediately on the next action.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Item Expiry (days)</label>
                  <p className="text-xs text-gray-500 mb-2">Items older than this are marked expired at midnight. Set to 0 to disable.</p>
                  <input type="number" min={0} value={sysItemSettings.itemExpiryDays}
                    onChange={(e) => setSysItemSettings((p) => ({ ...p, itemExpiryDays: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className={inputAdminCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Image Size (MB)</label>
                  <p className="text-xs text-gray-500 mb-2">Backend enforces this limit on every image upload. Min 1 MB.</p>
                  <input type="number" min={1} value={sysItemSettings.maxImageSizeMb}
                    onChange={(e) => setSysItemSettings((p) => ({ ...p, maxImageSizeMb: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={inputAdminCls} />
                </div>
              </div>

              {[
                { key: "autoDeleteExpiredItems" as const, label: "Auto-delete Expired Items", desc: "Permanently soft-deletes expired items every midnight (requires Item Expiry > 0)." },
                { key: "requireItemApproval" as const, label: "Require Item Approval", desc: "New reports start as PENDING and won't appear publicly until an admin approves them." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-4 border-t border-gray-700/60">
                  <div>
                    <label className="text-sm font-medium text-gray-300">{label}</label>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSysItemSettings((p) => ({ ...p, [key]: !p[key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 ${sysItemSettings[key] ? "bg-red-600" : "bg-gray-700"
                      }`}
                    aria-pressed={sysItemSettings[key]}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${sysItemSettings[key] ? "translate-x-6" : "translate-x-1"
                      }`} />
                  </button>
                </div>
              ))}

              {sysError && <p className="text-sm text-red-400 flex items-center gap-1.5"><span aria-hidden>✕</span> {sysError}</p>}
              {sysSuccess && <p className="text-sm text-green-400 flex items-center gap-1.5"><FaCheckCircle className="w-3.5 h-3.5" /> System settings saved successfully.</p>}

              <button type="button" onClick={handleSaveSystemSettings} disabled={isSecSaving} className={maroonBtn}>
                {isSecSaving ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>) : "Save System Settings"}
              </button>
            </div>
          )}

          {/* ════ EMAIL TAB (admin) ════ */}
          {activeTab === "email" && isAdmin && (
            <div className="space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold gold-text">System Notification Config (SMTP)</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Changes save to the database and override <code>.env</code> values for all outgoing emails.</p>
                </div>
                <button
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-md border border-yellow-500/30"
                >
                  {isTestingEmail ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                  ) : (
                    <><FaEnvelope className="w-3.5 h-3.5" /> Test Connection</>
                  )}
                </button>
              </div>

              {/* Feedback banners */}
              {smtpError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-900/20 border border-red-500/40">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <p className="text-sm text-red-300">{smtpError}</p>
                </div>
              )}
              {smtpSuccess && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-900/20 border border-green-500/40">
                  <FaCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-300">{smtpSuccess}</p>
                </div>
              )}

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {([
                  { key: "smtpHost", label: "SMTP Host", type: "text", hint: "e.g. smtp.gmail.com" },
                  { key: "smtpPort", label: "SMTP Port", type: "number", hint: "587 (TLS) or 465 (SSL)" },
                  { key: "smtpUser", label: "Username", type: "text", hint: "your@gmail.com" },
                  { key: "smtpFromName", label: "From Name", type: "text", hint: "PUPQuestC Support" },
                  { key: "smtpFromEmail", label: "From Email", type: "email", hint: "noreply@example.com (optional)" },
                ] as { key: keyof typeof smtpSettings; label: string; type: string; hint: string }[]).map(({ key, label, type, hint }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                    <p className="text-xs text-gray-500 mb-1.5">{hint}</p>
                    <input
                      type={type}
                      value={smtpSettings[key] as string | number}
                      onChange={(e) => setSmtpSettings((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                      className={inputAdminCls}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">App Password</label>
                  <p className="text-xs text-gray-500 mb-1.5">For Gmail: generate at myaccount.google.com/security</p>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={smtpSettings.smtpPass}
                      onChange={(e) => setSmtpSettings((p) => ({ ...p, smtpPass: e.target.value }))}
                      className={`${inputAdminCls} pr-10`}
                      placeholder="••••••••••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SSL toggle */}
              <div className="flex items-center justify-between py-4 border-t border-gray-700/60">
                <div>
                  <label className="text-sm font-medium text-gray-300">Use SSL/TLS (Port 465)</label>
                  <p className="text-sm text-gray-500">OFF = STARTTLS on port 587. ON = implicit SSL on port 465.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSmtpSettings((p) => ({ ...p, smtpSecure: !p.smtpSecure }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 ${smtpSettings.smtpSecure ? "bg-red-600" : "bg-gray-700"
                    }`}
                  aria-pressed={smtpSettings.smtpSecure}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${smtpSettings.smtpSecure ? "translate-x-6" : "translate-x-1"
                    }`} />
                </button>
              </div>

              <button type="button" onClick={handleSaveSmtpSettings} disabled={smtpSaving} className={maroonBtn}>
                {smtpSaving ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>) : "Save SMTP Settings"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;

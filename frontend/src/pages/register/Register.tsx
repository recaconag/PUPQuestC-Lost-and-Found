import { useState, useRef, useEffect } from "react";
import { Spinner } from "flowbite-react";
import { useRegistersMutation } from "../../redux/api/api";
import { Link, useNavigate } from "react-router-dom";
import { MdEmail, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaIdCard, FaGraduationCap, FaCheck } from "react-icons/fa";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";
import { FormField } from "../../ui/forms/FormField";
import { registerSchema, type RegisterValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";

const PUP_DOMAINS = ["@iskolarngbayan.pup.edu.ph", "@pup.edu.ph"] as const;
const ID_MAX_BYTES = 2 * 1024 * 1024;
const ID_ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const idFileRef = useRef<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    watch,
    clearErrors,
    formState: { errors, touchedFields, isSubmitted },
  } = useZodForm<typeof registerSchema, RegisterValues>(registerSchema, {
    defaultValues: { name: "", email: "", password: "", conpassword: "" },
  });

  const [registers, { isLoading }] = useRegistersMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const watchedEmail = watch("email") ?? "";
  const watchedPassword = watch("password") ?? "";
  const watchedConPassword = watch("conpassword") ?? "";

  const isValidWebmail = PUP_DOMAINS.some((d) => watchedEmail.endsWith(d));
  const isEmailTouched = touchedFields.email || isSubmitted;
  const showDomainWarning = isEmailTouched && watchedEmail.length > 0 && !isValidWebmail;

  const passwordChecks = {
    length: watchedPassword.length >= 8,
    uppercase: /[A-Z]/.test(watchedPassword),
    number: /[0-9]/.test(watchedPassword),
    special: /[^a-zA-Z0-9]/.test(watchedPassword),
  };
  const allPasswordReqsMet = Object.values(passwordChecks).every(Boolean);
  
  const isConPasswordTouched = touchedFields.conpassword || isSubmitted;
  const showConfirmMismatch =
    isConPasswordTouched && watchedConPassword.length > 0 && watchedPassword !== watchedConPassword;
  
  const showTooWeak =
    (touchedFields.password === true || isSubmitted) && watchedPassword.length > 0 && !allPasswordReqsMet;

  useEffect(() => {
    if (isValidWebmail) clearErrors("email");
  }, [isValidWebmail, clearErrors]);

  const handleIdChange = (file: File) => {
    if (!ID_ACCEPTED.includes(file.type)) {
      setIdError("Only JPG and PNG images are allowed.");
      idFileRef.current = null;
      return;
    }
    if (file.size > ID_MAX_BYTES) {
      setIdError("File must be under 2 MB.");
      idFileRef.current = null;
      return;
    }
    setIdError(null);
    if (idPreview) URL.revokeObjectURL(idPreview);
    idFileRef.current = file;
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleIdRemove = () => {
    if (idPreview) URL.revokeObjectURL(idPreview);
    idFileRef.current = null;
    setIdFile(null);
    setIdPreview(null);
    setIdError(null);
  };

  const onSubmit = async (data: RegisterValues) => {
    const currentFile = idFileRef.current;
    if (!currentFile) {
      setIdError("Please upload your profile picture.");
      return;
    }
    setIdError(null);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("idPicture", currentFile);
      const res: any = await registers(formData).unwrap();
      if (res?.success === true) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      console.error("[Register] failed:", err);
      setSubmitError(err?.data?.message ?? "Registration failed. Please try again.");
    }
  };

  /* ── Registration Form ──────────────────────────────────────── */
  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 py-10">
      <div className="flex flex-col items-center justify-center px-4 mx-auto w-full">
        <div className="w-full max-w-md glass-card rounded-2xl">
          <div className="p-7">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FaGraduationCap className="text-yellow-500 w-6 h-6 flex-shrink-0" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
                  PUPQC Registration
                </h1>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">PUPQuestC · PUPQC Community</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Full Name */}
              <FormField<RegisterValues> name="name" label="Full Name" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <div className="relative">
                    <PupInput
                      id={id}
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Juan Dela Cruz"
                      {...register("name")}
                      hasError={hasError}
                      ariaDescribedBy={ariaDescribedBy}
                      aria-required="true"
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <MdPerson className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                  </div>
                )}
              </FormField>

              {/* PUP Webmail */}
              <FormField<RegisterValues> name="email" label="Official PUP Email" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <>
                    <div className="relative">
                      <PupInput
                        id={id}
                        type="email"
                        autoComplete="email"
                        placeholder="student@iskolarngbayan.pup.edu.ph"
                        {...register("email")}
                        hasError={hasError || showDomainWarning}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <MdEmail className="w-4.5 h-4.5 text-gray-500" />
                      </div>
                    </div>
                    {showDomainWarning && (
                      <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1" role="alert">
                        ⚠ Please use your official PUPQC email (@iskolarngbayan.pup.edu.ph or @pup.edu.ph) to register.
                      </p>
                    )}
                  </>
                )}
              </FormField>

              {/* Profile Picture Upload */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-300">
                  Profile Picture <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload a clear photo of yourself (JPG or PNG).
                </p>

                <button
                  type="button"
                  onClick={() => idInputRef.current?.click()}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-gray-800/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 text-left mt-1.5 ${idError
                    ? "border-red-600/70"
                    : idFile
                      ? "border-yellow-500/50 hover:border-yellow-500/70"
                      : "border-gray-700/60 hover:border-yellow-500/50 hover:bg-gray-700/40"
                    }`}
                  aria-label="Upload Profile Picture"
                >
                  {/* Preview */}
                  <div className="w-12 h-10 rounded-md flex-shrink-0 overflow-hidden bg-gray-700 ring-1 ring-gray-600">
                    {idPreview ? (
                      <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <FaIdCard className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${idFile ? "text-white" : "text-gray-400"}`}>
                      {idFile ? idFile.name : "Click to upload your profile picture…"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">JPG or PNG · Max 2 MB</p>
                  </div>

                  <div className="flex-shrink-0 ml-1">
                    {idFile ? (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                  </div>
                </button>

                {(idError || idFile) && (
                  <div className="flex items-center justify-between px-0.5">
                    {idError ? (
                      <p className="text-xs text-red-400 font-medium">{idError}</p>
                    ) : <span />}
                    {idFile && (
                      <button
                        type="button"
                        onClick={handleIdRemove}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors duration-150 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIdChange(file);
                    e.target.value = "";
                  }}
                  aria-hidden
                />
              </div>

              {/* Password row — 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <FormField<RegisterValues> name="password" label="Password" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <div className="relative">
                      <PupInput
                        id={id}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...register("password")}
                        hasError={hasError}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 rounded-md"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </FormField>

                <FormField<RegisterValues> name="conpassword" label="Confirm Password" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <div className="relative">
                      <PupInput
                        id={id}
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...register("conpassword")}
                        hasError={hasError || showConfirmMismatch}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 rounded-md"
                          aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirm ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </FormField>
              </div>

              {/* Password strength checklist — appears as soon as user starts typing */}
              {watchedPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl px-3 py-2.5">
                  {([
                    { met: passwordChecks.length, label: "At least 8 characters" },
                    { met: passwordChecks.uppercase, label: "One uppercase letter" },
                    { met: passwordChecks.number, label: "One number (0–9)" },
                    { met: passwordChecks.special, label: "One special character" },
                  ] as const).map(({ met, label }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? "text-yellow-400" : "text-gray-500"
                        }`}
                    >
                      {met ? (
                        <FaCheck className="w-2.5 h-2.5 flex-shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full border border-current flex-shrink-0" />
                      )}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* "Too weak" message — shown after user blurs password field */}
              {showTooWeak && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 -mt-1" role="alert">
                  <span aria-hidden>⚠</span> Password is too weak. Please follow the security requirements.
                </p>
              )}

              {/* Confirm password mismatch */}
              {showConfirmMismatch && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 -mt-1" role="alert">
                  <span aria-hidden>⚠</span> Passwords do not match.
                </p>
              )}

              {/* Submit error */}
              {submitError && (
                <p className="text-sm text-red-400 text-center flex items-center justify-center gap-1.5" role="alert">
                  <span aria-hidden>✕</span> {submitError}
                </p>
              )}

              <PupButton
                type="submit"
                disabled={isLoading || !isValidWebmail || !allPasswordReqsMet}
                className="w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Submitting Registration…
                  </span>
                ) : "Register"}
              </PupButton>

              {!isValidWebmail && watchedEmail.length === 0 && (
                <p className="text-center text-xs text-gray-500">
                  Enter your PUP Webmail to enable registration.
                </p>
              )}

              {/* Sign-in link */}
              <p className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-yellow-500 hover:text-yellow-400 transition-colors duration-200 underline decoration-red-700/50 underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;

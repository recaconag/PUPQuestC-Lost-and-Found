import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaArrowLeft, FaCheckCircle, FaLock } from "react-icons/fa";
import { Spinner } from "flowbite-react";
import { useResetPasswordMutation } from "../../redux/api/api";
import { FormField } from "../../ui/forms/FormField";
import { resetPasswordSchema, type ResetPasswordValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useZodForm<typeof resetPasswordSchema, ResetPasswordValues>(resetPasswordSchema, {
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    setSubmitError(null);
    try {
      await resetPassword({ email, otp, newPassword: data.newPassword }).unwrap();
      setIsSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err: any) {
      setSubmitError(err?.data?.message ?? "Failed to reset password. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="glass-card rounded-2xl p-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] ring-2 ring-green-500/30">
              <FaCheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-gray-400 text-sm">Your password has been updated. Redirecting to login…</p>
            <div className="mt-6 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-yellow-500 rounded-full animate-[grow_2.5s_ease-out_forwards]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 py-10">
      <div className="flex flex-col items-center justify-center px-4 mx-auto w-full">
        <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden">

          {/* Header band */}
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-8 py-6 text-center border-b border-yellow-600/20">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <FaLock className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Set New Password</h1>
            <p className="text-yellow-100/70 text-sm">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              {/* New Password */}
              <FormField<ResetPasswordValues> name="newPassword" label="New Password" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <div className="relative">
                    <PupInput
                      id={id}
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register("newPassword")}
                      hasError={hasError}
                      ariaDescribedBy={ariaDescribedBy}
                      aria-required="true"
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none"
                        aria-label={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <MdVisibilityOff className="w-4.5 h-4.5" /> : <MdVisibility className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </FormField>

              {/* Confirm Password */}
              <FormField<ResetPasswordValues> name="confirmPassword" label="Confirm New Password" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <div className="relative">
                    <PupInput
                      id={id}
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      hasError={hasError}
                      ariaDescribedBy={ariaDescribedBy}
                      aria-required="true"
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="text-gray-400 hover:text-gray-300 transition-colors focus-visible:outline-none"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <MdVisibilityOff className="w-4.5 h-4.5" /> : <MdVisibility className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </FormField>

              {submitError && (
                <p className="text-sm text-red-400 text-center flex items-center justify-center gap-1.5" role="alert">
                  <span aria-hidden>✕</span> {submitError}
                </p>
              )}

              <PupButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Resetting password…
                  </span>
                ) : "Reset Password"}
              </PupButton>

              <div className="pt-3 border-t border-gray-700/50 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;

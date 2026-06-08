import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { Spinner } from "flowbite-react";
import { useForgotPasswordMutation } from "../../redux/api/api";
import { FormField } from "../../ui/forms/FormField";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useZodForm<typeof forgotPasswordSchema, ForgotPasswordValues>(forgotPasswordSchema, {
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setSubmitError(null);
    try {
      await forgotPassword({ email: data.email }).unwrap();
      navigate(`/recovery-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setSubmitError(err?.data?.message ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 py-10">
      <div className="flex flex-col items-center justify-center px-4 mx-auto w-full">
        <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden">

          {/* Header band */}
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-8 py-6 text-center border-b border-yellow-600/20">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <FaLock className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Forgot Password</h1>
            <p className="text-yellow-100/70 text-sm">
              Enter your institutional email and we'll send you a recovery code.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

              <FormField<ForgotPasswordValues> name="email" label="Institutional Email" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <div className="relative">
                    <PupInput
                      id={id}
                      type="email"
                      placeholder="name@iskolarngbayan.pup.edu.ph"
                      autoComplete="email"
                      {...register("email")}
                      hasError={hasError}
                      ariaDescribedBy={ariaDescribedBy}
                      aria-required="true"
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <MdEmail className="w-4.5 h-4.5 text-gray-500" />
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
                    Sending recovery code…
                  </span>
                ) : "Send Recovery Code"}
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

export default ForgotPassword;

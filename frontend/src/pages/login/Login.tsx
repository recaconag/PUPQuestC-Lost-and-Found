import { Spinner } from "flowbite-react";
import { setUserLocalStorage } from "../../auth/auth";
import { useLoginMutation, useVerify2FAMutation } from "../../redux/api/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MdEmail, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState, useRef } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";
import { FormField } from "../../ui/forms/FormField";
import { loginSchema, type LoginValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from: string = (location.state as any)?.from || "/";
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useZodForm<typeof loginSchema, LoginValues>(loginSchema, {
    defaultValues: { username: "", password: "" },
  });

  const [login, { isLoading }] = useLoginMutation();
  const [verify2FA, { isLoading: is2FALoading }] = useVerify2FAMutation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordExpired, setPasswordExpired] = useState(false);
  const [expiredEmail, setExpiredEmail] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (data: LoginValues) => {
    setLoginError(null);
    try {
      const res: any = await login(data).unwrap();
      const payload = res?.data;
      if (payload?.twoFactorRequired) {
        setTwoFactorUserId(payload.userId);
        setTimeout(() => otpInputRef.current?.focus(), 100);
        return;
      }
      if (payload?.passwordExpired) {
        setPasswordExpired(true);
        setExpiredEmail(payload.email);
        return;
      }
      setUserLocalStorage(payload?.token);
      if (payload?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setLoginError(err?.data?.message ?? "Invalid credentials. Please try again.");
    }
  };

  const onVerify2FA = async () => {
    setOtpError(null);
    if (!otpValue.trim() || otpValue.length !== 6) {
      setOtpError("Enter the 6-digit code sent to your email.");
      return;
    }
    try {
      const res: any = await verify2FA({ userId: twoFactorUserId!, otp: otpValue }).unwrap();
      setUserLocalStorage(res?.data?.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setOtpError(err?.data?.message ?? "Invalid or expired code. Please try again.");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 py-10">
      <div className="flex flex-col items-center justify-center px-4 mx-auto w-full">
        <div className="w-full max-w-md glass-card rounded-2xl">
          <div className="p-7">

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Sign in to your PUPQuestC account</p>
            </div>

            {/* ── Password Expired ── */}
            {passwordExpired && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                    <FaShieldAlt className="text-yellow-400 text-2xl" />
                  </div>
                  <h2 className="text-lg font-semibold text-yellow-400">Password Expired</h2>
                  <p className="text-gray-400 text-sm">Your password has expired as per your organization's security policy. Please reset it to continue.</p>
                </div>
                <Link
                  to={`/forgot-password?email=${encodeURIComponent(expiredEmail)}`}
                  className="block w-full text-center py-3 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-semibold rounded-lg transition-all duration-200"
                >
                  Reset Password
                </Link>
                <button type="button" onClick={() => setPasswordExpired(false)} className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  ← Back to login
                </button>
              </div>
            )}

            {/* ── 2FA OTP Step ── */}
            {twoFactorUserId && !passwordExpired && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-700/20 border border-red-600/40 flex items-center justify-center">
                    <FaShieldAlt className="text-red-400 text-2xl" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
                  <p className="text-gray-400 text-sm">A 6-digit code was sent to your registered email. Enter it below to complete login.</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">Verification Code</label>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "")); setOtpError(null); }}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200"
                  />
                  {otpError && <p className="text-red-400 text-xs mt-1">{otpError}</p>}
                </div>
                <PupButton type="button" onClick={onVerify2FA} disabled={is2FALoading} className="w-full py-3 disabled:opacity-60">
                  {is2FALoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</span> : "Verify & Login"}
                </PupButton>
                <button type="button" onClick={() => { setTwoFactorUserId(null); setOtpValue(""); setOtpError(null); }} className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  ← Back to login
                </button>
              </div>
            )}

            {/* ── Credentials Form ── */}
            {!twoFactorUserId && !passwordExpired && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                {/* Email / Username */}
                <FormField<LoginValues> name="username" label="PUP Webmail" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <div className="relative">
                      <PupInput
                        id={id}
                        type="text"
                        autoComplete="email"
                        placeholder="name@iskolarngbayan.pup.edu.ph"
                        {...register("username")}
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

                {/* Password */}
                <FormField<LoginValues> name="password" label="Password" errors={errors} required>
                  {({ id, hasError, ariaDescribedBy }) => (
                    <div className="relative">
                      <PupInput
                        id={id}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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
                          {showPassword
                            ? <MdVisibilityOff className="w-4.5 h-4.5" />
                            : <MdVisibility className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </FormField>

                {/* Forgot Password */}
                <div className="flex justify-end -mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium transition-colors duration-200"
                    style={{ color: "#800000" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#eab308")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#800000")}
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Inline error */}
                {loginError && (
                  <p className="text-sm text-red-400 text-center flex items-center justify-center gap-1.5" role="alert">
                    <span aria-hidden>✕</span> {loginError}
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
                      Logging in…
                    </span>
                  ) : "Login"}
                </PupButton>

                <p className="text-center text-sm text-gray-400">
                  Don't have an account yet?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-yellow-500 hover:text-yellow-400 transition-colors duration-200 underline decoration-red-700/50 underline-offset-4"
                  >
                    Sign up here
                  </Link>
                </p>

              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;

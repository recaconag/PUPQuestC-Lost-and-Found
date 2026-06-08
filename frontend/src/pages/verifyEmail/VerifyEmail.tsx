import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useVerifyOtpMutation, useResendOtpMutation } from "../../redux/api/api";
import { setAccessToken } from "../../auth/auth";
import { FaCheckCircle, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { verifyEmailOtpSchema, type VerifyEmailOtpValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";

const RESEND_COOLDOWN = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const {
    handleSubmit: handleFormSubmit,
    setValue,
    formState: { errors },
  } = useZodForm<typeof verifyEmailOtpSchema, VerifyEmailOtpValues>(verifyEmailOtpSchema, {
    defaultValues: { otp: "" },
  });

  /* ── focus first input on mount ── */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* ── countdown timer for resend ── */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ── redirect if no email param ── */
  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);
    setValue("otp", next.join(""), { shouldValidate: true });
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = useCallback(async (data: VerifyEmailOtpValues) => {
    try {
      const res: any = await verifyOtp({ email, otp: data.otp }).unwrap();
      if (res?.data?.token) {
        setAccessToken(res.data.token);
      }
      setIsSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2200);
    } catch (err: any) {
      setDigits(["", "", "", "", "", ""]);
      setValue("otp", "", { shouldValidate: true });
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [email, verifyOtp, navigate, setValue]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    try {
      await resendOtp({ email }).unwrap();
      setCooldown(RESEND_COOLDOWN);
      setDigits(["", "", "", "", "", ""]);
      setValue("otp", "", { shouldValidate: true });
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      // Error is handled by the form validation
    }
  };

  /* ── success screen ── */
  if (isSuccess) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="glass-card rounded-2xl p-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] ring-2 ring-green-500/30">
              <FaCheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Verified!</h2>
            <p className="text-gray-400 text-sm">Redirecting you to the dashboard…</p>
            <div className="mt-6 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-yellow-500 rounded-full animate-[grow_2.2s_ease-out_forwards]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl overflow-hidden">

          {/* Header band */}
          <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-8 py-6 text-center border-b border-yellow-600/20">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <FaEnvelope className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Verify Your Email</h1>
            <p className="text-yellow-100/70 text-sm">
              We sent a 6-digit code to
            </p>
            <p className="text-yellow-400 font-semibold text-sm mt-0.5 truncate">
              {email}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
              Enter the verification code below. It expires in{" "}
              <span className="text-yellow-400 font-semibold">10 minutes</span>.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(onSubmit)(e); }}>
              {/* OTP inputs */}
              <div
                className="flex justify-center gap-3 mb-6"
                onPaste={handlePaste}
              >
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`Digit ${i + 1}`}
                    aria-invalid={errors.otp ? true : undefined}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-800/60 text-white outline-none transition-all duration-200 caret-transparent
                      ${errors.otp
                        ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                        : digit
                          ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                          : "border-red-900/50 hover:border-red-800/70 focus:border-yellow-500 focus:shadow-[0_0_14px_rgba(234,179,8,0.3)]"
                      }`}
                  />
                ))}
              </div>

              {/* Error */}
              {errors.otp && (
                <p className="text-red-400 text-sm text-center mb-4 flex items-center justify-center gap-1.5" role="alert">
                  <span aria-hidden>✕</span> {errors.otp.message}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isVerifying || digits.join("").length < 6}
                className="w-full py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 border border-red-600/50 shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500/70"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : "Verify Account"}
              </button>
            </form>

            {/* Resend */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="text-sm font-semibold text-yellow-500 hover:text-yellow-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : isResending
                    ? "Sending…"
                    : "Resend Code"}
              </button>
            </div>

            {/* Back link */}
            <div className="mt-6 pt-5 border-t border-gray-700/50 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200"
              >
                <FaArrowLeft className="w-3 h-3" />
                Back to Registration
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;

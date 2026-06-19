"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { Heart, Shield, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA specific states
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [tempAuthData, setTempAuthData] = useState<any>(null);

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      if (user.role !== "admin") {
        setError("Access denied. This portal is restricted to admin users only.");
        setLoading(false);
        return;
      }

      const is2faEnabled = localStorage.getItem("admin_2fa_enabled") === "true";

      if (is2faEnabled) {
        setTempAuthData({ user, accessToken, refreshToken });
        setStep(2);
      } else {
        setAuth(user, accessToken, refreshToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Mock network delay
      await new Promise((res) => setTimeout(res, 800));

      if (otp.length < 6) {
        throw new Error("Invalid verification code. Please enter 6 digits.");
      }

      // Success
      if (tempAuthData) {
        setAuth(tempAuthData.user, tempAuthData.accessToken, tempAuthData.refreshToken);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-800/6 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(109,71,252,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(109,71,252,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-glow-brand">
            <Heart className="w-7 h-7 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-1">MomPlan Admin</h1>
          <p className="text-slate-500 text-sm">Internal Operations Portal</p>
        </div>

        {/* Card */}
        <div className="card p-8 backdrop-blur-sm border-slate-700/60">
          {/* Security notice */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-brand-500/8 border border-brand-500/20 mb-6">
            <Shield className="w-4 h-4 text-brand-400 shrink-0" />
            <p className="text-xs text-brand-300 font-medium">
              Restricted access. Admin credentials required.
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@momplan.com"
                  required
                  className="input"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <button
                id="admin-login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In to Admin Portal
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-5 animate-fade-in">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-400">
                  Enter the 6-digit verification code from your authenticator app.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center block">
                  Verification Code
                </label>
                <input
                  id="admin-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="000 000"
                  required
                  autoFocus
                  className="input w-full text-center text-2xl tracking-[0.5em] font-mono py-4"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="btn-secondary py-3 flex-1 justify-center"
                >
                  Back
                </button>
                <button
                  id="admin-2fa-submit"
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn-primary flex-[2] justify-center py-3 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Verify & Login"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          This portal is for MomPlan administrators only. All activity is logged and monitored.
        </p>
      </div>
    </div>
  );
}

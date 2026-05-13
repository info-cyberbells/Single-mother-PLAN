"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    try {
      const response = await api.post("/api/auth/login", data);
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4" suppressHydrationWarning>
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl pointer-events-none" suppressHydrationWarning />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-100/40 rounded-full blur-3xl pointer-events-none" suppressHydrationWarning />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <Heart className="w-5.5 h-5.5 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-2xl text-on-surface">
              Mom<span className="text-gradient">Plan</span>
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card padding="lg" className="shadow-glass-lg">
            <div className="mb-8">
              <h1 className="font-display font-bold text-2xl text-on-surface mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-on-surface-variant">
                Sign in to your MomPlan account to continue
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                autoComplete="email"
                {...register("email")}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="hover:text-primary-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                autoComplete="current-password"
                {...register("password")}
              />

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary-500 hover:text-primary-600 font-semibold"
              >
                Sign up free
              </Link>
            </p>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-on-surface-variant mt-6 opacity-60">
          Protected by HIPAA-compliant security • 256-bit encryption
        </p>
      </div>
    </div>
  );
}

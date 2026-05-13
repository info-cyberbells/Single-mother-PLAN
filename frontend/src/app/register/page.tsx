"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
};

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");
  const strength = passwordStrength(password || "");

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    try {
      const response = await api.post("/api/auth/register", {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 py-12" suppressHydrationWarning>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl pointer-events-none" suppressHydrationWarning />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-100/40 rounded-full blur-3xl pointer-events-none" suppressHydrationWarning />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
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
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-on-surface mb-1">
                Create your account
              </h1>
              <p className="text-sm text-on-surface-variant">
                Start discovering benefits your family qualifies for{" "}
                {plan !== "free" && (
                  <span className="font-medium text-primary-600">
                    • {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                  </span>
                )}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                type="text"
                placeholder="Maria Johnson"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                autoComplete="name"
                {...register("full_name")}
              />

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
                label="Phone Number"
                type="tel"
                placeholder="(555) 000-0000 (optional)"
                leftIcon={<Phone className="w-4 h-4" />}
                hint="For deadline SMS alerts"
                {...register("phone")}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="hover:text-primary-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  autoComplete="new-password"
                  {...register("password")}
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < strength ? strengthColors[strength] : "bg-surface-container"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Strength:{" "}
                      <span className={strength >= 3 ? "text-emerald-600" : "text-amber-600"}>
                        {strengthLabels[strength]}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full mt-2"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Benefits of signing up */}
            <div className="mt-6 pt-6 border-t border-outline-variant/20">
              <p className="text-xs text-on-surface-variant mb-3 font-medium">What you get for free:</p>
              <ul className="space-y-2">
                {[
                  "Basic eligibility scan across 200+ programs",
                  "Personalized benefit dashboard",
                  "Application tracking",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
                Sign in
              </Link>
            </p>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-on-surface-variant mt-6 opacity-60">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

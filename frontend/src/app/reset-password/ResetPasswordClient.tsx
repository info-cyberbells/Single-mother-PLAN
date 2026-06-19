"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Heart, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setError("");
    try {
      await api.post("/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to reset password. The link might be expired."
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
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="font-display font-bold text-2xl text-on-surface mb-3">
                  Password Reset!
                </h1>
                <p className="text-sm text-on-surface-variant mb-8 px-4">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Link href="/login" className="block w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Proceed to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="font-display font-bold text-2xl text-on-surface mb-1">
                    Set New Password
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Please enter your new password below.
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
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
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
                    error={errors.newPassword?.message}
                    disabled={!token}
                    {...register("newPassword")}
                  />

                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="hover:text-primary-500 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    error={errors.confirmPassword?.message}
                    disabled={!token}
                    {...register("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={!token}
                    className="w-full"
                  >
                    Update Password
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </Card>
        </motion.div>

        <p className="text-center text-xs text-on-surface-variant mt-6 opacity-60">
          Protected by HIPAA-compliant security • 256-bit encryption
        </p>
      </div>
    </div>
  );
}

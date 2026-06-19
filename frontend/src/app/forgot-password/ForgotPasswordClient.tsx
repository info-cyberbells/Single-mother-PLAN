"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Heart, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordClient() {
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("");
    try {
      await api.post("/api/auth/forgot-password", data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to process request. Please try again."
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
                  Check your inbox
                </h1>
                <p className="text-sm text-on-surface-variant mb-8 px-4">
                  We've sent a password reset link to your email address. It may take a few minutes to arrive.
                </p>
                <Link href="/login" className="block w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="font-display font-bold text-2xl text-on-surface mb-1">
                    Forgot Password
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Enter your email to receive a password reset link.
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

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                <div className="mt-6">
                  <Link href="/login" className="flex items-center justify-center text-sm text-on-surface-variant hover:text-primary-600 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
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

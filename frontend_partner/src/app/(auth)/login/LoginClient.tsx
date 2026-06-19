"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Heart } from "lucide-react";
import { usePartnerAuthStore } from "@/store/auth.store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMotherPortalUrl } from "@/lib/portal-urls";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginClient() {
  const [showPwd, setShowPwd] = useState(false);
  const { login, isAuthenticated } = usePartnerAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = searchParams.get("next");
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeNext);
    }
  }, [isAuthenticated, router, safeNext]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const user = await login(data.email, data.password);
      router.push(user.must_change_password ? "/change-password" : safeNext);
    } catch {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col bg-gradient-partner relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col h-full px-12 py-14">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">MomPlan</div>
              <div className="text-white/60 text-xs font-medium tracking-wide uppercase">Partner Portal</div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="py-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-extrabold text-white leading-tight mb-5"
            >
              Empowering<br />
              <span className="text-partner-200">Communities,</span><br />
              Together
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="text-white/70 text-base leading-relaxed max-w-xs"
            >
              Manage cases, referrals, and community impact for mothers and families in your care.
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="grid grid-cols-3 gap-4 mt-auto"
          >
            {[
              { value: "2,400+", label: "Organizations" },
              { value: "48K+", label: "Mothers Served" },
              { value: "98%", label: "Satisfaction" },
            ].map((s) => (
              <div
                key={s.label}
                className="sidebar-glass rounded-2xl p-4 text-center"
              >
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-white/55 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-partner rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-text-dark text-lg">MomPlan Partner</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-text-dark mb-2">Welcome back 🌸</h2>
            <p className="text-text-mid text-sm leading-relaxed">
              Sign in to your partner account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address <span className="text-primary-500">*</span></Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@organization.com"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-status-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password <span className="text-primary-500">*</span></Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={!!errors.password}
                  className="pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft hover:text-text-mid transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-status-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Sign in <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-text-soft">
              <a
                href={getMotherPortalUrl("/login")}
                className="text-primary font-semibold hover:underline"
              >
                Sign in as a Mother instead
              </a>
            </p>
            <p className="text-sm text-text-soft">
              New to MomPlan Partner?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Register your organization
              </Link>
            </p>
          </div>

          <p className="mt-10 text-center text-xs text-text-soft leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">Terms of Service</a> and{" "}
            <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

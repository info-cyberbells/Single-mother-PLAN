"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Menu, X, Heart, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDashboardNav = () => {
    if (user?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-glass border-b border-outline-variant/10"
          : "bg-transparent"
      )}
    >
      <nav className="container-max section-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="MomPlan home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary group-hover:shadow-primary-lg transition-shadow duration-200">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-xl text-on-surface">
              Mom<span className="text-gradient">Plan</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleDashboardNav}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  Dashboard
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                  {user?.full_name?.charAt(0) || "M"}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary-500 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-primary shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-outline-variant/20 mt-2 py-4 bg-white/95 backdrop-blur-md rounded-b-2xl">
            <ul className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 px-1">
              {isAuthenticated ? (
                <button
                  onClick={handleDashboardNav}
                  className="flex items-center justify-center w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-primary shadow-primary hover:shadow-primary-lg transition-all duration-200"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-center w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-primary shadow-primary hover:shadow-primary-lg transition-all duration-200"
                >
                  Get Started Free
                </Link>
              </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

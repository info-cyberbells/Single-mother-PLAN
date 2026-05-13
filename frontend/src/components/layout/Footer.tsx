"use client";

import Link from "next/link";
import { Heart, Twitter, Facebook, Instagram, Mail } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Security", href: "#security" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "HIPAA Compliance", href: "/hipaa" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-on-surface text-white">
      {/* Main Footer */}
      <div className="container-max section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="font-display font-bold text-xl text-white">MomPlan</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-xs">
              Empowering caregivers with the benefits they've earned. Supporting families with empathy and technology.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[Twitter, Facebook, Instagram, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm text-white mb-4 tracking-wide uppercase">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-max section-padding py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © 2024 MomPlan Inc. Supporting families with empathy.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

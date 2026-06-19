"use client";

import { Bell, Search } from "lucide-react";
import { usePartnerAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, getGreeting } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  const { user } = usePartnerAuthStore();

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-surface-border sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        {title ? (
          <>
            <h1 className="text-xl font-extrabold text-text-dark leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-text-soft mt-0.5 truncate">{description}</p>
            )}
          </>
        ) : (
          <div>
            <div className="text-sm text-text-soft font-medium">
              {getGreeting()}, {user?.full_name?.split(" ")[0] ?? "Partner"} 🌸
            </div>
            <h1 className="text-xl font-extrabold text-text-dark leading-tight">
              Partner Dashboard
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-4">
        {action}

        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-subtle border border-surface-border text-text-soft hover:text-text-mid hover:border-primary-lighter transition-all text-sm">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Search…</span>
          <kbd className="hidden sm:inline text-[10px] bg-white border border-surface-border rounded px-1 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-white" />
        </Button>

        {/* Avatar */}
        <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-partner-200 hover:ring-primary transition-all">
          <AvatarImage src={user?.avatar_url ?? ""} alt={user?.full_name} />
          <AvatarFallback>{initials(user?.full_name)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

import type { PartnerUser } from "@/lib/api";

export function isOrgAdmin(user: PartnerUser | null | undefined): boolean {
  return user?.role === "admin";
}

export const ADMIN_ONLY_ROUTES = ["/organization", "/team"];

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function parseEmailList(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    ),
  ];
}

export function generatePassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

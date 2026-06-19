const DEFAULT_MOTHER_URL = "http://localhost:3637";
const DEFAULT_APP_URL = "https://partner.momplan.ai";

function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

function normalizeBase(url: string): string {
  return ensureProtocol(url).replace(/\/$/, "");
}

export function getAppUrl(): string {
  return normalizeBase(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL);
}

function joinPath(base: string, path: string): string {
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getMotherPortalUrl(path = ""): string {
  const base = normalizeBase(
    process.env.NEXT_PUBLIC_MOTHER_PORTAL_URL ?? DEFAULT_MOTHER_URL,
  );
  return joinPath(base, path);
}

import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE = "mp_org_rt";

const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

function normalizeBackendUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getBackendUrl(): string {
  const url = normalizeBackendUrl(
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || ""
  );
  if (!url) {
    throw new Error("BACKEND_URL is not configured");
  }
  return url;
}

function readCookieValue(setCookieHeader: string, name: string): string | null {
  if (!setCookieHeader.startsWith(`${name}=`)) return null;
  const end = setCookieHeader.indexOf(";");
  const raw =
    end === -1
      ? setCookieHeader.slice(name.length + 1)
      : setCookieHeader.slice(name.length + 1, end);
  return raw;
}

function readMaxAge(setCookieHeader: string): number | undefined {
  const match = setCookieHeader.match(/Max-Age=(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function applyRefreshCookie(
  backendResponse: Response,
  nextResponse: NextResponse
) {
  const isProduction = process.env.NODE_ENV === "production";
  const setCookies = backendResponse.headers.getSetCookie?.() ?? [];

  for (const header of setCookies) {
    if (!header.startsWith(`${REFRESH_COOKIE}=`)) continue;

    const value = readCookieValue(header, REFRESH_COOKIE);
    if (value === null) continue;

    const maxAge = readMaxAge(header);
    const clearing = value === "" || maxAge === 0;

    nextResponse.cookies.set(REFRESH_COOKIE, clearing ? "" : value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      ...(clearing
        ? { maxAge: 0 }
        : { maxAge: maxAge ?? 60 * 60 * 24 * 30 }),
    });
  }
}

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const backendUrl = getBackendUrl();
  const pathname = pathSegments.join("/");
  const targetUrl = `${backendUrl}/api/${pathname}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "content-length"
    )
      return;
    headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || STRIP_RESPONSE_HEADERS.has(lower)) return;
    responseHeaders.set(key, value);
  });

  const nextResponse = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });

  applyRefreshCookie(backendResponse, nextResponse);
  return nextResponse;
}

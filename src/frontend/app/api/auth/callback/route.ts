import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:5173";
const AUTH_COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * OAuth callback proxy - needed because:
 * 1. GitHub OAuth redirects must go to same-origin
 * 2. HttpOnly cookies must be set on frontend domain
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${FRONTEND_URL}?error=missing_params`, { status: 302 });
  }

  try {
    const backendUrl = `${BACKEND_URL}/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    const response = await fetch(backendUrl, { redirect: "manual" });

    if (response.status === 302) {
      const setCookieHeaders = response.headers.getSetCookie();
      const cookieStore = await cookies();
      const isProduction = process.env.NODE_ENV === "production";

      for (const cookieHeader of setCookieHeaders) {
        const authMatch = cookieHeader.match(/^auth_token=([^;]+)/);
        if (authMatch) {
          cookieStore.set(AUTH_COOKIE_NAME, authMatch[1], {
            httpOnly: true,
            maxAge: ACCESS_TOKEN_MAX_AGE,
            path: "/",
            sameSite: "lax",
            secure: isProduction,
          });
        }

        const refreshMatch = cookieHeader.match(/^refresh_token=([^;]+)/);
        if (refreshMatch) {
          cookieStore.set(REFRESH_COOKIE_NAME, refreshMatch[1], {
            httpOnly: true,
            maxAge: REFRESH_TOKEN_MAX_AGE,
            path: "/",
            sameSite: "strict",
            secure: isProduction,
          });
        }
      }

      return NextResponse.redirect(FRONTEND_URL, { status: 302 });
    }

    return NextResponse.redirect(`${FRONTEND_URL}?error=auth_failed`, { status: 302 });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${FRONTEND_URL}?error=network_error`, { status: 302 });
  }
}

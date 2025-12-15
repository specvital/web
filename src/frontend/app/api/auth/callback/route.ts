import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:5173";
const AUTH_COOKIE_NAME = "auth_token";
const MAX_COOKIE_AGE = 30 * 24 * 60 * 60; // 30 days

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
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/^auth_token=([^;]+)/);
        if (match) {
          const cookieStore = await cookies();
          cookieStore.set(AUTH_COOKIE_NAME, match[1], {
            httpOnly: true,
            maxAge: MAX_COOKIE_AGE,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
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

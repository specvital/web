import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, type Locale, locales } from "@/i18n/config";
import { routing } from "@/i18n/routing";

const AUTH_COOKIE_NAME = "auth_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const JWT_MIN_LENGTH = 20;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const intlMiddleware = createIntlMiddleware(routing);

const isHomePage = (pathname: string): boolean => {
  if (pathname === "/") return true;
  return locales.some((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
};

const isDashboardRoute = (pathname: string): boolean => {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/dashboard`) || pathname === `/${locale}/dashboard`
  );
};

const getLocaleFromRequest = (request: NextRequest, pathname: string): string => {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }

  const localeCookie = request.cookies.get("NEXT_LOCALE");
  if (localeCookie?.value && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value;
  }

  return defaultLocale;
};

const hasValidAuthCookie = (request: NextRequest): boolean => {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!cookie?.value) {
    return false;
  }

  if (cookie.value.length < JWT_MIN_LENGTH) {
    return false;
  }

  const parts = cookie.value.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return true;
};

const verifyAuthToken = async (request: NextRequest): Promise<boolean> => {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const refreshCookie = request.cookies.get(REFRESH_COOKIE_NAME);

  if (!authCookie?.value) {
    return false;
  }

  const cookieHeader = [
    `${AUTH_COOKIE_NAME}=${authCookie.value}`,
    refreshCookie?.value ? `${REFRESH_COOKIE_NAME}=${refreshCookie.value}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

const createRedirectWithCookieClear = (url: URL): NextResponse => {
  const response = NextResponse.redirect(url, 307);
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
};

const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const hasCookie = hasValidAuthCookie(request);
  const locale = getLocaleFromRequest(request, pathname);

  // Dashboard route: verify token with backend
  if (isDashboardRoute(pathname)) {
    if (!hasCookie) {
      const homeUrl = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(homeUrl, 307);
    }

    const isValid = await verifyAuthToken(request);
    if (!isValid) {
      const homeUrl = new URL(`/${locale}`, request.url);
      return createRedirectWithCookieClear(homeUrl);
    }
  }

  // Home page: redirect to dashboard if has valid cookie format
  if (isHomePage(pathname) && hasCookie) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl, 307);
  }

  return intlMiddleware(request);
};

export default proxy;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

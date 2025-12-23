import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, type Locale, locales } from "@/i18n/config";
import { routing } from "@/i18n/routing";

const AUTH_COOKIE_NAME = "auth_token";
const JWT_MIN_LENGTH = 20;

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

const proxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const hasAuth = hasValidAuthCookie(request);

  if (isHomePage(pathname) && hasAuth) {
    const locale = getLocaleFromRequest(request, pathname);
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl, 307);
  }

  if (isDashboardRoute(pathname) && !hasAuth) {
    const locale = getLocaleFromRequest(request, pathname);
    const homeUrl = new URL(`/${locale}`, request.url);
    return NextResponse.redirect(homeUrl, 307);
  }

  return intlMiddleware(request);
};

export default proxy;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

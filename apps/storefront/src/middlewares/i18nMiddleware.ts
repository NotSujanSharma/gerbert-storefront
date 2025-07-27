import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { COOKIE_KEY, COOKIE_MAX_AGE } from "@/config";
import { localePrefixes, routing } from "@/i18n/routing";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/regions/types";
import { storefrontLogger } from "@/services/logging";

import type { CustomMiddleware } from "./chain";

// Vercel geolocation types
interface VercelGeoLocation {
  city?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  region?: string;
}

interface NextRequestWithGeo extends NextRequest {
  geo?: VercelGeoLocation;
}

function getLocaleFromGeolocation(
  request: NextRequest,
): SupportedLocale | null {

  // Try to get country from Vercel's geolocation data
  const requestWithGeo = request as NextRequestWithGeo;
  const countryFromGeo = requestWithGeo.geo?.country;
  const countryFromHeader = request.headers.get("x-vercel-ip-country");
  const country = countryFromGeo || countryFromHeader;


  if (!country) {
    return null;
  }

  // Map country codes to locales
  const upperCountry = country.toUpperCase();

  let locale: SupportedLocale;

  switch (upperCountry) {
    case "CA":
      locale = "en-CA";
      break;
    case "GB":
      locale = "en-GB";
      break;
    case "US":
      locale = "en-US";
      break;
    default:
      locale = DEFAULT_LOCALE;
      break;
  }

  return locale;
}

function getLocaleFromBrowser(request: NextRequest): SupportedLocale {
  const languages = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") || "",
    },
  }).languages();

  const matchedLanguage = match(languages, SUPPORTED_LOCALES, DEFAULT_LOCALE);

  if (SUPPORTED_LOCALES.includes(matchedLanguage)) {
    return matchedLanguage as SupportedLocale;
  }

  storefrontLogger.warning(
    `Locale "${matchedLanguage}" is not supported. Falling back to default locale "${DEFAULT_LOCALE}".`,
  );

  return DEFAULT_LOCALE;
}

function getLocale(request: NextRequest): SupportedLocale {
  // First try geolocation-based detection
  const localeFromGeo = getLocaleFromGeolocation(request);

  if (localeFromGeo) {
    const requestWithGeo = request as NextRequestWithGeo;

    storefrontLogger.debug(
      `Using geolocation-based locale detection: ${localeFromGeo}`,
      {
        country:
          requestWithGeo.geo?.country ||
          request.headers.get("x-vercel-ip-country"),
      },
    );

    return localeFromGeo;
  }

  // Fallback to browser language detection

  storefrontLogger.debug(
    "Geolocation data unavailable, falling back to browser language detection",
  );

  const browserLocale = getLocaleFromBrowser(request);

  return browserLocale;
}

export function i18nMiddleware(next: CustomMiddleware): CustomMiddleware {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    prevResponse: NextResponse,
  ) => {

    const isRequestPrefetch = request.headers.get("x-nextjs-prefetch") === "1";
    const isRequestFromBot = request.headers
      .get("user-agent")
      ?.toLowerCase()
      .includes("bot");
    const isOptionsRequest =
      request.method === "OPTIONS" ||
      request.headers.get("x-middleware-preflight") === "1";

    if (isRequestPrefetch || isRequestFromBot || isOptionsRequest) {
      // INFO: Skip i18n middleware for prefetch requests, bot requests, and OPTIONS requests

      storefrontLogger.debug(
        `Skipping i18n middleware for request: ${request.method} ${request.url}`,
        {
          isRequestPrefetch,
          isRequestFromBot,
          isOptionsRequest,
        },
      );

      return next(request, event, prevResponse);
    }

    const pathname = request.nextUrl.pathname;

    const localePrefix = Object.values(localePrefixes).find(
      (localePrefix) =>
        pathname.startsWith(localePrefix) || pathname === localePrefix,
    );

    const isLocalePrefixedPathname = !!localePrefix;

    // Check if user is visiting root path and needs to be redirected
    if (pathname === "/") {
      // First check existing cookie for preferred locale
      const localeFromCookie = request.cookies.get(COOKIE_KEY.locale)?.value as
        | SupportedLocale
        | undefined;

      // Get locale from geolocation or browser detection
      const localeFromRequest = getLocale(request);

      // Determine which locale to use (cookie takes precedence if it exists)
      const targetLocale = localeFromCookie || localeFromRequest;

      // Redirect to locale-specific path if not default locale
      if (targetLocale !== DEFAULT_LOCALE) {
        const targetPrefix =
          localePrefixes[
            targetLocale as Exclude<SupportedLocale, typeof DEFAULT_LOCALE>
          ];

        if (targetPrefix) {
          const redirectUrl = new URL(targetPrefix, request.url);

          storefrontLogger.debug(
            `Redirecting user from root path to locale-specific path: ${targetLocale}`,
            {
              requestUrl: request.url,
              targetLocale,
              redirectUrl: redirectUrl.toString(),
            },
          );

          return NextResponse.redirect(redirectUrl, 307); // Temporary redirect
        }
      }
    }

    let localeFromRequest = getLocale(request);

    const handleI18nRouting = createIntlMiddleware(routing);
    const response = handleI18nRouting(request);

    // INFO: All routes have locale prefixes except for default locale/domain - "/".
    // If the user types only domain name it should be navigated to preferred region of the store,
    // otherwise navigate to the requested locale prefixed pathname
    if (isLocalePrefixedPathname) {
      localeFromRequest =
        (Object.keys(localePrefixes).find(
          (key) =>
            localePrefixes[
              key as Exclude<SupportedLocale, typeof DEFAULT_LOCALE>
            ] === localePrefix,
        ) as SupportedLocale) ?? DEFAULT_LOCALE;
    }

    // INFO: Store the locale in the cookie to know if the locale has changed between requests
    response.cookies.set(COOKIE_KEY.locale, localeFromRequest, {
      maxAge: COOKIE_MAX_AGE.locale,
    });

    const localeFromCookie = request.cookies.get(COOKIE_KEY.locale)?.value;

    if (localeFromCookie && localeFromRequest !== localeFromCookie) {
      storefrontLogger.debug(
        `Locale changed from ${localeFromCookie} to ${localeFromRequest}. Removing the checkoutId cookie.`,
        {
          requestUrl: request.url,
          nextUrl: request.nextUrl.toString(),
        },
      );

      response.cookies.delete(COOKIE_KEY.checkoutId);
    }

    return next(request, event, response);
  };
}

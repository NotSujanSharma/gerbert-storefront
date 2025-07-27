import { type NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { COOKIE_KEY } from "@/config";
import { type CustomMiddleware } from "@/middlewares/chain";
import { DEFAULT_LOCALE } from "@/regions/types";

import { i18nMiddleware } from "./i18nMiddleware";

describe("i18nMiddleware", () => {
  const mockNextMiddleware: CustomMiddleware = (_req, _event, response) =>
    response;
  const mockedFetchEvent = {} as NextFetchEvent;

  // Helper function to create NextRequest with geolocation data
  const createRequestWithGeo = (url: string, country?: string) => {
    const request = new NextRequest(new Request(url));

    if (country) {
      // Mock geo property
      Object.defineProperty(request, "geo", {
        value: { country },
        writable: true,
        configurable: true,
      });
    }

    return request;
  };

  // Helper function to create NextRequest with x-vercel-ip-country header
  const createRequestWithCountryHeader = (url: string, country: string) => {
    const request = new NextRequest(
      new Request(url, {
        headers: {
          "x-vercel-ip-country": country,
        },
      }),
    );

    return request;
  };

  it("set the default locale when there's no prefix and locale cookie set", async () => {
    const initialRequest = new NextRequest(
      new Request("https://demo.nimara.store/products/test-product"),
    );
    const initialResponse = new NextResponse();

    const resp = await i18nMiddleware(mockNextMiddleware)(
      initialRequest,
      mockedFetchEvent,
      initialResponse,
    );

    const cookiesHeader = resp?.headers.get("set-cookie");

    expect(resp?.status).toBe(200);
    expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=${DEFAULT_LOCALE};`);
  });

  it("set the en-GB locale when there's /gb locale prefix in the request", async () => {
    const initialRequest = new NextRequest(
      new Request("https://demo.nimara.store/gb/products/test-product"),
    );
    const initialResponse = new NextResponse();

    const resp = await i18nMiddleware(mockNextMiddleware)(
      initialRequest,
      mockedFetchEvent,
      initialResponse,
    );

    const cookiesHeader = resp?.headers.get("set-cookie");

    expect(resp?.status).toBe(200);
    expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-GB;`);
  });

  it("set the en-US locale when there's a en-GB locale cookie set", async () => {
    const initialRequest = new NextRequest(
      new Request("https://demo.nimara.store/products/test-product"),
    );
    const initialResponse = new NextResponse();

    initialRequest.cookies.set(COOKIE_KEY.locale, "en-GB");

    const resp = await i18nMiddleware(mockNextMiddleware)(
      initialRequest,
      mockedFetchEvent,
      initialResponse,
    );

    const cookiesHeader = resp?.headers.get("set-cookie");

    expect(resp?.status).toBe(200);
    expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-US;`);
  });

  it("remove the checkout cookie on locale change from /gb to /", async () => {
    const initialRequest = new NextRequest(
      new Request("https://demo.nimara.store/gb/products/test-product"),
    );
    const initialResponse = new NextResponse();

    initialRequest.cookies.set(COOKIE_KEY.locale, "en-US");
    initialRequest.cookies.set(COOKIE_KEY.checkoutId, "321");

    const resp = await i18nMiddleware(mockNextMiddleware)(
      initialRequest,
      mockedFetchEvent,
      initialResponse,
    );

    const cookiesHeader = resp?.headers.get("set-cookie");

    expect(resp?.status).toBe(200);
    expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-GB;`);
    expect(cookiesHeader).includes(`${COOKIE_KEY.checkoutId}=;`);
  });

  it("remove the checkout cookie on locale change from / to /gb", async () => {
    const initialRequest = new NextRequest(
      new Request("https://demo.nimara.store/products/test-product"),
    );
    const initialResponse = new NextResponse();

    initialRequest.cookies.set(COOKIE_KEY.locale, "en-GB");
    initialRequest.cookies.set(COOKIE_KEY.checkoutId, "321");

    const resp = await i18nMiddleware(mockNextMiddleware)(
      initialRequest,
      mockedFetchEvent,
      initialResponse,
    );

    const cookiesHeader = resp?.headers.get("set-cookie");

    expect(resp?.status).toBe(200);
    expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-US;`);
    expect(cookiesHeader).includes(`${COOKIE_KEY.checkoutId}=;`);
  });

  it.each([
    { locale: "en-US", path: "products/test-product" },
    { locale: "en-GB", path: "gb/products/test-product" },
  ])(
    "should keep the checkout id cookie between page refresh with $locale locale",
    async ({ locale, path }) => {
      const initialRequest = new NextRequest(
        new Request(`https://demo.nimara.store/${path}`),
      );
      const initialResponse = new NextResponse();

      initialRequest.cookies.set(COOKIE_KEY.locale, locale);
      initialRequest.cookies.set(COOKIE_KEY.checkoutId, "321");

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=${locale};`);
      expect(cookiesHeader).not.includes(`${COOKIE_KEY.checkoutId};`);
    },
  );

  describe("redirect behavior", () => {
    it("should redirect Canadian users from root path to /ca using geolocation", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/",
        "CA",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(307); // Temporary redirect
      expect(resp?.headers.get("location")).toBe(
        "https://demo.nimara.store/ca",
      );
    });

    it("should redirect UK users from root path to /gb using geolocation", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/",
        "GB",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(307); // Temporary redirect
      expect(resp?.headers.get("location")).toBe(
        "https://demo.nimara.store/gb",
      );
    });

    it("should NOT redirect US users from root path (default locale)", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/",
        "US",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(200); // No redirect
      expect(resp?.headers.get("location")).toBeNull();
    });

    it("should redirect users with en-CA cookie from root path to /ca", async () => {
      const initialRequest = new NextRequest(
        new Request("https://demo.nimara.store/"),
      );
      const initialResponse = new NextResponse();

      initialRequest.cookies.set(COOKIE_KEY.locale, "en-CA");

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(307); // Temporary redirect
      expect(resp?.headers.get("location")).toBe(
        "https://demo.nimara.store/ca",
      );
    });

    it("should redirect users with en-GB cookie from root path to /gb", async () => {
      const initialRequest = new NextRequest(
        new Request("https://demo.nimara.store/"),
      );
      const initialResponse = new NextResponse();

      initialRequest.cookies.set(COOKIE_KEY.locale, "en-GB");

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(307); // Temporary redirect
      expect(resp?.headers.get("location")).toBe(
        "https://demo.nimara.store/gb",
      );
    });

    it("should NOT redirect users with en-US cookie from root path", async () => {
      const initialRequest = new NextRequest(
        new Request("https://demo.nimara.store/"),
      );
      const initialResponse = new NextResponse();

      initialRequest.cookies.set(COOKIE_KEY.locale, "en-US");

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(200); // No redirect
      expect(resp?.headers.get("location")).toBeNull();
    });

    it("should NOT redirect from locale-prefixed paths", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/gb/products/test-product",
        "CA", // Canadian user on GB path should not be redirected
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      expect(resp?.status).toBe(200); // No redirect
      expect(resp?.headers.get("location")).toBeNull();
    });
  });

  describe("geolocation-based locale detection", () => {
    it("should set en-CA locale for Canadian visitors using request.geo.country", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/products/test-product",
        "CA",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-CA;`);
    });

    it("should set en-GB locale for UK visitors using request.geo.country", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/products/test-product",
        "GB",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-GB;`);
    });

    it("should set en-US locale for US visitors using request.geo.country", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/products/test-product",
        "US",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-US;`);
    });

    it("should fallback to en-US for other countries using request.geo.country", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/products/test-product",
        "FR",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-US;`);
    });

    it("should set en-CA locale for Canadian visitors using x-vercel-ip-country header", async () => {
      const initialRequest = createRequestWithCountryHeader(
        "https://demo.nimara.store/products/test-product",
        "CA",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-CA;`);
    });

    it("should set en-GB locale for UK visitors using x-vercel-ip-country header", async () => {
      const initialRequest = createRequestWithCountryHeader(
        "https://demo.nimara.store/products/test-product",
        "GB",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-GB;`);
    });

    it("should prefer request.geo.country over x-vercel-ip-country header", async () => {
      const initialRequest = createRequestWithGeo(
        "https://demo.nimara.store/products/test-product",
        "CA",
      );
      // Add conflicting header

      initialRequest.headers.set("x-vercel-ip-country", "GB");
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-CA;`);
    });

    it("should fallback to browser language detection when no geolocation data is available", async () => {
      const initialRequest = new NextRequest(
        new Request("https://demo.nimara.store/products/test-product", {
          headers: {
            "accept-language": "en-GB,en;q=0.9",
          },
        }),
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-GB;`);
    });

    it("should handle case-insensitive country codes", async () => {
      const initialRequest = createRequestWithCountryHeader(
        "https://demo.nimara.store/products/test-product",
        "ca",
      );
      const initialResponse = new NextResponse();

      const resp = await i18nMiddleware(mockNextMiddleware)(
        initialRequest,
        mockedFetchEvent,
        initialResponse,
      );

      const cookiesHeader = resp?.headers.get("set-cookie");

      expect(resp?.status).toBe(200);
      expect(cookiesHeader).includes(`${COOKIE_KEY.locale}=en-CA;`);
    });
  });
});

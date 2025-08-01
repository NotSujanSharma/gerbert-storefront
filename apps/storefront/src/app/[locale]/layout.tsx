import "@nimara/ui/styles/globals";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import { Toaster } from "@nimara/ui/components/toaster";

import { ErrorServiceServer } from "@/components/error-service";
import { clientEnvs } from "@/envs/client";
import { aspekta } from "@/fonts";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { type SupportedLocale } from "@/regions/types";

export const metadata: Metadata = {
  title: {
    template: `%s | ${clientEnvs.NEXT_PUBLIC_DEFAULT_PAGE_TITLE}`,
    default: clientEnvs.NEXT_PUBLIC_DEFAULT_PAGE_TITLE,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: SupportedLocale }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale ?? "en"}>
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-H3PLSFB0XN"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-H3PLSFB0XN', {
                      page_path: window.location.pathname,
                    });
                  `,
          }}
        />
      </head>
      <body
        className={cn("min-h-[100dvh]", "flex flex-col", aspekta.className)}
      >
        <NextIntlClientProvider messages={messages}>
          <NuqsAdapter>
            {children}
            <SpeedInsights />
            <Toaster />
            <ErrorServiceServer />
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

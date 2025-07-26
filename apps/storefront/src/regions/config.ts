import type {
  Language,
  LanguageId,
  Market,
  MarketId,
  SUPPORTED_MARKETS,
  SupportedLocale,
} from "@/regions/types";

export const LOCALE_CHANNEL_MAP: Record<
  SupportedLocale,
  (typeof SUPPORTED_MARKETS)[number]
> = {
  "en-GB": "gb",
  "en-US": "us",
  "en-CA": "ca",
};

export const LANGUAGES = {
  GB: {
    id: "gb",
    name: "English (United Kingdom)",
    code: "EN_GB",
    locale: "en-GB",
  },
  US: {
    id: "us",
    name: "English (United States)",
    code: "EN_US",
    locale: "en-US",
  },
  CA: {
    id: "ca",
    name: "English (Canada)",
    code: "EN_CA",
    locale: "en-CA",
  },
} satisfies Record<Uppercase<LanguageId>, Language>;

export const MARKETS = {
  GB: {
    id: "gb",
    name: "United Kingdom",
    channel: "uk",
    currency: "GBP",
    continent: "Europe",
    countryCode: "GB",
    defaultLanguage: LANGUAGES.GB,
    supportedLanguages: [LANGUAGES.GB],
  },
  US: {
    id: "us",
    name: "United States of America",
    channel: "us",
    currency: "USD",
    continent: "North America",
    countryCode: "US",
    defaultLanguage: LANGUAGES.US,
    supportedLanguages: [LANGUAGES.US],
  },
  CA: {
    id: "ca",
    name: "Canada",
    channel: "ca",
    currency: "CAD",
    continent: "North America",
    countryCode: "CA",
    defaultLanguage: LANGUAGES.CA,
    supportedLanguages: [LANGUAGES.CA],
  },
} satisfies Record<Uppercase<MarketId>, Market>;

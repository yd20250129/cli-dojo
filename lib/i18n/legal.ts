import type { LegalDocumentKind, Locale, Region } from "@/types";

const defaultUrls: Record<LegalDocumentKind, string> = {
  terms: "/legal/terms",
  privacy: "/legal/privacy",
};

const regionLocaleUrls: Partial<
  Record<Region, Partial<Record<Locale, Partial<Record<LegalDocumentKind, string>>>>>
> = {
  JP: {
    ja: {
      terms: "/legal/terms",
      privacy: "/legal/privacy",
    },
    en: {
      terms: "/legal/terms?locale=en",
      privacy: "/legal/privacy?locale=en",
    },
  },
  US: {
    en: {
      terms: "/legal/terms?region=US",
      privacy: "/legal/privacy?region=US",
    },
  },
};

export function getLegalUrl(kind: LegalDocumentKind, locale: Locale, region: Region) {
  return regionLocaleUrls[region]?.[locale]?.[kind] ?? defaultUrls[kind];
}

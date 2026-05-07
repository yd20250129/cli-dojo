import type { LegalDocumentKind, Locale, Region } from "@/types";

const githubPagesBaseUrl =
  process.env.NEXT_PUBLIC_GITHUB_PAGES_BASE_URL ?? "https://yd20250129.github.io/cli-dojo";
const privacyPolicyUrl =
  process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL ?? `${githubPagesBaseUrl}/privacy-policy/`;
const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL ?? `${githubPagesBaseUrl}/terms/`;

const defaultUrls: Record<LegalDocumentKind, string> = {
  terms: termsUrl,
  privacy: privacyPolicyUrl,
};

const regionLocaleUrls: Partial<
  Record<Region, Partial<Record<Locale, Partial<Record<LegalDocumentKind, string>>>>>
> = {
  JP: {
    ja: {
      terms: termsUrl,
      privacy: privacyPolicyUrl,
    },
    en: {
      terms: termsUrl,
      privacy: privacyPolicyUrl,
    },
  },
  US: {
    en: {
      terms: termsUrl,
      privacy: privacyPolicyUrl,
    },
  },
};

export function getLegalUrl(kind: LegalDocumentKind, locale: Locale, region: Region) {
  return regionLocaleUrls[region]?.[locale]?.[kind] ?? defaultUrls[kind];
}

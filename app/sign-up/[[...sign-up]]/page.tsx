import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpPanel } from "@/components/auth/sign-up-panel";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";

export default async function SignUpPage() {
  const locale = await resolveRequestLocale();
  const t = getTranslator(locale);

  return (
    <AuthShell
      description={t("auth.signUp.description")}
      footer={
        <>
          {t("auth.signUp.footerPrefix")}{" "}
          <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/sign-in">
            {t("auth.signUp.footerLink")}
          </Link>
        </>
      }
      locale={locale}
      title={t("auth.signUp.title")}
    >
      <SignUpPanel locale={locale} redirectTo="/auth/sign-up-complete" />
    </AuthShell>
  );
}

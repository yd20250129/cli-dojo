import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";

export default async function SignInPage() {
  const locale = await resolveRequestLocale();
  const t = getTranslator(locale);

  return (
    <AuthShell
      description={t("auth.signIn.description")}
      footer={
        <>
          {t("auth.signIn.footerPrefix")}{" "}
          <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/sign-up">
            {t("auth.signIn.footerLink")}
          </Link>
        </>
      }
      locale={locale}
      title={t("auth.signIn.title")}
    >
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </AuthShell>
  );
}

import { SignUpCompleteView } from "@/components/auth/sign-up-complete-view";
import { AuthShell } from "@/components/auth/auth-shell";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";

export default async function SignUpCompletePage() {
  const locale = await resolveRequestLocale();
  const t = getTranslator(locale);

  return (
    <AuthShell
      description={t("auth.signUpComplete.description")}
      footer={t("auth.signUpComplete.footer")}
      locale={locale}
      title={t("auth.signUpComplete.title")}
    >
      <SignUpCompleteView locale={locale} />
    </AuthShell>
  );
}

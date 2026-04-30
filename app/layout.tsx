import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, JetBrains_Mono } from "next/font/google";
import { getTranslator } from "@/lib/i18n";
import { resolveRequestLocale } from "@/lib/i18n/request";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const roundedSans = M_PLUS_Rounded_1c({
  weight: ["400", "500", "800"],
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  const t = getTranslator(locale);

  return {
    title: t("app.metadata.title"),
    description: t("app.metadata.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveRequestLocale();

  return (
    <html
      lang={locale}
      className={`${roundedSans.variable} ${monoFont.variable} font-sans h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider
          appearance={{
            options: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "iconButton",
            },
          }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          {children}
          <Toaster position="top-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}

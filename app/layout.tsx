import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "CLI Dojo",
  description: "CLIコマンドをカテゴリ別に学べる4択学習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
        className={`${roundedSans.variable} ${monoFont.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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

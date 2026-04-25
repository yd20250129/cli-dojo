import Link from "next/link";
import type { ReactNode } from "react";

import { AUTH_METHODS } from "@/lib/shared/auth-methods";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  footer: ReactNode;
};

export function AuthShell({ children, title, description, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-950">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-500">CLI Dojo Authentication</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
            <div className="flex flex-wrap gap-2">
              {AUTH_METHODS.map((provider) => (
                <span
                  key={provider}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-700"
                >
                  {provider}
                </span>
              ))}
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-600 sm:text-base">{description}</p>
          </div>
          <div className="text-sm text-zinc-600">
            <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/">
              ホームへ戻る
            </Link>
          </div>
        </section>
        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md space-y-4">
            {children}
            <p className="text-center text-sm text-zinc-600">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

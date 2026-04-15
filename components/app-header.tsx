"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link className="font-mono text-lg font-semibold tracking-normal" href="/">
            CLI Dojo
          </Link>
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600 sm:hidden">
            MVP
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild size="sm" variant={pathname === "/" ? "outline" : "ghost"}>
            <Link href="/">ホーム</Link>
          </Button>
          <Button asChild size="sm" variant={pathname === "/progress" ? "outline" : "ghost"}>
            <Link href="/progress">全体進捗</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

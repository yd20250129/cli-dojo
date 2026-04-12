import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link className="font-mono text-lg font-semibold tracking-normal" href="/">
          CLI Dojo
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/progress">全体進捗</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

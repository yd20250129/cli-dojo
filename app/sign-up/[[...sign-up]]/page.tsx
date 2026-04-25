import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="アカウントを作成する"
      description="学習データはログイン中のアカウントに紐づいて保存されます。進捗と成績を保存し、学習を継続しましょう。"
      footer={
        <>
          すでにアカウントをお持ちの場合は{" "}
          <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/sign-in">
            ログイン
          </Link>
        </>
      }
    >
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </AuthShell>
  );
}

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { AUTH_METHOD_LABEL } from "@/lib/shared/auth-methods";

export default function SignUpPage() {
  return (
    <AuthShell
      title="アカウントを作成する"
      description={`${AUTH_METHOD_LABEL} のいずれかで会員登録して、学習の進捗と成績をアカウント単位で保存します。`}
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

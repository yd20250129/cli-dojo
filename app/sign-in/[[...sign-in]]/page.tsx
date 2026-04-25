import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { AUTH_METHOD_LABEL } from "@/lib/shared/auth-methods";

export default function SignInPage() {
  return (
    <AuthShell
      title="アカウントで学習を続ける"
      description={`${AUTH_METHOD_LABEL} のいずれかでログインして、進捗と成績を端末をまたいで引き継ぎます。`}
      footer={
        <>
          アカウントをお持ちでない場合は{" "}
          <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/sign-up">
            会員登録
          </Link>
        </>
      }
    >
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </AuthShell>
  );
}

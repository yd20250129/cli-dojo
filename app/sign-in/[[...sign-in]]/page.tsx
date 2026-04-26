import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      title="アカウントで学習を続ける"
      description="学習データはログイン中のアカウントに紐づいて保存されます。進捗と成績を保存し、学習を継続しましょう。"
      footer={
        <>
          アカウントをお持ちでない場合は{" "}
          <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/sign-up">
            サインアップ
          </Link>
        </>
      }
    >
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </AuthShell>
  );
}

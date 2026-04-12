import type { Question } from "@/types";

export const sec04Questions = [
  {
    id: "SEC04-001",
    sectionId: "SEC-04",
    category: "起動・停止",
    command: "npm run dev",
    question: "Next.jsなどの開発サーバーを起動するときによく使うコマンドはどれですか？",
    choices: [
      { id: "A", text: "npm run dev" },
      { id: "B", text: "npm install" },
      { id: "C", text: "git pull" },
      { id: "D", text: "docker build" },
    ],
    answer: "A",
    explanation: "npm run dev は package.json の dev スクリプトを実行します。Next.jsでは開発サーバーの起動に使うことが多いコマンドです。",
  },
  {
    id: "SEC04-002",
    sectionId: "SEC-04",
    category: "ホットリロード",
    command: "--host",
    question: "開発サーバーをLAN内の別端末から確認できるように、ホスト指定で起動するときによく使うオプションはどれですか？",
    choices: [
      { id: "A", text: "--watch" },
      { id: "B", text: "--host" },
      { id: "C", text: "--format" },
      { id: "D", text: "--delete" },
    ],
    answer: "B",
    explanation: "--host は開発サーバーの待ち受けホストを指定するために使います。Vite などでは npm run dev -- --host のように渡すことがあります。",
  },
] satisfies Question[];

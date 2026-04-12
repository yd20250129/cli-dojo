import type { Question } from "@/types";

export const sec06Questions = [
  {
    id: "SEC06-001",
    sectionId: "SEC-06",
    category: "クラウドデプロイ",
    command: "vercel",
    question: "Vercelへプロジェクトをデプロイするときに使う代表的なCLIコマンドはどれですか？",
    choices: [
      { id: "A", text: "vercel" },
      { id: "B", text: "npm test" },
      { id: "C", text: "git branch" },
      { id: "D", text: "cat" },
    ],
    answer: "A",
    explanation: "vercel コマンドはVercel CLIからプロジェクトをデプロイするために使います。npm test はテスト、git branch はブランチ確認や作成、cat はファイル内容表示に使います。",
  },
  {
    id: "SEC06-002",
    sectionId: "SEC-06",
    category: "コンテナ管理",
    command: "docker build",
    question: "Dockerfile からコンテナイメージを作成するコマンドはどれですか？",
    choices: [
      { id: "A", text: "docker run" },
      { id: "B", text: "docker compose up" },
      { id: "C", text: "docker build" },
      { id: "D", text: "git push" },
    ],
    answer: "C",
    explanation: "docker build は Dockerfile をもとにコンテナイメージを作成します。docker run はイメージからコンテナを起動します。",
  },
] satisfies Question[];

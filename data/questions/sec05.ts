import type { Question } from "@/types";

export const sec05Questions = [
  {
    id: "SEC05-001",
    sectionId: "SEC-05",
    category: "テスト実行",
    command: "npm test",
    question: "Node.jsプロジェクトでテストを実行する代表的なコマンドはどれですか？",
    choices: [
      { id: "A", text: "npm test" },
      { id: "B", text: "npm install" },
      { id: "C", text: "git merge" },
      { id: "D", text: "vercel" },
    ],
    answer: "A",
    explanation: "npm test は package.json の test スクリプトを実行します。プロジェクトによっては Jest、Vitest、Playwright などのテストツールがこのスクリプトに紐づきます。",
  },
  {
    id: "SEC05-002",
    sectionId: "SEC-05",
    category: "Lint・フォーマット",
    command: "eslint",
    question: "JavaScriptやTypeScriptのコード品質を検査する代表的なツールはどれですか？",
    choices: [
      { id: "A", text: "prettier" },
      { id: "B", text: "eslint" },
      { id: "C", text: "vercel" },
      { id: "D", text: "docker run" },
    ],
    answer: "B",
    explanation: "eslint はJavaScriptやTypeScriptの静的解析に使います。prettier は主にコード整形、vercel はデプロイ、docker run はコンテナ実行に使います。",
  },
] satisfies Question[];

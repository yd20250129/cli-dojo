import type { Question } from "@/types";

export const sec02Questions = [
  {
    id: "SEC02-001",
    sectionId: "SEC-02",
    category: "インストール",
    command: "npm install",
    question: "Node.jsプロジェクトで依存パッケージをインストールする代表的なコマンドはどれですか？",
    choices: [
      { id: "A", text: "npm run dev" },
      { id: "B", text: "npm install" },
      { id: "C", text: "npm test" },
      { id: "D", text: "npm run build" },
    ],
    answer: "B",
    explanation: "npm install は package.json に定義された依存パッケージをインストールします。npm run dev は開発サーバー起動、npm test はテスト、npm run build はビルドに使います。",
  },
  {
    id: "SEC02-002",
    sectionId: "SEC-02",
    category: "スクリプト実行",
    command: "npm run",
    question: "package.json に定義された任意のスクリプトを実行するときの基本形はどれですか？",
    choices: [
      { id: "A", text: "npm run <script>" },
      { id: "B", text: "npm add <script>" },
      { id: "C", text: "npm clone <script>" },
      { id: "D", text: "npm branch <script>" },
    ],
    answer: "A",
    explanation: "npm run <script> は package.json の scripts に定義されたコマンドを実行します。例えば npm run dev や npm run build のように使います。",
  },
] satisfies Question[];

import type { Question } from "@/types";

export const sec03Questions = [
  {
    id: "SEC03-001",
    sectionId: "SEC-03",
    category: "リポジトリ操作",
    command: "git add",
    question: "ローカルのファイル変更をステージングエリアに追加するコマンドはどれですか？",
    choices: [
      { id: "A", text: "git commit" },
      { id: "B", text: "git add" },
      { id: "C", text: "git push" },
      { id: "D", text: "git init" },
    ],
    answer: "B",
    explanation: "git add はファイルの変更をステージングエリアに追加するコマンドです。git commit はステージング済みの変更を記録し、git push はリモートへ送信します。",
  },
  {
    id: "SEC03-002",
    sectionId: "SEC-03",
    category: "コミット・同期",
    command: "git commit",
    question: "ステージング済みの変更をローカルリポジトリに記録するコマンドはどれですか？",
    choices: [
      { id: "A", text: "git pull" },
      { id: "B", text: "git branch" },
      { id: "C", text: "git commit" },
      { id: "D", text: "git clone" },
    ],
    answer: "C",
    explanation: "git commit は git add でステージングした変更をローカルリポジトリに記録します。git pull は取得と統合、git clone は複製に使います。",
  },
] satisfies Question[];

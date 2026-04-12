import type { Question } from "@/types";

export const sec01Questions = [
  {
    id: "SEC01-001",
    sectionId: "SEC-01",
    category: "ファイル操作",
    command: "ls",
    question: "現在のディレクトリにあるファイルやフォルダを一覧表示するコマンドはどれですか？",
    choices: [
      { id: "A", text: "ls" },
      { id: "B", text: "cd" },
      { id: "C", text: "mkdir" },
      { id: "D", text: "rm" },
    ],
    answer: "A",
    explanation: "ls は現在のディレクトリにあるファイルやフォルダを一覧表示するコマンドです。cd はディレクトリ移動、mkdir はディレクトリ作成、rm は削除に使います。",
  },
  {
    id: "SEC01-002",
    sectionId: "SEC-01",
    category: "ファイル操作",
    command: "mkdir",
    question: "新しいディレクトリを作成するコマンドはどれですか？",
    choices: [
      { id: "A", text: "rm" },
      { id: "B", text: "cat" },
      { id: "C", text: "mkdir" },
      { id: "D", text: "grep" },
    ],
    answer: "C",
    explanation: "mkdir は新しいディレクトリを作成するコマンドです。rm は削除、cat はファイル内容表示、grep は文字列検索に使います。",
  },
] satisfies Question[];

import type { Section } from "@/types";

export const sections = [
  {
    id: "SEC-01",
    name: "ターミナル操作",
    description: "ファイル操作、テキスト検索、権限や環境変数を学びます。",
    order: 1,
    questionCount: 2,
  },
  {
    id: "SEC-02",
    name: "パッケージ管理",
    description: "インストール、更新、削除、スクリプト実行を学びます。",
    order: 2,
    questionCount: 2,
  },
  {
    id: "SEC-03",
    name: "バージョン管理（Git）",
    description: "リポジトリ操作、コミット、同期、ブランチ管理を学びます。",
    order: 3,
    questionCount: 2,
  },
  {
    id: "SEC-04",
    name: "開発サーバー",
    description: "起動、ホットリロード、ポート設定を学びます。",
    order: 4,
    questionCount: 2,
  },
  {
    id: "SEC-05",
    name: "テスト・ビルド",
    description: "テスト実行、ビルド、Lint、フォーマットを学びます。",
    order: 5,
    questionCount: 2,
  },
  {
    id: "SEC-06",
    name: "デプロイ・インフラ",
    description: "コンテナ、CI/CD、クラウドデプロイを学びます。",
    order: 6,
    questionCount: 2,
  },
] satisfies Section[];

# APP_CODEX_START (Aムービーブロッカー2)

このリポジトリで作業するエージェント（Codex等）は、作業開始時に必ず以下を読む：
1) CODEX_BASELINE.md（プロジェクト前提・コマンド・運用ルール）
2) TASK_REQUEST_TEMPLATE.md（依頼の書式・READ/WRITE切替・DONE条件）

作業は「依頼に書かれた範囲」だけ行う。依頼にない変更は禁止。

## 作業開始の固定宣言
- まず CODEX_BASELINE.md を前提として読み、そこに書かれた事実・運用ルールの範囲内でのみ作業する
- 次に TASK_REQUEST_TEMPLATE.md に従い、READ ONLY / WRITE を厳守する
- 作業開始時に `git status -sb` を確認し、dirty内容を前提として扱う（勝手に掃除しない）

## DONE（最小定義）
- 指定された挙動／仕様が、依頼に書かれた再現手順上で満たされている
- UI変更がある場合は UI 反映まで完了している（途中段階を成果にしない）
- 依頼内容に応じて必要な場合のみ build.sh を通す（無駄に全部ビルドしない）
- manifest.json の version（必要なら version_name）を変更内容に応じて更新する

以上。

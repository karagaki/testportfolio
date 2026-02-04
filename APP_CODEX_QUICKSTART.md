# APP_CODEX_QUICKSTART (Aムービーブロッカー2)

このリポジトリでアプリCodexを動かすときは、以下の手順のみ。

## 0) 先に読むべきファイル（必須）
- CODEX_BASELINE.md
- APP_CODEX_START.md
- TASK_REQUEST_TEMPLATE.md

## 1) 起動文（READ ONLY / 調査）
以下をそのままアプリCodexに貼る：

このリポジトリで作業します。CODEX_BASELINE.md と APP_CODEX_START.md を前提として読み、TASK_REQUEST_TEMPLATE.md の形式で READ ONLY（調査のみ）を実行してください。Skillは investigate_read_only を使ってください。

## 2) 起動文（WRITE / 修正）
以下をそのままアプリCodexに貼る：

このリポジトリで作業します。CODEX_BASELINE.md / APP_CODEX_START.md を前提に、TASK_REQUEST_TEMPLATE.md の形式で WRITE（差分実装）を実行してください。Skillは apply_patch_write を使ってください。

## 3) 依頼の雛形（READ ONLY）
Mode: READ ONLY
Scope:
- files:
  - <path1>
  - <path2>
Goal:
- <1〜2行>
Repro / Check:
- <あれば>
Output Format:
- READ ONLY 形式（結論/根拠/未確定点）

## 4) 依頼の雛形（WRITE）
Mode: WRITE
Scope:
- files:
  - <path1>
  - <path2>
Goal:
- <1〜2行>
Repro / Check:
- <あれば>
Output Format:
- WRITE 形式（変更点/ git diff/ DONE確認/ version更新）

以上。

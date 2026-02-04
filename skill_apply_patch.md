# Skill: 修正（WRITE / 差分のみ）

## 目的
READ ONLY の調査結果に基づき、必要最小限の差分で修正を適用し、UI反映まで含めて完了させる。

## 前提（必須）
- 作業開始時に `CODEX_BASELINE.md` と `APP_CODEX_START.md` と `TASK_REQUEST_TEMPLATE.md` を読む
- 調査が必要な場合は先に investigate_read_only を使う（このSkill内で勝手に調査フェーズへ拡大しない）

## 禁止（絶対）
- 未指示のリファクタ（命名変更/構造整理/最適化）
- 未指示の整形（format/prettier等）
- 依頼にない「削除・非表示・無効化」
- 既存データ互換の破壊
- 変更範囲の拡大（依頼のScope外ファイルを触らない）

## 実装制約（固定）
- 変更対象は最大2〜3ファイル（依頼のScopeに列挙されたもののみ）
- 変更は差分のみ（最小変更）
- UI変更がある場合は同一修正内でUI反映まで完了（途中段階を成果にしない）
- `manifest.json` の version（必要なら version_name）を変更内容に応じて更新する

## 出力形式（固定）
- 変更点（要点）
- git diff（必須）
- DONE確認（APP_CODEX_START.md のDONE最小定義に照らして満たしたことを明記）
- 変更したファイル一覧（Scope内のみ）

以上。

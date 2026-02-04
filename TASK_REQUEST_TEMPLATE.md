# TASK_REQUEST_TEMPLATE (Aムービーブロッカー2)

このテンプレの形式で依頼を書く。テンプレ外の推測・補足で作業範囲を広げない。

## Mode（どちらか1つ）
- READ ONLY（調査のみ。修正禁止）
- WRITE（修正/実装。差分のみ）

## Scope（最大2〜3ファイル）
- files:
  - （例）src/background/background.js
  - （例）src/ui/options.js

## Goal（1〜2行で）
- （何を満たせば成功か）

## Repro / Check（再現/確認手順があれば）
- 1)
- 2)

## Output Format（必須）
### READ ONLY の場合
- 結論（1〜2行）
- 根拠（ファイル名 / 関数名 / 該当箇所）
- 未確定点（あれば）

### WRITE の場合
- 変更点（要点）
- git diff（必須）
- DONE確認（上のDONE最小定義に照らして満たしたことを明記）
- manifest.json の version 更新（必須）

以上。

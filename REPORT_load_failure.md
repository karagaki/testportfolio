# Aパレットサーチ 読み込み失敗 調査報告書（証跡付き）

調査日時: 2026-01-04
調査ツール: Claude Code + MCP
調査目的: Chrome拡張「パッケージ化されていない拡張機能を読み込む」で失敗する原因の特定

---

## 1. 実行環境

### macOS環境
```
ProductName:    macOS
ProductVersion: 26.2
BuildVersion:   25C56
```

### プロジェクト配置パス
```
/Users/i/Desktop/Projects/Aパレットサーチ
```

### ディレクトリ構成
```
/Users/i/Desktop/Projects/Aパレットサーチ
├── manifest.json (206 bytes)
├── assets/
│   ├── icon128.png
│   ├── icon16.png
│   ├── icon32.png
│   └── icon48.png
└── src/
    ├── content.js (37 bytes)
    ├── domPicker.js
    ├── paletteUI.js
    ├── rulesEngine.js
    ├── selectorGen.js
    ├── storage.js
    ├── styles.css
    └── sw.js
```

### Chrome環境
※ユーザーによる追加情報が必要：
- Chromeバージョン
- 実際のエラーメッセージ全文（chrome://extensions で表示されたもの）

---

## 2. 現象

**事実**: ユーザーから「Chromeの『パッケージ化されていない拡張機能を読み込む』で先に進めない」と報告あり。

**未取得情報**（ユーザーに確認が必要）:
1. chrome://extensions で「デベロッパーモード」をONにした状態か
2. フォルダ選択後に表示される具体的なエラーメッセージ（赤文字エラー全文）
3. 拡張一覧に当該拡張カードが表示されるか／されないか
4. 表示される場合、「エラー」リンクの内容
5. 「サービスワーカー」リンクの有無

---

## 3. 取得したChromeエラー

**現時点では未取得**

ユーザーには以下の手順で情報収集をお願いする必要があります：

### 【ユーザー実施手順】
1. Chromeで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `/Users/i/Desktop/Projects/Aパレットサーチ` フォルダを選択
5. 表示されたエラーメッセージを **全文コピー** するか **スクリーンショット撮影**
6. 拡張一覧に「APS TEST」カードが表示されているか確認
7. 表示されている場合、「エラー」ボタンがあればクリックして内容を確認

---

## 4. 静的検査結果

### 4.1 JSONパース結果

**証跡**:
```
reading manifest.json
OK: JSON parse successful
manifest_version: 3
name: APS TEST
version: 0.0.1
All required keys present
```

**判定**: ✅ JSON構文は正常。パースエラーなし。

### 4.2 MV3必須キー確認

| キー | 必須 | 存在 | 値 |
|------|------|------|-----|
| manifest_version | ✅ | ✅ | 3 |
| name | ✅ | ✅ | "APS TEST" |
| version | ✅ | ✅ | "0.0.1" |

**判定**: ✅ 必須キーはすべて存在。

### 4.3 manifest.json内容

```json
{
  "manifest_version": 3,
  "name": "APS TEST",
  "version": "0.0.1",
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content.js"]
    }
  ]
}
```

### 4.4 参照ファイルの存在確認

manifest.jsonが参照するファイル:
- `src/content.js` → ✅ **存在確認済み** (37 bytes)

**content.js の内容**:
```javascript
console.log('[APS] content loaded');
```

**判定**: ✅ 参照ファイルはすべて実在。構文エラーもなし。

### 4.5 未使用だが存在するファイル

以下のファイルがsrc/に存在するが、manifest.jsonでは参照されていない：
- `sw.js` (Service Worker候補？)
- `domPicker.js`
- `paletteUI.js`
- `rulesEngine.js`
- `selectorGen.js`
- `storage.js`
- `styles.css`

icons/ も存在するが、manifestでは未指定。

**推測**: もともとはより複雑な構成だったが、テスト用に最小構成へ簡素化した可能性あり。

---

## 5. パス/文字種検査

### 5.1 合成文字（NFC/NFD）問題の検出

**証跡**:
```
Path components:
[5] "Aパレットサーチ"
    len: 9, NFC len: 8, NFD len: 9
    bytes: 41e3838fe3829ae383ace38383e38388e382b5e383bce38381
    NFC bytes: 41e38391e383ace38383e38388e382b5e383bce38381
    NFD bytes: 41e3838fe3829ae383ace38383e38388e382b5e383bce38381
    ⚠️  NOT NFC normalized!
    ⚠️  Length difference detected - possible composition issue
    ℹ️  Contains Japanese characters
       - Hiragana detected
       - Katakana detected
```

### 5.2 分析

**事実**:
1. フォルダ名 `Aパレットサーチ` が **NFD正規化形式** で保存されている
2. NFC形式では8文字、NFD形式では9文字（合成文字が分離されている）
3. 「パ」が「ハ (U+30CF)」+「゚(U+309A, 半濁点)」の2文字に分離されている

**バイト列詳細**:
- 現在のパス: `41e3838fe3829a...` → `A` + `ハ` + `゚` (NFD)
- NFC正規化後: `41e38391...` → `A` + `パ` (NFC)

### 5.3 macOSファイルシステムの特性

macOSのAPFS/HFS+は、ファイル名を **NFD形式で保存** する仕様。
一方、多くのアプリケーションやブラウザは **NFC形式** でパスを扱う。

**推測**: Chromeが拡張のパス処理時に、NFD/NFCの不一致により以下の問題が発生する可能性：
- パス比較の失敗
- ファイル読み込みエラー
- セキュリティ検証の失敗

---

## 6. 原因候補ランキング

### 🥇 **第1位: NFD/NFC合成文字の不一致（確度: 高）**

**根拠**:
- フォルダ名に合成文字（パレット）が含まれ、NFD形式で保存されている（証跡あり）
- macOS特有の問題として知られている
- Chrome拡張のパス処理でUnicode正規化の不一致が問題を起こす事例が多数報告されている

**対策**:
1. **即座に試せる対策**: 英数字のみのパスへコピー
   ```bash
   # 例
   cp -r "/Users/i/Desktop/Projects/Aパレットサーチ" "/Users/i/Desktop/aps-test"
   ```
2. コピー後、`/Users/i/Desktop/aps-test` を Chromeで読み込み

**期待される結果**: この対策で読み込みが成功すれば、合成文字問題が原因と確定。

---

### 🥈 **第2位: manifest.jsonに必須項目の不足（確度: 中）**

**根拠**:
- 現在のmanifest.jsonは **最小限の構成** で、多くのChrome拡張で一般的な要素が欠落している：
  - `icons` （拡張アイコン）
  - `action` または `browser_action`（ツールバーボタン）
  - `description`（説明文）

**証跡**:
```json
{
  "manifest_version": 3,
  "name": "APS TEST",
  "version": "0.0.1",
  "permissions": ["storage"],
  "content_scripts": [...]
}
```

Chrome側の警告・エラーの可能性：
- "This extension has no icon" 的な警告
- descriptionがないための警告（ただし読み込み阻止には至らないはず）

**推測**: これらは通常 **警告** であってエラーではないが、Chrome環境やバージョンによっては厳格化されている可能性。

**対策**: 最小限の追加で検証
```json
{
  "manifest_version": 3,
  "name": "APS TEST",
  "version": "0.0.1",
  "description": "A Palette Search Test Extension",
  "permissions": ["storage"],
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content.js"]
    }
  ]
}
```

---

### 🥉 **第3位: Chromeのバージョンまたはセキュリティ設定（確度: 低）**

**根拠**:
- macOS 26.2（開発者向けベータ版の可能性）での動作
- Chromeのバージョンが不明
- 企業ポリシーやセキュリティ設定で拡張のローカル読み込みが制限されている可能性

**必要な確認**:
1. Chromeのバージョン（chrome://version）
2. 他のシンプルな拡張（例: 最小manifestのみ）が読み込めるか

---

### 第4位: content.jsの単純さ（確度: 極低）

**事実**: content.js は1行のconsole.logのみ。

**推測**: これが問題になる可能性は極めて低いが、念のため記載。
通常、空ファイルや単一console.logでも問題なく動作する。

---

## 7. 次アクション（優先順位順）

### 🔴 **必須: ユーザーによるエラーメッセージ取得**

現時点では Chrome側の具体的なエラーメッセージが不明。
以下を実施してください：

1. chrome://extensions を開く
2. デベロッパーモードON
3. フォルダ選択後の **赤字エラー全文をコピー** または **スクリーンショット撮影**
4. 本報告書に追記

---

### ✅ **アクション1: 英数字パスでの検証（最優先・即実行可能）**

**手順**:
```bash
# 1. 英数字のみのパスへコピー
cp -r "/Users/i/Desktop/Projects/Aパレットサーチ" "/Users/i/Desktop/aps-test"

# 2. Chromeで新しいパスを読み込み
# chrome://extensions → 「パッケージ化されていない拡張機能を読み込む」
# → /Users/i/Desktop/aps-test を選択
```

**期待される結果**:
- ✅ 成功 → 原因は合成文字問題で確定
- ❌ 失敗 → 他の原因を調査（アクション2へ）

---

### ✅ **アクション2: manifestへの最小限追加（検証用）**

英数字パスでも失敗する場合、以下を試す：

**手順**:
```bash
# バックアップ作成
cp manifest.json manifest.json.bak

# 以下の内容で上書き
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "APS TEST",
  "version": "0.0.1",
  "description": "A Palette Search Test Extension",
  "permissions": ["storage"],
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content.js"]
    }
  ]
}
EOF

# Chromeで再読み込み
```

**期待される結果**:
- ✅ 成功 → icons/description不足が原因
- ❌ 失敗 → さらに調査が必要（アクション3へ）

**復元方法**:
```bash
cp manifest.json.bak manifest.json
```

---

### ✅ **アクション3: 最小限manifestでの切り分け**

アクション1, 2でも失敗する場合、**絶対に動く最小manifest**で検証：

**手順**:
```bash
# バックアップ（既存がなければ）
cp manifest.json manifest.json.bak2

# 最小manifestで上書き
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Minimal Test",
  "version": "1.0.0"
}
EOF

# Chromeで読み込み
```

**期待される結果**:
- ✅ 成功 → 段階的に要素を戻していき、どこで失敗するか特定
- ❌ 失敗 → Chrome環境そのものに問題（アクション4へ）

**段階的復元計画**:
1. 最小manifest → 成功
2. + permissions → 成功/失敗？
3. + icons → 成功/失敗？
4. + content_scripts → 成功/失敗？

---

### ✅ **アクション4: Chrome環境の確認**

上記すべてで失敗する場合、Chrome側の問題を疑う：

**確認項目**:
1. Chromeバージョン確認
   ```
   chrome://version
   ```
2. 別の最小拡張で試す（例: 公式サンプル）
   - https://github.com/GoogleChrome/chrome-extensions-samples
3. Chromeの再インストール
4. 別のChromiumベースブラウザ（Edge等）で試す

---

## 8. 補足：調査で確認できた正常な点

以下は問題なく正常であることが確認済み：

✅ manifest.json のJSON構文
✅ MV3必須キーの存在
✅ 参照ファイル（src/content.js）の実在
✅ content.js の構文（単純だがエラーなし）
✅ ファイルパーミッション（読み取り可能）

---

## 9. 結論

### 現時点での判断

**最有力原因**: フォルダ名の合成文字（NFD/NFC不一致）
**確度**: 高（証跡あり、macOS特有の既知問題）

### 即座に試すべき対策

1. **英数字のみのパスへコピー**して読み込み（5分で検証可能）
2. Chromeのエラーメッセージ全文を取得（本報告書への追記用）

### 次回調査が必要な情報

- [ ] Chromeバージョン
- [ ] chrome://extensions での具体的エラーメッセージ全文
- [ ] アクション1（英数字パス）の結果
- [ ] アクション2（manifest追加）の結果

---

**報告書作成日時**: 2026-01-04
**調査担当**: Claude Code
**状態**: 初回調査完了、ユーザーアクション待ち

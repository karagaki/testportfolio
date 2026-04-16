# Local Preview Launcher

このファイルは、`myportfolio` をローカルサーバーで起動して Chrome で開くための起動メモです。

- `00_open_local_portfolio.command` を Finder からダブルクリックすると起動できます
- `8000` を優先し、使われていれば `8001`, `8002`... に自動フォールバックします
- サーバーの PID は `.local_http_server.pid` に保存されます

手動で起動したい場合:

```bash
./00_open_local_portfolio.command
```

停止したい場合:

```bash
cat .local_http_server.pid
kill "$(cat .local_http_server.pid)"
```

補足:

- Chrome は `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` を使用します
- `--user-data-dir="/Users/i/.gemini/antigravity-browser-profile"`
- `--profile-directory="Default"`

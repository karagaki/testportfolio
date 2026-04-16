#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
PID_FILE="$PROJECT_DIR/.local_http_server.pid"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME_USER_DATA_DIR="/Users/i/.gemini/antigravity-browser-profile"
CHROME_PROFILE_DIRECTORY="Default"

cd "$PROJECT_DIR" || {
  echo "Error: failed to change to project directory: $PROJECT_DIR" >&2
  exit 1
}

find_free_port() {
  local port="$1"
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  printf '%s' "$port"
}

start_server() {
  local port="$1"
  local log_file="$PROJECT_DIR/.local_http_server.log"

  python3 -m http.server "$port" --bind 127.0.0.1 >"$log_file" 2>&1 &
  echo $!
}

wait_for_server() {
  local port="$1"
  local url="http://127.0.0.1:$port/"
  local attempt=1

  while [ "$attempt" -le 30 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    if ! kill -0 "$2" >/dev/null 2>&1; then
      return 1
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  return 1
}

if [ -f "$PID_FILE" ]; then
  existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${existing_pid:-}" ] && kill -0 "$existing_pid" >/dev/null 2>&1; then
    :
  else
    rm -f "$PID_FILE"
  fi
fi

PORT="$(find_free_port 8000)"
PID="$(start_server "$PORT")"

if ! wait_for_server "$PORT" "$PID"; then
  echo "Error: server failed to start on 127.0.0.1:$PORT" >&2
  if [ -f "$PROJECT_DIR/.local_http_server.log" ]; then
    echo "Last log output:" >&2
    tail -n 20 "$PROJECT_DIR/.local_http_server.log" >&2
  fi
  exit 1
fi

printf '%s\n' "$PID" >"$PID_FILE"

URL="http://127.0.0.1:$PORT/"

echo "起動ポート: $PORT"
echo "URL: $URL"
echo "PID: $PID"

if [ ! -x "$CHROME_BIN" ]; then
  echo "Error: Chrome binary not found or not executable: $CHROME_BIN" >&2
  exit 1
fi

exec "$CHROME_BIN" \
  --user-data-dir="$CHROME_USER_DATA_DIR" \
  --profile-directory="$CHROME_PROFILE_DIRECTORY" \
  "$URL"

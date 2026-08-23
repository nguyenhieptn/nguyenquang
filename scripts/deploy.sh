#!/bin/bash
# Triển khai production lên IP VPN (Tailscale) — NFR-3: một lệnh, không bước thủ công giấu kín.
#
#   ./scripts/deploy.sh            # build + (re)start trên $(tailscale ip -4):3000
#   ./scripts/deploy.sh --no-build # chỉ restart
#
# Server chạy nền bằng nohup, PID ghi ở var/run/giapha.pid, log ở var/log/giapha.log.
# Dừng: ./scripts/deploy.sh --stop
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="$(tailscale ip -4)"
PORT="${GIAPHA_PORT:-3000}"
PIDFILE=var/run/giapha.pid
LOGFILE=var/log/giapha.log
mkdir -p var/run var/log

stop_server() {
  # Dừng tiến trình cũ theo pidfile, và bất cứ next nào còn giữ cổng (kể cả dev server cũ).
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")" && sleep 1 || true
  fi
  rm -f "$PIDFILE"
  local pids
  pids=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | sort -u || true)
  if [[ -n "$pids" ]]; then
    echo "Cổng $PORT đang bị chiếm bởi PID: $pids — dừng."
    kill $pids 2>/dev/null || true
    sleep 2
  fi
}

if [[ "${1:-}" == "--stop" ]]; then stop_server; echo "Đã dừng."; exit 0; fi

# Database phải sống trước đã.
docker compose up -d db >/dev/null
until docker exec giapha-db pg_isready -U postgres -d giapha >/dev/null 2>&1; do sleep 1; done

set -a; . ./.env; set +a
npm run db:migrate

if [[ "${1:-}" != "--no-build" ]]; then
  npm run build
fi

stop_server
nohup npx next start -H "$HOST" -p "$PORT" >>"$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
sleep 3
if kill -0 "$(cat "$PIDFILE")" 2>/dev/null && curl -sf -o /dev/null "http://$HOST:$PORT"; then
  echo "✅ Đang chạy: http://$HOST:$PORT (PID $(cat "$PIDFILE"), log: $LOGFILE)"
else
  echo "❌ Server không lên — xem $LOGFILE"; tail -20 "$LOGFILE"; exit 1
fi

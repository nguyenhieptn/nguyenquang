#!/bin/bash
# Sao lưu hằng ngày (NFR-1 / AD-25): pg_dump + media, giữ 90 ngày.
#
#   ./scripts/backup.sh                 # tạo bản sao vào var/backups/
#   ./scripts/backup.sh --restore FILE  # DIỄN TẬP KHÔI PHỤC vào database giapha_restore_test
#
# Cron gợi ý (crontab -e):  15 2 * * *  /home/z/zera/nguyenquang/scripts/backup.sh
#
# ⚠️ GIỚI HẠN ĐÃ BIẾT (ghi ở epics.md § Hoãn): bản sao đang nằm CÙNG MÁY. AD-25 đòi đích sao lưu
# tách credentials khỏi production — cần bucket R2/B2 của dòng họ. Khi có, thêm một lệnh rclone
# copy ở cuối. Backup chưa từng restore là backup không tồn tại — vì thế có --restore.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

DEST=var/backups
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M%S)

if [[ "${1:-}" == "--restore" ]]; then
  FILE="${2:?cách dùng: backup.sh --restore var/backups/db-....dump}"
  echo "Diễn tập khôi phục $FILE vào database giapha_restore_test…"
  docker exec giapha-db psql -U postgres -c "DROP DATABASE IF EXISTS giapha_restore_test" >/dev/null
  docker exec giapha-db psql -U postgres -c "CREATE DATABASE giapha_restore_test" >/dev/null
  docker exec -i giapha-db pg_restore -U postgres -d giapha_restore_test --no-owner < "$FILE"
  COUNT=$(docker exec giapha-db psql -U postgres -d giapha_restore_test -tAc \
    "SELECT count(*) FROM person" 2>/dev/null || echo "LỖI")
  echo "✅ Khôi phục xong — bảng person có $COUNT dòng. Xoá database thử…"
  docker exec giapha-db psql -U postgres -c "DROP DATABASE giapha_restore_test" >/dev/null
  exit 0
fi

# 1. Database — pg_dump định dạng custom (nén, pg_restore chọn lọc được).
docker exec giapha-db pg_dump -U postgres -d giapha -Fc > "$DEST/db-$STAMP.dump"

# 2. Media — lời kể là dữ liệu KHÔNG TÁI TẠO ĐƯỢC (AD-11). Khôi phục database mà quên
#    media thì không được phép coi là đã khôi phục.
if [[ -d "${MEDIA_DIR:-var/media}" ]]; then
  tar -czf "$DEST/media-$STAMP.tar.gz" -C "$(dirname "${MEDIA_DIR:-var/media}")" "$(basename "${MEDIA_DIR:-var/media}")"
fi

# 3. Giữ 90 ngày (NFR-1).
find "$DEST" -name '*.dump' -o -name '*.tar.gz' | while read -r f; do
  [[ $(find "$f" -mtime +90) ]] && rm -f "$f" && echo "xoá bản cũ: $f"
done || true

echo "✅ Sao lưu xong: $DEST/db-$STAMP.dump$([[ -f "$DEST/media-$STAMP.tar.gz" ]] && echo " + media-$STAMP.tar.gz")"
ls -lh "$DEST" | tail -5

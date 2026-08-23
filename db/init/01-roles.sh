#!/bin/bash
# Chạy MỘT LẦN khi volume Postgres còn trống (docker-entrypoint-initdb.d).
# Dựng hai role theo AD-20:
#   giapha_owner — sở hữu schema/bảng, chạy migration. KHÔNG dùng trong ứng dụng.
#   giapha_app   — ứng dụng kết nối. KHÔNG sở hữu bảng, KHÔNG BYPASSRLS
#                  → FORCE ROW LEVEL SECURITY áp lên mọi truy vấn của nó.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE giapha_owner LOGIN PASSWORD '${GIAPHA_OWNER_PASSWORD}';
  CREATE ROLE giapha_app   LOGIN PASSWORD '${GIAPHA_APP_PASSWORD}' NOBYPASSRLS;

  GRANT CONNECT ON DATABASE giapha TO giapha_owner, giapha_app;

  -- Schema thuộc owner; app chỉ được dùng, không được tạo.
  ALTER SCHEMA public OWNER TO giapha_owner;
  GRANT USAGE ON SCHEMA public TO giapha_app;

  -- Extension contrib cho so khớp tên tiếng Việt (AD-16). Cần superuser nên đặt ở đây.
  CREATE EXTENSION IF NOT EXISTS unaccent;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

# Bổ sung: giapha_owner cần CREATE trên database (drizzle giữ journal trong schema "drizzle").
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c 'GRANT CREATE ON DATABASE giapha TO giapha_owner;'

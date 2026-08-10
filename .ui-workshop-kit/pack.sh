#!/usr/bin/env bash
#
# Vỏ mỏng giữ nguyên thói quen cũ — ruột đã chuyển sang kit.mjs (đọc workshop.manifest.json).
#
#     bash _bmad/custom/ui-workshop-kit/pack.sh          # đồng bộ plumbing sống → kit + lock
#     bash _bmad/custom/ui-workshop-kit/pack.sh --check  # chỉ báo lệch (CI / pre-commit)
#
# Lệnh dành cho project ĐÍCH (doctor · install · upgrade) gọi thẳng kit.mjs — xem SETUP.md.
set -euo pipefail
exec node "$(dirname "$0")/kit.mjs" pack "$@"

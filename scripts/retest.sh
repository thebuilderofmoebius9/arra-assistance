#!/usr/bin/env bash
# รันขั้นตอนหน้า 4-6 ของเว็บบนเครื่องสะอาด (HOME ใหม่ + ข้อมูลใหม่ + พอร์ตแยก) แล้วรายงาน PASS/FAIL ทีละขั้น
# ไม่แตะ ~/.oracle หรือเซิร์ฟเวอร์ที่รันอยู่ — ลบทิ้งเฉพาะโฟลเดอร์ชั่วคราวของตัวเองตอนจบ
# ใช้: bash scripts/retest.sh   (ต้องมี bun, curl, git และอินเทอร์เน็ต)
set -u
PORT="${PORT:-47991}"
W="$(mktemp -d /tmp/arra-retest-XXXXXX)"
mkdir -p "$W/home" "$W/data" "$W/home-agent"
export HOME="$W/home" ORACLE_DATA_DIR="$W/data" PORT ORACLE_API="http://localhost:$PORT"
ARRA="bunx --bun --package github:Soul-Brews-Studio/arra-oracle-v3"
FAILS=0
SP=""

step() { # step "ชื่อขั้น" "คำสั่งเช็ค (exit 0 = ผ่าน)"
  if eval "$2" >"$W/last.out" 2>&1; then echo "PASS  $1"; else echo "FAIL  $1"; sed 's/^/        /' "$W/last.out" | tail -5; FAILS=$((FAILS + 1)); fi
}
cleanup() { [ -n "$SP" ] && kill -- "-$SP" 2>/dev/null; rm -rf "$W"; }
trap cleanup EXIT

echo "== retest $(date -Is) · $(uname -sm) · bun $(bun --version 2>&1)"
step "มี bun" "command -v bun"

setsid $ARRA arra-oracle >"$W/server.log" 2>&1 &
SP=$!
for _ in $(seq 1 90); do curl -sf "http://localhost:$PORT/api/health" >/dev/null 2>&1 && break; sleep 1; done

step "เซิร์ฟเวอร์ตอบ health (oracle connected)" "curl -sf http://localhost:$PORT/api/health | grep -q '\"oracle\":\"connected\"'"
echo "      เวอร์ชันเซิร์ฟเวอร์: $(curl -s "http://localhost:$PORT/api/health" | grep -o '"version":"[^"]*"' | head -1)"
step "learn เขียนบันทึกได้" "$ARRA arra-cli learn 'My first note: the cat sleeps on the red sofa every afternoon' --concepts cat,sofa | grep -q '^Learned:'"
step "search อ่านกลับเจอ" "$ARRA arra-cli search sofa --limit 3 | grep -q 'Found 1 results'"
step "doctor ไม่มี FAIL" "! $ARRA arra-cli doctor | grep -q '^FAIL'"

for ag in claude-code codex gemini; do
  mkdir -p "$W/home-agent/$ag"
  step "ติดตั้ง skills ให้ $ag แล้วมี awaken" "HOME='$W/home-agent/$ag' bunx --bun github:Soul-Brews-Studio/arra-oracle-skills-cli#alpha install -g -y -p standard --agent $ag && find '$W/home-agent/$ag' -maxdepth 5 -name 'awaken*' | grep -q ."
done

echo "== จบ: FAIL $FAILS ขั้น"
exit "$FAILS"

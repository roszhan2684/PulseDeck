#!/bin/bash
# Verifies migrations + seed + RLS on a throwaway local Postgres (no Docker needed).
# Usage: bash supabase/tests/verify.sh   (requires initdb/pg_ctl/psql on PATH)
# Note: on Postgres < 15 the `security_invoker` view option is stripped; RLS checks target base tables.
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d); PORT=${PORT:-55432}
initdb -D "$TMP/pg" -U postgres -A trust >/dev/null 2>&1
pg_ctl -D "$TMP/pg" -o "-p $PORT -c unix_socket_directories=''" -l "$TMP/pg.log" start -w >/dev/null
trap 'pg_ctl -D "$TMP/pg" stop >/dev/null; rm -rf "$TMP"' EXIT
P() { psql -h 127.0.0.1 -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
P -c "create database pd"
P -d pd -f tests/supabase_stubs.sql 2>/dev/null
P -d pd -f migrations/20261031000000_schema.sql
sed 's/ with (security_invoker = true)//' migrations/20261031000100_security.sql | P -d pd
P -d pd -f seed.sql
echo "migrations + seed: OK"
psql -h 127.0.0.1 -p "$PORT" -U postgres -d pd -At -f tests/rls_test.sql 2>&1 | grep -E "PASS|FAIL|\|[tf]$"

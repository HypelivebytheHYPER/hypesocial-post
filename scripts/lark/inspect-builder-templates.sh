#!/usr/bin/env bash
# Inspect the builder templates table via lark-cli.
#
# Prints the field schema and a sample of records so we can confirm the
# shape matches what app/api/builder/templates/**/route.ts expects.
#
# Requires:
#   - lark-cli installed and authenticated (see scripts/lark/README.md)
#   - LARK_APP_TOKEN, LARK_BUILDER_TEMPLATES_TABLE_ID in env
#
# Usage:
#   set -a && source .env.local && set +a
#   ./scripts/lark/inspect-builder-templates.sh

set -euo pipefail

: "${LARK_APP_TOKEN:?LARK_APP_TOKEN is not set — source .env.local first}"
: "${LARK_BUILDER_TEMPLATES_TABLE_ID:?LARK_BUILDER_TEMPLATES_TABLE_ID is not set}"

if ! command -v lark-cli >/dev/null 2>&1; then
  echo "error: lark-cli is not installed. See scripts/lark/README.md" >&2
  exit 1
fi

echo "==> Fields in ${LARK_BUILDER_TEMPLATES_TABLE_ID}"
lark-cli base +field-list \
  --params "$(printf '{"app_token":"%s","table_id":"%s"}' \
    "$LARK_APP_TOKEN" "$LARK_BUILDER_TEMPLATES_TABLE_ID")" \
  --format table

echo
echo "==> Latest 5 records"
lark-cli base +record-search \
  --params "$(printf '{"app_token":"%s","table_id":"%s","page_size":5}' \
    "$LARK_APP_TOKEN" "$LARK_BUILDER_TEMPLATES_TABLE_ID")" \
  --jq '.items[] | {
    record_id,
    Name: .fields.Name,
    created_at: .fields["Created At"],
    updated_at: .fields["Updated At"],
    blocks_bytes: (.fields["Blocks JSON"] | tostring | length)
  }'

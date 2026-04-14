# Lark admin scripts

One-off / admin operations against the Lark Base workspace that backs this
project. **Not** for hot-path runtime — the app itself reads and writes Lark
via `lib/lark.ts` → `lark-http-hype` worker. These scripts use `@larksuite/cli`
directly, which requires a browser-based OAuth login and isn't suitable for
request handlers.

## One-time setup

```bash
# 1. Install the Lark CLI (global)
npm install -g @larksuite/cli

# 2. (Optional but recommended) install the Lark Agent Skills so Claude Code
#    knows the Lark API conventions when assisting with Base operations
npx skills add larksuite/cli -g -y

# 3. Paste your Lark app_id / app_secret from open.larksuite.com
lark-cli config init

# 4. Interactive browser login — grants recommended scopes for Base/IM/etc.
lark-cli auth login --recommend

# 5. Sanity check
lark-cli doctor
lark-cli auth status
```

## Environment

The scripts read `LARK_APP_TOKEN` and `LARK_BUILDER_TEMPLATES_TABLE_ID` from
your shell environment (e.g., source `.env.local` first). They intentionally
don't hardcode anything so the same script works against dev / staging / prod.

```bash
set -a && source .env.local && set +a
```

## Scripts

- `inspect-builder-templates.sh` — list fields + a handful of records from
  the builder templates table. Useful after the consolidation in
  `app/api/builder/templates/**` to confirm the schema matches what
  `mapRecordToTemplate` expects.

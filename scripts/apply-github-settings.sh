#!/usr/bin/env bash
# Create or update the main branch ruleset and repo merge settings.
# Idempotent. Safe to re-run. Requires `gh` as a repository admin.
# Required status check is `ci` only. Add `e2e` in Step 8.
set -euo pipefail

REPO="${REPO:-robsonperassoli/inbound-platform}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULESET_FILE="${ROOT}/.github/rulesets/main.json"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required (https://cli.github.com)." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to read ${RULESET_FILE}." >&2
  exit 1
fi

if [[ ! -f "$RULESET_FILE" ]]; then
  echo "Missing ruleset file: ${RULESET_FILE}" >&2
  exit 1
fi

name="$(
  RULESET_FILE="$RULESET_FILE" node -p \
    'JSON.parse(require("fs").readFileSync(process.env.RULESET_FILE, "utf8")).name'
)"
if [[ ! "$name" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Refusing ruleset name: ${name}" >&2
  exit 1
fi

echo "Applying ruleset '${name}' and merge settings to ${REPO}."
echo "This needs repository admin. It does not add the e2e check (Step 8)."

list_ids() {
  gh api --paginate "repos/${REPO}/rulesets" \
    --jq ".[] | select(.name == \"${name}\" and .source_type == \"Repository\") | .id"
}

read_ids() {
  local ids_text id
  ids=()
  ids_text="$(list_ids)"
  # An empty list is success. A failing `[[ ]]` here would exit under `set -e`.
  [[ -z "$ids_text" ]] && return 0
  while IFS= read -r id; do
    [[ -n "$id" ]] || continue
    ids+=("$id")
  done <<< "$ids_text"
}

read_ids

if [[ ${#ids[@]} -eq 0 ]]; then
  echo "Creating ruleset ${name}."
  gh api --method POST "repos/${REPO}/rulesets" --input "$RULESET_FILE" >/dev/null
else
  for id in "${ids[@]}"; do
    echo "Updating ruleset ${name} (${id})."
    gh api --method PUT "repos/${REPO}/rulesets/${id}" --input "$RULESET_FILE" >/dev/null
  done
fi

echo "Setting squash-only merges, delete branch on merge, and auto-merge."
merge_settings="$(
  gh api --method PATCH "repos/${REPO}" \
    --jq '{allow_squash_merge,allow_merge_commit,allow_rebase_merge,delete_branch_on_merge,allow_auto_merge}' \
    --input - <<'EOF'
{
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": false,
  "delete_branch_on_merge": true,
  "allow_auto_merge": true
}
EOF
)"

RULESET_MERGE="$merge_settings" node --input-type=module <<'EOF'
const actual = JSON.parse(process.env.RULESET_MERGE ?? "")
const expected = {
  allow_squash_merge: true,
  allow_merge_commit: false,
  allow_rebase_merge: false,
  delete_branch_on_merge: true,
  allow_auto_merge: true,
}
for (const key of Object.keys(expected)) {
  if (actual[key] !== expected[key]) {
    console.error(`Merge setting mismatch: ${key}=${actual[key]}`)
    process.exit(1)
  }
}
EOF

echo
echo "Active ruleset:"
read_ids

if [[ ${#ids[@]} -eq 0 ]]; then
  echo "Ruleset ${name} was not found after apply." >&2
  exit 1
fi

for id in "${ids[@]}"; do
  gh api "repos/${REPO}/rulesets/${id}"
  enforcement="$(gh api "repos/${REPO}/rulesets/${id}" --jq '.enforcement')"
  contexts="$(
    gh api "repos/${REPO}/rulesets/${id}" \
      --jq '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context] | join(",")'
  )"
  if [[ "$enforcement" != "active" || "$contexts" != "ci" ]]; then
    echo "Ruleset verification failed (enforcement=${enforcement}, checks=${contexts})." >&2
    exit 1
  fi
done

cat <<'EOF'

Note: required status check "e2e" is not part of this ruleset yet. Add it in Step 8.

Confirm a direct push to main is rejected.
Do this as a user who is not a repository admin. Admins bypass this ruleset
(RepositoryRole actor_id 5, bypass_mode always), so an admin push is not a valid test.

  git push origin HEAD:main

GitHub should reject the push: changes must be made through a pull request.
EOF

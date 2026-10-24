import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const ruleset = JSON.parse(
  readFileSync(
    new URL("../.github/rulesets/main.json", import.meta.url),
    "utf8",
  ),
)
const script = readFileSync(
  new URL("./apply-github-settings.sh", import.meta.url),
  "utf8",
)

const rule = (type) => ruleset.rules.find((entry) => entry.type === type)

void test("ruleset targets the default branch and is active", () => {
  assert.equal(ruleset.name, "main")
  assert.equal(ruleset.target, "branch")
  assert.equal(ruleset.enforcement, "active")
  assert.deepEqual(ruleset.conditions.ref_name.include, ["~DEFAULT_BRANCH"])
  assert.deepEqual(ruleset.conditions.ref_name.exclude, [])
})

void test("only repository admins can bypass", () => {
  assert.deepEqual(ruleset.bypass_actors, [
    {
      actor_id: 5,
      actor_type: "RepositoryRole",
      bypass_mode: "always",
    },
  ])
})

void test("pull request requires one fresh approval and resolved threads", () => {
  const pullRequest = rule("pull_request")
  assert.ok(pullRequest)
  assert.equal(pullRequest.parameters.required_approving_review_count, 1)
  assert.equal(pullRequest.parameters.dismiss_stale_reviews_on_push, true)
  assert.equal(pullRequest.parameters.required_review_thread_resolution, true)
  assert.equal(pullRequest.parameters.require_code_owner_review, false)
  assert.equal(pullRequest.parameters.require_last_push_approval, false)
})

void test("strict status check is ci; e2e waits for Step 8", () => {
  const checks = rule("required_status_checks")
  assert.ok(checks)
  assert.equal(checks.parameters.strict_required_status_checks_policy, true)
  assert.deepEqual(
    checks.parameters.required_status_checks.map((check) => check.context),
    ["ci"],
  )
})

void test("blocks force pushes and branch deletion", () => {
  assert.deepEqual(
    ruleset.rules.map((entry) => entry.type),
    ["pull_request", "required_status_checks", "non_fast_forward", "deletion"],
  )
})

void test("apply script creates or updates via gh api and verifies", () => {
  assert.match(script, /--method POST/)
  assert.match(script, /--method PUT/)
  assert.match(script, /--method PATCH/)
  assert.match(script, /"allow_squash_merge": true/)
  assert.match(script, /"allow_merge_commit": false/)
  assert.match(script, /"allow_rebase_merge": false/)
  assert.match(script, /"delete_branch_on_merge": true/)
  assert.match(script, /"allow_auto_merge": true/)
  assert.match(script, /direct push to main is rejected/)
  assert.match(script, /Step 8/)
  const patch = script.match(/--input - <<'EOF'\n(\{[\s\S]*?\})\nEOF/)
  assert.ok(patch)
  assert.deepEqual(JSON.parse(patch[1]), {
    allow_squash_merge: true,
    allow_merge_commit: false,
    allow_rebase_merge: false,
    delete_branch_on_merge: true,
    allow_auto_merge: true,
  })
})

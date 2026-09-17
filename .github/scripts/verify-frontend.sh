#!/usr/bin/env bash
set -euo pipefail
repo=$1
commit=$2
sha256=$3
[[ $commit =~ ^[0-9a-f]{40}$ && $sha256 =~ ^[0-9a-f]{64}$ ]]
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
gh release download "perinbound-$commit" --repo "$repo" --pattern build-info.json --dir "$tmp"
tree=$(git rev-parse HEAD:libs/contract)
jq -e --arg commit "$commit" --arg sha256 "$sha256" --arg tree "$tree" \
  '.frontendCommit == $commit and .sha256 == $sha256 and .backendContractTree == $tree and (.runId | type == "number") and (.runAttempt | type == "number")' \
  "$tmp/build-info.json" > /dev/null
run=$(jq -r .runId "$tmp/build-info.json")
attempt=$(jq -r .runAttempt "$tmp/build-info.json")
[[ $run =~ ^[0-9]+$ && $attempt =~ ^[1-9][0-9]*$ ]]
gh api "repos/$repo/actions/runs/$run/attempts/$attempt" | jq -e --arg commit "$commit" --argjson attempt "$attempt" \
  '.head_sha == $commit and .run_attempt == $attempt and .status == "completed" and .conclusion == "success" and .path == ".github/workflows/fork-build.yml"' > /dev/null
echo "Verified frontend $commit from successful run $run attempt $attempt with matching backend contract."

#!/usr/bin/env bash
set -euo pipefail
script=$(realpath "${1:-$(dirname "$0")/verify-frontend.sh}")
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"
git init -q
git config user.email ci-check@example.invalid
git config user.name CI-check
mkdir -p libs/contract
printf 'contract\n' > libs/contract/source
git add .
git commit -qm fixture
export CONTRACT_TREE=$(git rev-parse HEAD:libs/contract)
export FRONTEND_COMMIT=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export FRONTEND_SHA256=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
export CASE=valid
# GitHub is the trust boundary; exercise the real gate against its possible responses.
gh() {
  if [[ $1 == run ]]; then echo 0; return; fi
  if [[ $CASE == missing ]]; then return 1; fi
  if [[ $1 == release && $2 == download ]]; then
    local destination
    while (($#)); do
      if [[ $1 == --dir ]]; then destination=$2; break; fi
      shift
    done
    jq -n --arg frontend "$FRONTEND_COMMIT" --arg tree "${TEST_TREE:-$CONTRACT_TREE}" --arg sha "${TEST_SHA:-$FRONTEND_SHA256}" \
      '{frontendCommit:$frontend,backendContractTree:$tree,sha256:$sha,runId:123,runAttempt:1}' > "$destination/build-info.json"
  elif [[ $1 == api ]]; then
    local conclusion=success
    if [[ $CASE == failed || ( $CASE == rerun && $2 != */attempts/1 ) ]]; then conclusion=failure; fi
    jq -n --arg head "${TEST_HEAD:-$FRONTEND_COMMIT}" --arg conclusion "$conclusion" \
      '{head_sha:$head,conclusion:$conclusion,status:"completed",path:".github/workflows/fork-build.yml",run_attempt:1}'
  else
    return 1
  fi
}
export -f gh
bash "$script" example/frontend "$FRONTEND_COMMIT" "$FRONTEND_SHA256"
for CASE in failed missing wrong-head wrong-contract wrong-checksum; do
  export CASE
  export TEST_HEAD=$FRONTEND_COMMIT TEST_TREE=$CONTRACT_TREE TEST_SHA=$FRONTEND_SHA256
  [[ $CASE != wrong-head ]] || TEST_HEAD=cccccccccccccccccccccccccccccccccccccccc
  [[ $CASE != wrong-contract ]] || TEST_TREE=dddddddddddddddddddddddddddddddddddddddd
  [[ $CASE != wrong-checksum ]] || TEST_SHA=eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
  if bash "$script" example/frontend "$FRONTEND_COMMIT" "$FRONTEND_SHA256" > "$tmp/output" 2>&1; then
    echo "FAIL: accepted $CASE frontend artifact" >&2
    exit 1
  fi
  echo "Rejected $CASE frontend artifact"
done
export CASE=rerun TEST_HEAD=$FRONTEND_COMMIT TEST_TREE=$CONTRACT_TREE TEST_SHA=$FRONTEND_SHA256
if ! bash "$script" example/frontend "$FRONTEND_COMMIT" "$FRONTEND_SHA256"; then
  echo "FAIL: later failed rerun invalidated the successful publishing attempt" >&2
  exit 1
fi

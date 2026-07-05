# Fork allocation ledger — backend

This fork (`kirisame-meguru/backend`) carries the **per-user-per-inbound traffic stats** feature directly
on **`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| prisma migration timestamp | `_per_user_per_inbound_usage` | `prisma/migrations/<ts>_per_user_per_inbound_usage/` | **restamped to newest** (see rule) | regenerate at PR |
| own package version | `@remnawave/backend-contract` | `libs/contract/package.json` | 2.8.35 (= upstream; kept so frontend's `file:` filename matches) | revert for PR |
| dependency spec (feature-required) | `@remnawave/node-contract` | `package.json` | `file:vendor/remnawave-node-contract-2.8.0.tgz` | keep; remap to upstream-published |
| endpoint RBAC scope | `user-inbounds-usage` / `set-inbound-usage-tracking` | contract `getEndpointDetails` 4th arg | descriptive new scopes | keep |

No new **error codes** were added in backend (its `A2##` namespace is untouched). All other additions —
table `config_profile_inbounds_user_usage_history`, columns `track_user_usage` / `track_inbound_user_usage`,
indexes, FKs, REST routes, ts-rest commands, CQRS handlers, the new module — are **descriptive unique
names**: a collision would be a *visible* git textual conflict, so no reserved band is needed. (After any
rebase that auto-merges `schema.prisma` or `errors.ts`, still eyeball for an accidental duplicate.)

## 2.8.0 sync notes (what changed vs the 2.7.4-era doc)

- **Mihomo xhttp patch DROPPED.** Upstream 2.8.0 ships native Mihomo VLESS-XHTTP
  (`UNSUPPORTED_TRANSPORTS = ['kcp']`, Stash exclusion, `case 'xhttp'` with `XHTTP_FIELD_MAP`).
  The fork's two mihomo commits are gone — upstream's implementation supersedes them.
- **connectionOpts refactor.** Upstream replaced `nodeAddress`/`nodePort` with
  `connectionOpts: INodeConnectionOpts` (adds `proxyUrl`) across the node payload, online-nodes
  query/repository, and `AxiosService`. The feature's `getUsersInboundsStats` +
  `recordInboundUserUsage` were adapted to the new convention (see `fix: adapt per-inbound…` commit).
- **getEndpointDetails** now requires a `scopeOptions` 4th arg — added to the two fork commands.
- `@remnawave/node-contract` is now vendored as a `file:` tarball
  (`vendor/remnawave-node-contract-2.8.0.tgz`, rebuilt from the node fork's `libs/contract`).

## Migration timestamp — standing rule (MEDIUM risk)

The migration is a **new directory**, so it never textually conflicts. Its only hazard is *ordering*:
if it was already applied to a database and a later upstream sync brings in an unapplied migration with
an **earlier** timestamp, Prisma reports a migration "found in the middle" / drift.

**Rule:** before every deploy/integration *after a rebase*, re-stamp this migration so it is the newest:

```
NEWTS=$(date -u +%Y%m%d%H%M%S)
git mv prisma/migrations/<old-ts>_per_user_per_inbound_usage \
       prisma/migrations/${NEWTS}_per_user_per_inbound_usage
```

(The `migration.sql` body never changes — only the directory name, which is the ordering key.) It was
originally a fixed midnight value `20260530000000`; it has been restamped to a real current timestamp.

## For PR / version handling

- `libs/contract/package.json` version is kept at upstream's (2.8.35) — no fork bump — so the built
  `backend-contract` tarball filename keeps matching the frontend's `file:` spec.
- **Keep** the `@remnawave/node-contract` dependency-spec bump (feature needs the new node endpoint),
  remapping to the upstream-published version.
- Lockfiles are isolated in a separate `chore:` commit; on rebase conflict take upstream then `npm install`.
- Regenerate the migration with a fresh timestamp at PR time.

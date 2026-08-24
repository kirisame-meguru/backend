# Fork allocation ledger — backend

This fork (`kirisame-meguru/backend`) carries the **per-user-per-inbound traffic stats** feature directly
on **`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| prisma migration timestamp | `_per_user_per_inbound_usage`, `_drop_per_inbound_tracking_flags` | `prisma/migrations/<ts>_*/` | **restamped to newest** (see rule) | regenerate at PR |
| own package version | `@remnawave/backend-contract` | `libs/contract/package.json` | 3.4.3 (fork bump over upstream 3.4.2; frontend's `file:` filename must match) | revert for PR |
| dependency spec (feature-required) | `@remnawave/node-contract` | `package.json` | `file:vendor/remnawave-node-contract-3.3.0.tgz` | keep; remap to upstream-published |
| endpoint RBAC scope | `user-inbounds-usage` | contract `getEndpointDetails` 4th arg | descriptive new scope | keep |

No new **error codes** were added in backend (its `A2##` namespace is untouched). All other additions —
table `config_profile_inbounds_user_usage_history`, indexes, FKs, REST routes, ts-rest commands, CQRS
handlers, the new module — are **descriptive unique names**: a collision would be a *visible* git textual
conflict, so no reserved band is needed. (After any rebase that auto-merges `schema.prisma` or
`errors.ts`, still eyeball for an accidental duplicate.)

## The panel does not control tracking (as of the `trackTrafficPerUser` rework)

Tracking is switched on *inside the xray config*: `$.inbounds[].trackTrafficPerUser: true`. The backend
only stores and forwards that config — `XRayConfig` (`src/common/helpers/xray-config/`) parses the JSON
into a plain object and never strips unknown inbound keys, and `sortXrayConfig` (`xray-typed`) only
reorders top-level keys. So the flag reaches the node, and the node reaches xray-core, untouched.

Removed in the rework: columns `nodes.track_inbound_user_usage` and
`config_profile_inbounds.track_user_usage` (migration `_drop_per_inbound_tracking_flags`), the
`set-inbound-usage-tracking` endpoint/command/scope, and `internals.trackedInboundTags` on `StartXray`
(hence the node-contract fork bump). `recordInboundUserUsage()` now runs for **every** online node — the node
returns an empty result when no inbound opted in, so it is safe and self-gating.

## 3.3.2 sync notes (what changed vs the 2.8.0-era doc)

- **`users.uuid` is GONE; the PK renamed `t_id` -> `id`.** Upstream migrations
  `20260720124815_rename_column` + `20260720132335_drop_user_uuid` dropped the user UUID entirely and
  renamed the bigint PK. Every user-facing stats endpoint now takes a numeric `userId`. The fork
  followed: route constant `BANDWIDTH_STATS.USERS.GET_INBOUNDS_BY_UUID` -> `GET_INBOUNDS_BY_ID`,
  `GetStatsUserPerInboundUsageCommand.RequestSchema/Request` -> `RequestParamSchema/RequestParam`
  (`userId: numberParamSchema`), the service dropped its `GetUserByUniqueFieldQuery` lookup and takes
  `userId: number` directly, and the bulk-upsert builder's guard is now
  `WHERE EXISTS (SELECT 1 FROM users WHERE id = v.user_id)`.
  `prisma/schema.prisma`: `references: [tId]` -> `references: [id]`; the fork migration's FK is now
  `REFERENCES "users"("id")` — correct **because the standing restamp rule puts it after upstream's
  rename migration**. If you ever stop restamping, this FK has to go back to `t_id`.
- **`feat(hosts): raise remark max length from 40 to 100` DROPPED.** Upstream implements it natively:
  `libs/contract/commands/hosts/{create,update}.command.ts` ship `.max(100)`, `schema.prisma` has
  `remark String @db.VarChar(100)`, and migration `20260703205426_increase_host_remark_limit` runs the
  same `ALTER TABLE "hosts" ALTER COLUMN "remark" SET DATA TYPE VARCHAR(100)`. The fork's
  `_widen_host_remark_to_100` migration went with it.
- **`AxiosService` collapsed into a generic `private request<T>(INodeRequestOpts)`.**
  `resolveAgentAndUrl()` is gone (replaced by `getNodeUrl()` + `resolveAgent()`), and every node call
  returns `TResult<T['response']>` (already unwrapped). `getUsersInboundsStats` was rewritten onto the
  helper, so `recordInboundUserUsage()` now reads `response.response.usersInbounds`.
- **The `try` package (`t(() => ...)`) was removed from dependencies**; upstream uses a plain
  `try { BigInt(x) } catch { return; }`. The per-inbound row filter follows suit.
- **Mihomo generator rebuilt immutably.** `renderConfig` now spreads into a `finalConfig` and returns
  `dump(finalConfig)` instead of mutating `yamlConfig`, and `resolveGroupRemarks` receives the already
  extracted `remnawaveCustom` rather than the group. The fork's `proxy-tags` filter was re-applied on
  that shape (`ProxyEntry[]` pool -> filter -> remarks). Upstream still has **no** native proxy-tag
  filtering (only `include-proxies` / `select-random-proxy` / `shuffle-proxies-order`), so the commit
  stays.
- **Scopes guard.** `BandwidthStatsUserInboundsController` now carries
  `@ApiScopeResource(CONTROLLERS_INFO.BANDWIDTH_STATS.resource)` + `ScopesGuard`, matching upstream's
  sibling controller — without them the declared `user-inbounds-usage` scope is not enforced.
- **zod 4.** Contract schemas use `z.iso.date()` / `z.uuid()` / `numberParamSchema`; `z.string().date()`
  and `z.string().uuid()` are gone.
- `Dockerfile`: upstream dropped `COPY patches` and added `COPY @types`; the fork keeps its
  `COPY vendor ./vendor` line and its `FRONTEND_URL` override.

## 2.8.0 sync notes (what changed vs the 2.7.4-era doc)

- **Mihomo xhttp patch DROPPED.** Upstream 2.8.0 ships native Mihomo VLESS-XHTTP
  (`UNSUPPORTED_TRANSPORTS = ['kcp']`, Stash exclusion, `case 'xhttp'` with `XHTTP_FIELD_MAP`).
  The fork's two mihomo commits are gone — upstream's implementation supersedes them.
- **connectionOpts refactor.** Upstream replaced `nodeAddress`/`nodePort` with
  `connectionOpts: INodeConnectionOpts` (adds `proxyUrl`) across the node payload, online-nodes
  query/repository, and `AxiosService`. The feature's `getUsersInboundsStats` +
  `recordInboundUserUsage` were adapted to the new convention (see `fix: adapt per-inbound…` commit).
- **getEndpointDetails** now requires a `scopeOptions` 4th arg — added to the fork command.
- `@remnawave/node-contract` is now vendored as a `file:` tarball
  (`vendor/remnawave-node-contract-2.9.0.tgz`, rebuilt from the node fork's `libs/contract`).

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

- `libs/contract/package.json` is bumped to 2.8.36 because the contract shape changed; the frontend's
  `file:vendor/remnawave-backend-contract-2.8.36.tgz` spec must be bumped in lockstep or npm serves a
  stale cached tarball.
- **Keep** the `@remnawave/node-contract` dependency-spec bump (feature needs the new node endpoint),
  remapping to the upstream-published version.
- Lockfiles are isolated in a separate `chore:` commit; on rebase conflict take upstream then `npm install`.
- Regenerate the migration with a fresh timestamp at PR time.

# Fork allocation ledger — backend

This fork (`kirisame-meguru/backend`) carries the **per-user-per-inbound traffic stats** feature directly
on **`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| prisma migration timestamp | `_per_user_per_inbound_usage`, `_drop_per_inbound_tracking_flags` | `prisma/migrations/<ts>_*/` | **pinned — never restamp** (see rule) | regenerate at PR |
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
  `prisma/schema.prisma`: `references: [tId]` -> `references: [id]`. The fork migration's FK stays
  `REFERENCES "users"("t_id")` because the migration is pinned *before* upstream's rename; Postgres
  carries the FK through the rename, so it ends up on `users("id")`. See the pinned-timestamps rule.
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

## Migration timestamps — PINNED, never restamp again (was a HIGH-risk footgun)

**The old "restamp to newest before every deploy" rule is retired. Do not restamp these.**

Current, permanent names:

| Migration | Sits between |
|-----------|--------------|
| `20260705123828_per_user_per_inbound_usage` | upstream `20260703205426_increase_host_remark_limit` → `20260706144257_drop_default_on_api_tokens` |
| `20260710000000_drop_per_inbound_tracking_flags` | upstream `20260706192331_change_hwid_datatype` → `20260710141018_add_nuuh_user_id_created_at_index` |

Why restamping was wrong: a migration's directory name is its **identity** in
`_prisma_migrations`. Renaming one that a database has *already applied* makes Prisma see a brand-new
migration and run it again — and the first statement is `CREATE TABLE
config_profile_inbounds_user_usage_history`, which fails because the table is already there. The
migration is then recorded as failed and `migrate deploy` refuses to do anything else, so the panel
crash-loops on boot.

This is not hypothetical. It happened on **2026-07-05** on the Tokyo panel: `_prisma_migrations` still
carries the wreckage — a failed `20260705123828_per_user_per_inbound_usage` row (`finished_at` NULL,
`rolled_back_at` set) followed by a hand-made `--applied` marker row with `applied_steps_count = 0`,
plus the original `20260530194027_per_user_per_inbound_usage` from the first deploy. Every restamp buys
another round of that manual recovery, on every deployed database, forever.

Because these timestamps now sit **before** upstream's `20260720124815_rename_column`, the fork
migration's user FK must reference `users("t_id")`, the column name in force at that point. Postgres
carries dependent FKs through `ALTER TABLE ... RENAME COLUMN`, so after upstream's rename the
constraint targets `users("id")` — which is what `schema.prisma` declares (`references: [id]`).
Verified end to end: fresh-DB `migrate deploy` + `migrate diff` clean, and a restore of the Tokyo dump
then `migrate deploy` applies only the 17 pending upstream migrations, skips both fork migrations, and
leaves `migrate diff --from-url` reporting "No difference detected".

If a future upstream migration ever genuinely has to run *before* these, insert a new fork migration
with a later timestamp instead of renaming these two.

## For PR / version handling

- `libs/contract/package.json` is bumped to 2.8.36 because the contract shape changed; the frontend's
  `file:vendor/remnawave-backend-contract-2.8.36.tgz` spec must be bumped in lockstep or npm serves a
  stale cached tarball.
- **Keep** the `@remnawave/node-contract` dependency-spec bump (feature needs the new node endpoint),
  remapping to the upstream-published version.
- Lockfiles are isolated in a separate `chore:` commit; on rebase conflict take upstream then `npm install`.
- Do **not** regenerate the migration timestamps — see the pinned-timestamps rule. At PR time, squash
  the two fork migrations into one freshly-stamped migration against upstream's tip instead.

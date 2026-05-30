# Fork allocation ledger — backend

This fork (`kirisame-meguru/backend`) carries the **per-user-per-inbound traffic stats** feature on
branch `per-user-per-inbound-traffic-stats`. See `../FORK-RESILIENCE.md` for the sync playbook.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| prisma migration timestamp | `_per_user_per_inbound_usage` | `prisma/migrations/<ts>_per_user_per_inbound_usage/` | **restamped to newest** (see rule) | regenerate at PR |
| own package version | `@remnawave/backend-contract` | `libs/contract/package.json` | 2.7.2 → 2.8.0 | revert for PR |
| dependency spec (feature-required) | `@remnawave/node-contract` | `package.json` | 2.8.0 | keep; remap to upstream-published |

No new **error codes** were added in backend (its `A2##` namespace is untouched). All other additions —
table `config_profile_inbounds_user_usage_history`, columns `track_user_usage` / `track_inbound_user_usage`,
indexes, FKs, REST routes, ts-rest commands, CQRS handlers, the new module — are **descriptive unique
names**: a collision would be a *visible* git textual conflict, so no reserved band is needed. (After any
rebase that auto-merges `schema.prisma` or `errors.ts`, still eyeball for an accidental duplicate.)

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

- Revert the **own `version`** bump in `libs/contract/package.json` (backend-contract 2.7.2 → 2.8.0).
- **Keep** the `@remnawave/node-contract` dependency-spec bump (feature needs the new node endpoint),
  remapping to the upstream-published version.
- Lockfiles are isolated in a separate `chore:` commit; on rebase conflict take upstream then `npm install`.
- Regenerate the migration with a fresh timestamp at PR time.

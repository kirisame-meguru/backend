import { Prisma } from '@prisma/client';

import { IInboundUserUsageEntry } from '../../commands/bulk-upsert-inbound-user-history-entry/bulk-upsert-inbound-user-history-entry.command';

export class BulkUpsertInboundUserHistoryEntryBuilder {
    public query: Prisma.Sql;

    constructor(usageHistoryList: IInboundUserUsageEntry[]) {
        this.query = this.getQuery(usageHistoryList);
        return this;
    }

    private getQuery(usageHistoryList: IInboundUserUsageEntry[]): Prisma.Sql {
        const sorted = [...usageHistoryList].sort((a, b) =>
            a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0,
        );
        const values = Prisma.join(
            sorted.map(
                (h) =>
                    Prisma.sql`(${h.tag}, ${h.userId}, ${h.totalBytes}, (NOW() AT TIME ZONE 'UTC')::date, NOW())`,
            ),
        );

        // tag -> inbound uuid is resolved atomically via the INNER JOIN on the
        // globally-unique config_profile_inbounds.tag. Rows whose tag has no
        // matching inbound (e.g. renamed/deleted/system tags) are dropped by the
        // join; rows whose user no longer exists are dropped by the WHERE EXISTS.
        return Prisma.sql`
            INSERT INTO config_profile_inbounds_user_usage_history (
                inbound_uuid,
                user_id,
                total_bytes,
                created_at,
                updated_at
            )
            SELECT
                cpi.uuid,
                v.user_id,
                v.total_bytes,
                v.created_at,
                v.updated_at
            FROM (
                VALUES ${values}
            ) AS v(tag, user_id, total_bytes, created_at, updated_at)
            INNER JOIN config_profile_inbounds cpi ON cpi.tag = v.tag
            WHERE EXISTS (SELECT 1 FROM users WHERE t_id = v.user_id)
            ON CONFLICT ON CONSTRAINT config_profile_inbounds_user_usage_history_pkey
            DO UPDATE SET
                total_bytes = config_profile_inbounds_user_usage_history.total_bytes + EXCLUDED.total_bytes,
                updated_at  = EXCLUDED.updated_at
        `;
    }
}

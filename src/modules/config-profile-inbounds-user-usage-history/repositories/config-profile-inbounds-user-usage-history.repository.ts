import { Prisma } from '@prisma/client';

import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database/tx-kysely.service';

import { BulkUpsertInboundUserHistoryEntryBuilder } from '../builders/bulk-upsert-inbound-user-history-entry/bulk-upsert-inbound-user-history-entry.builder';
import { IInboundUserUsageEntry } from '../commands/bulk-upsert-inbound-user-history-entry/bulk-upsert-inbound-user-history-entry.command';
import { IGetInboundSeries, IGetTopInbound } from '../interfaces';

@Injectable()
export class ConfigProfileInboundsUserUsageHistoryRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly qb: TxKyselyService,
    ) {}

    public async bulkUpsertUsageHistory(
        usageHistoryList: IInboundUserUsageEntry[],
    ): Promise<void> {
        const { query } = new BulkUpsertInboundUserHistoryEntryBuilder(usageHistoryList);
        await this.prisma.tx.$executeRaw<void>(query);
    }

    public async cleanOldUsageRecords(): Promise<number> {
        const query = Prisma.sql`
            DELETE FROM config_profile_inbounds_user_usage_history
            WHERE created_at < NOW() - INTERVAL '14 days'
        `;

        return await this.prisma.tx.$executeRaw<number>(query);
    }

    public async vacuumTable(): Promise<void> {
        const query = Prisma.sql`
            VACUUM config_profile_inbounds_user_usage_history;
        `;

        const queryReindex = Prisma.sql`
            REINDEX TABLE config_profile_inbounds_user_usage_history;
        `;

        await this.prisma.tx.$executeRaw<void>(query);
        await this.prisma.tx.$executeRaw<void>(queryReindex);
    }

    public async truncateTable(): Promise<void> {
        const query = Prisma.sql`
            TRUNCATE config_profile_inbounds_user_usage_history;
        `;

        await this.prisma.tx.$executeRaw<void>(query);
    }

    public async getUserInboundsUsageByRange(
        userId: bigint,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<IGetInboundSeries[]> {
        const query = Prisma.sql`
            WITH daily_usage AS (
                SELECT
                    cpi.uuid,
                    cpi.tag,
                    cpi.type,
                    cpi.port,
                    h.created_at::date AS date,
                    SUM(h.total_bytes) AS bytes
                FROM config_profile_inbounds cpi
                INNER JOIN config_profile_inbounds_user_usage_history h ON h.inbound_uuid = cpi.uuid
                WHERE
                    h.user_id = ${userId}
                    AND h.created_at >= ${start}::date
                    AND h.created_at <= ${end}::date
                GROUP BY cpi.uuid, cpi.tag, cpi.type, cpi.port, h.created_at
            ),
            inbounds_with_totals AS (
                SELECT
                    uuid,
                    tag,
                    type,
                    port,
                    SUM(bytes) AS total_bytes
                FROM daily_usage
                GROUP BY uuid, tag, type, port
            )
            SELECT
                it.uuid as "uuid",
                it.tag as "tag",
                it.type as "type",
                it.port as "port",
                it.total_bytes as "total",
                ARRAY_AGG(
                    COALESCE(du.bytes, 0)
                    ORDER BY d.ord
                ) AS "data"
            FROM inbounds_with_totals it
            CROSS JOIN unnest(${dates}::date[]) WITH ORDINALITY AS d(date, ord)
            LEFT JOIN daily_usage du
                ON du.uuid = it.uuid
                AND du.date = d.date::date
            GROUP BY it.uuid, it.tag, it.type, it.port, it.total_bytes
            ORDER BY it.total_bytes DESC;
        `;

        return await this.prisma.tx.$queryRaw<IGetInboundSeries[]>(query);
    }

    public async getTopUserInboundsByTraffic(
        userId: bigint,
        start: Date,
        end: Date,
        limit: number = 5,
    ): Promise<IGetTopInbound[]> {
        return await this.qb.kysely
            .selectFrom('configProfileInbounds as cpi')
            .innerJoin('configProfileInboundsUserUsageHistory as h', 'h.inboundUuid', 'cpi.uuid')
            .select([
                'cpi.uuid',
                'cpi.tag',
                'cpi.type',
                'cpi.port',
                (eb) => eb.fn.sum<bigint>('h.totalBytes').as('total'),
            ])
            .where('h.userId', '=', userId)
            .where('h.createdAt', '>=', start)
            .where('h.createdAt', '<=', end)
            .groupBy(['cpi.uuid', 'cpi.tag', 'cpi.type', 'cpi.port'])
            .orderBy((eb) => eb.fn.sum<bigint>('h.totalBytes'), 'desc')
            .limit(limit)
            .execute();
    }

    public async getUserDailyTrafficSum(
        userId: bigint,
        start: Date,
        end: Date,
        dates: string[],
    ): Promise<number[]> {
        const query = Prisma.sql`
            WITH daily_traffic AS (
                SELECT
                    created_at::date AS date,
                    SUM(total_bytes) AS bytes
                FROM config_profile_inbounds_user_usage_history
                WHERE
                    user_id = ${userId}
                    AND created_at >= ${start}::date
                    AND created_at <= ${end}::date
                GROUP BY created_at
            )
            SELECT
                COALESCE(dt.bytes, 0) AS value
            FROM unnest(${dates}::date[]) WITH ORDINALITY AS d(date, ord)
            LEFT JOIN daily_traffic dt ON dt.date = d.date::date
            ORDER BY d.ord;
        `;

        const result = await this.prisma.tx.$queryRaw<Array<{ value: bigint }>>(query);
        return result.map((item) => Number(item.value));
    }
}

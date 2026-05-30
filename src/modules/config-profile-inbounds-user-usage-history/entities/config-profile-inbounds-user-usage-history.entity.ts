import { ConfigProfileInboundsUserUsageHistory } from '@prisma/client';

export class ConfigProfileInboundsUserUsageHistoryEntity
    implements ConfigProfileInboundsUserUsageHistory
{
    inboundUuid: string;
    userId: bigint;
    totalBytes: bigint;
    createdAt: Date;
    updatedAt: Date;

    constructor(history: Partial<ConfigProfileInboundsUserUsageHistory>) {
        Object.assign(this, history);
        return this;
    }
}

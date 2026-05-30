import { ConfigProfileInboundsUserUsageHistory } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { ConfigProfileInboundsUserUsageHistoryEntity } from './entities/config-profile-inbounds-user-usage-history.entity';

const modelToEntity = (
    model: ConfigProfileInboundsUserUsageHistory,
): ConfigProfileInboundsUserUsageHistoryEntity => {
    return new ConfigProfileInboundsUserUsageHistoryEntity(model);
};

const entityToModel = (
    entity: ConfigProfileInboundsUserUsageHistoryEntity,
): ConfigProfileInboundsUserUsageHistory => {
    return {
        inboundUuid: entity.inboundUuid,
        userId: entity.userId,
        totalBytes: entity.totalBytes,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};

@Injectable()
export class ConfigProfileInboundsUserUsageHistoryConverter extends UniversalConverter<
    ConfigProfileInboundsUserUsageHistoryEntity,
    ConfigProfileInboundsUserUsageHistory
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}

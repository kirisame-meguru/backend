import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';

import { ConfigProfileInboundsUserUsageHistoryRepository } from './repositories/config-profile-inbounds-user-usage-history.repository';
import { ConfigProfileInboundsUserUsageHistoryConverter } from './config-profile-inbounds-user-usage-history.converter';
import { ConfigProfileInboundsUserUsageHistoryService } from './config-profile-inbounds-user-usage-history.service';
import { BandwidthStatsUserInboundsController } from './bandwidth-stats-user-inbounds.controller';
import { COMMANDS } from './commands';

@Module({
    imports: [CqrsModule],
    controllers: [BandwidthStatsUserInboundsController],
    providers: [
        ConfigProfileInboundsUserUsageHistoryRepository,
        ConfigProfileInboundsUserUsageHistoryConverter,
        ConfigProfileInboundsUserUsageHistoryService,
        ...COMMANDS,
    ],
})
export class ConfigProfileInboundsUserUsageHistoryModule {}

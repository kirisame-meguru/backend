import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ConfigProfileInboundsUserUsageHistoryRepository } from '../../repositories/config-profile-inbounds-user-usage-history.repository';
import { TruncateConfigProfileInboundsUserUsageHistoryCommand } from './truncate-config-profile-inbounds-user-usage-history.command';

@CommandHandler(TruncateConfigProfileInboundsUserUsageHistoryCommand)
export class TruncateConfigProfileInboundsUserUsageHistoryHandler
    implements ICommandHandler<TruncateConfigProfileInboundsUserUsageHistoryCommand>
{
    public readonly logger = new Logger(
        TruncateConfigProfileInboundsUserUsageHistoryHandler.name,
    );

    constructor(
        private readonly repository: ConfigProfileInboundsUserUsageHistoryRepository,
    ) {}

    async execute() {
        try {
            await this.repository.truncateTable();

            return;
        } catch (error: unknown) {
            this.logger.error(`Error during truncate table: ${error}`);
            return;
        }
    }
}

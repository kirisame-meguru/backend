import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ConfigProfileInboundsUserUsageHistoryRepository } from '../../repositories/config-profile-inbounds-user-usage-history.repository';
import { BulkUpsertInboundUserHistoryEntryCommand } from './bulk-upsert-inbound-user-history-entry.command';

@CommandHandler(BulkUpsertInboundUserHistoryEntryCommand)
export class BulkUpsertInboundUserHistoryEntryHandler
    implements ICommandHandler<BulkUpsertInboundUserHistoryEntryCommand>
{
    public readonly logger = new Logger(BulkUpsertInboundUserHistoryEntryHandler.name);

    constructor(
        private readonly repository: ConfigProfileInboundsUserUsageHistoryRepository,
    ) {}

    async execute(command: BulkUpsertInboundUserHistoryEntryCommand) {
        try {
            await this.repository.bulkUpsertUsageHistory(command.userUsageHistoryList);
            return;
        } catch (error: unknown) {
            this.logger.error(error);
            return;
        }
    }
}

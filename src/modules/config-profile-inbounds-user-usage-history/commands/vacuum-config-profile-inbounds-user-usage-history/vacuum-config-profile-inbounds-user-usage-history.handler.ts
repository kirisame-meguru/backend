import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';

import { ConfigProfileInboundsUserUsageHistoryRepository } from '../../repositories/config-profile-inbounds-user-usage-history.repository';
import { VacuumConfigProfileInboundsUserUsageHistoryCommand } from './vacuum-config-profile-inbounds-user-usage-history.command';

@CommandHandler(VacuumConfigProfileInboundsUserUsageHistoryCommand)
export class VacuumConfigProfileInboundsUserUsageHistoryHandler
    implements ICommandHandler<VacuumConfigProfileInboundsUserUsageHistoryCommand>
{
    public readonly logger = new Logger(VacuumConfigProfileInboundsUserUsageHistoryHandler.name);

    constructor(
        private readonly repository: ConfigProfileInboundsUserUsageHistoryRepository,
    ) {}

    async execute() {
        try {
            await this.repository.vacuumTable();

            return;
        } catch (error: unknown) {
            this.logger.error(`Error during vacuum table: ${error}`);
            return;
        }
    }
}

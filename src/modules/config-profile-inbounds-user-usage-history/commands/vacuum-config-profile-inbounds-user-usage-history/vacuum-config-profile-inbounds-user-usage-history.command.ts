import { Command } from '@nestjs/cqrs';

export class VacuumConfigProfileInboundsUserUsageHistoryCommand extends Command<void> {
    constructor() {
        super();
    }
}

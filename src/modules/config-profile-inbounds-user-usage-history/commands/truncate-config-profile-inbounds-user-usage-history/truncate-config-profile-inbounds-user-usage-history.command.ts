import { Command } from '@nestjs/cqrs';

export class TruncateConfigProfileInboundsUserUsageHistoryCommand extends Command<void> {
    constructor() {
        super();
    }
}

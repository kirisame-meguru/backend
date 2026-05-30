import { Command } from '@nestjs/cqrs';

export interface IInboundUserUsageEntry {
    tag: string;
    userId: bigint;
    totalBytes: bigint;
}

export class BulkUpsertInboundUserHistoryEntryCommand extends Command<void> {
    constructor(public readonly userUsageHistoryList: IInboundUserUsageEntry[]) {
        super();
    }
}

import { TruncateConfigProfileInboundsUserUsageHistoryHandler } from './truncate-config-profile-inbounds-user-usage-history';
import { VacuumConfigProfileInboundsUserUsageHistoryHandler } from './vacuum-config-profile-inbounds-user-usage-history';
import { BulkUpsertInboundUserHistoryEntryHandler } from './bulk-upsert-inbound-user-history-entry';

export const COMMANDS = [
    BulkUpsertInboundUserHistoryEntryHandler,
    VacuumConfigProfileInboundsUserUsageHistoryHandler,
    TruncateConfigProfileInboundsUserUsageHistoryHandler,
];

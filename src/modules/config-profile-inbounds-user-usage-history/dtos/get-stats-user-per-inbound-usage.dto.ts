import { createZodDto } from 'nestjs-zod';

import { GetStatsUserPerInboundUsageCommand } from '@contract/commands';

export class GetStatsUserPerInboundUsageQueryDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.RequestQuerySchema,
) {}

export class GetStatsUserPerInboundUsageParamDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.RequestParamSchema,
) {}

export class GetStatsUserPerInboundUsageResponseDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.ResponseSchema,
) {}

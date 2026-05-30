import { createZodDto } from 'nestjs-zod';

import { GetStatsUserPerInboundUsageCommand } from '@contract/commands';

export class GetStatsUserPerInboundUsageRequestQueryDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.RequestQuerySchema,
) {}

export class GetStatsUserPerInboundUsageRequestDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.RequestSchema,
) {}

export class GetStatsUserPerInboundUsageResponseDto extends createZodDto(
    GetStatsUserPerInboundUsageCommand.ResponseSchema,
) {}

import { createZodDto } from 'nestjs-zod';

import { SetInboundUsageTrackingCommand } from '@libs/contracts/commands';

export class SetInboundUsageTrackingRequestDto extends createZodDto(
    SetInboundUsageTrackingCommand.RequestSchema,
) {}
export class SetInboundUsageTrackingResponseDto extends createZodDto(
    SetInboundUsageTrackingCommand.ResponseSchema,
) {}

import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { BANDWIDTH_STATS_USERS_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { GetStatsUserPerInboundUsageCommand } from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { ConfigProfileInboundsUserUsageHistoryService } from './config-profile-inbounds-user-usage-history.service';
import {
    GetStatsUserPerInboundUsageParamDto,
    GetStatsUserPerInboundUsageQueryDto,
    GetStatsUserPerInboundUsageResponseDto,
} from './dtos';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.BANDWIDTH_STATS.resource)
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_USERS_CONTROLLER)
export class BandwidthStatsUserInboundsController {
    constructor(private readonly service: ConfigProfileInboundsUserUsageHistoryService) {}

    @Endpoint({
        command: GetStatsUserPerInboundUsageCommand,
        httpCode: HttpStatus.OK,
        type: GetStatsUserPerInboundUsageResponseDto,
    })
    async getStatsUserPerInboundUsage(
        @Query() query: GetStatsUserPerInboundUsageQueryDto,
        @Param() param: GetStatsUserPerInboundUsageParamDto,
    ): Promise<GetStatsUserPerInboundUsageResponseDto> {
        const result = await this.service.getStatsUserPerInboundUsage(
            param.userId,
            query.start,
            query.end,
            query.topInboundsLimit,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}

import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';

import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { GetStatsUserPerInboundUsageCommand } from '@libs/contracts/commands';
import { BANDWIDTH_STATS_USERS_CONTROLLER, CONTROLLERS_INFO } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetStatsUserPerInboundUsageRequestDto,
    GetStatsUserPerInboundUsageRequestQueryDto,
    GetStatsUserPerInboundUsageResponseDto,
} from './dtos';
import { ConfigProfileInboundsUserUsageHistoryService } from './config-profile-inbounds-user-usage-history.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.BANDWIDTH_STATS.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(BANDWIDTH_STATS_USERS_CONTROLLER)
export class BandwidthStatsUserInboundsController {
    constructor(
        private readonly service: ConfigProfileInboundsUserUsageHistoryService,
    ) {}

    @ApiOkResponse({
        type: GetStatsUserPerInboundUsageResponseDto,
        description: 'Stats user per-inbound usage fetched successfully',
    })
    @ApiParam({ name: 'uuid', type: String, description: 'UUID of the user', required: true })
    @ApiQuery({
        name: 'end',
        type: String,
        description: 'End date (YYYY-MM-DD)',
        required: true,
        example: '2026-01-31',
        format: 'date',
    })
    @ApiQuery({
        name: 'start',
        type: String,
        description: 'Start date (YYYY-MM-DD)',
        required: true,
        example: '2026-01-01',
        format: 'date',
    })
    @ApiQuery({
        name: 'topInboundsLimit',
        type: Number,
        description: 'Limit of top inbounds to return',
        required: true,
    })
    @Endpoint({
        command: GetStatsUserPerInboundUsageCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatsUserPerInboundUsage(
        @Query() query: GetStatsUserPerInboundUsageRequestQueryDto,
        @Param() paramData: GetStatsUserPerInboundUsageRequestDto,
    ): Promise<GetStatsUserPerInboundUsageResponseDto> {
        const result = await this.service.getStatsUserPerInboundUsage(
            paramData.uuid,
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

import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { getDateRangeArrayUtil } from '@common/utils/get-date-range-array.util';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { ConfigProfileInboundsUserUsageHistoryRepository } from './repositories/config-profile-inbounds-user-usage-history.repository';
import { GetStatsUserPerInboundUsageResponseModel } from './models';

@Injectable()
export class ConfigProfileInboundsUserUsageHistoryService {
    private readonly logger = new Logger(ConfigProfileInboundsUserUsageHistoryService.name);

    constructor(
        private readonly repository: ConfigProfileInboundsUserUsageHistoryRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async getStatsUserPerInboundUsage(
        uuid: string,
        start: string,
        end: string,
        topInboundsLimit: number,
    ): Promise<TResult<GetStatsUserPerInboundUsageResponseModel>> {
        try {
            const user = await this.queryBus.execute(new GetUserByUniqueFieldQuery({ uuid }));
            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                dayjs.utc(start).startOf('day').toDate(),
                dayjs.utc(end).endOf('day').toDate(),
            );

            const dailyTraffic = await this.repository.getUserDailyTrafficSum(
                user.response.tId,
                startDate,
                endDate,
                dates,
            );

            const topInbounds = await this.repository.getTopUserInboundsByTraffic(
                user.response.tId,
                startDate,
                endDate,
                topInboundsLimit,
            );

            const inboundsUsage = await this.repository.getUserInboundsUsageByRange(
                user.response.tId,
                startDate,
                endDate,
                dates,
            );

            return ok(
                new GetStatsUserPerInboundUsageResponseModel({
                    categories: dates,
                    series: inboundsUsage,
                    sparklineData: dailyTraffic,
                    topInbounds: topInbounds,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_USAGE_BY_RANGE_ERROR);
        }
    }
}

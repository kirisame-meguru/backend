import dayjs from 'dayjs';

import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { getDateRangeArrayUtil } from '@common/utils/get-date-range-array.util';
import { ERRORS } from '@libs/contracts/constants';

import { GetStatsUserPerInboundUsageResponseModel } from './models';
import { ConfigProfileInboundsUserUsageHistoryRepository } from './repositories/config-profile-inbounds-user-usage-history.repository';

@Injectable()
export class ConfigProfileInboundsUserUsageHistoryService {
    private readonly logger = new Logger(ConfigProfileInboundsUserUsageHistoryService.name);

    constructor(
        private readonly repository: ConfigProfileInboundsUserUsageHistoryRepository,
    ) {}

    public async getStatsUserPerInboundUsage(
        userId: number,
        start: string,
        end: string,
        topInboundsLimit: number,
    ): Promise<TResult<GetStatsUserPerInboundUsageResponseModel>> {
        try {
            const { startDate, endDate, dates } = getDateRangeArrayUtil(
                dayjs.utc(start).startOf('day').toDate(),
                dayjs.utc(end).endOf('day').toDate(),
            );

            const dailyTraffic = await this.repository.getUserDailyTrafficSum(
                BigInt(userId),
                startDate,
                endDate,
                dates,
            );

            const topInbounds = await this.repository.getTopUserInboundsByTraffic(
                BigInt(userId),
                startDate,
                endDate,
                topInboundsLimit,
            );

            const inboundsUsage = await this.repository.getUserInboundsUsageByRange(
                BigInt(userId),
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

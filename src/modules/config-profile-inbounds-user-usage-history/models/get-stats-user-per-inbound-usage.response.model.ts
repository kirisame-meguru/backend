import { colorFromUuid } from '@kastov/uuid-color';

import {
    IGetInboundSeries,
    IGetInboundSeriesConverted,
    IGetTopInbound,
    IGetTopInboundConverted,
} from '../interfaces';

export class GetStatsUserPerInboundUsageResponseModel {
    public readonly categories: string[];
    public readonly series: IGetInboundSeriesConverted[];
    public readonly sparklineData: number[];
    public readonly topInbounds: IGetTopInboundConverted[];

    constructor(data: {
        categories: string[];
        series: IGetInboundSeries[];
        sparklineData: number[];
        topInbounds: IGetTopInbound[];
    }) {
        this.categories = data.categories;
        this.series = data.series.map((item) => ({
            uuid: item.uuid,
            tag: item.tag,
            type: item.type,
            port: item.port,
            color: colorFromUuid(item.uuid),
            total: Number(item.total),
            data: item.data.map((value) => Number(value)),
        }));
        this.sparklineData = data.sparklineData;
        this.topInbounds = data.topInbounds.map((item) => ({
            uuid: item.uuid,
            tag: item.tag,
            type: item.type,
            port: item.port,
            color: colorFromUuid(item.uuid),
            total: Number(item.total),
        }));
    }
}

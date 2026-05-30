export interface IGetInboundSeries {
    uuid: string;
    tag: string;
    type: string;
    port: null | number;
    total: bigint;
    data: bigint[];
}

export interface IGetInboundSeriesConverted {
    uuid: string;
    tag: string;
    type: string;
    port: null | number;
    color: string;
    total: number;
    data: number[];
}

export interface IGetTopInbound {
    uuid: string;
    tag: string;
    type: string;
    port: null | number;
    total: bigint;
}

export interface IGetTopInboundConverted {
    uuid: string;
    tag: string;
    type: string;
    port: null | number;
    color: string;
    total: number;
}

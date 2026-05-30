import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../../api';
import { ConfigProfileInboundsSchema } from '../../../models';
import { getEndpointDetails } from '../../../constants';

export namespace SetInboundUsageTrackingCommand {
    export const url = REST_API.CONFIG_PROFILES.ACTIONS.SET_INBOUND_USAGE_TRACKING;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.ACTIONS.SET_INBOUND_USAGE_TRACKING,
        'post',
        'Enable/disable per-user usage tracking for a config profile inbound',
    );

    export const RequestSchema = z.object({
        inboundUuid: z.string().uuid(),
        trackUserUsage: z.boolean(),
    });
    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: ConfigProfileInboundsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

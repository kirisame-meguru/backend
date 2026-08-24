-- Per-user-per-inbound tracking is now switched on inside the xray config itself
-- ($.inbounds[].trackTrafficPerUser), so these panel-side flags are gone.
-- The collected usage in config_profile_inbounds_user_usage_history is untouched.

-- AlterTable
ALTER TABLE "nodes" DROP COLUMN "track_inbound_user_usage";

-- AlterTable
ALTER TABLE "config_profile_inbounds" DROP COLUMN "track_user_usage";

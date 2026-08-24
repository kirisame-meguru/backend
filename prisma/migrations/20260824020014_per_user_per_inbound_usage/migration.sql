-- AlterTable
ALTER TABLE "config_profile_inbounds" ADD COLUMN     "track_user_usage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "track_inbound_user_usage" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "config_profile_inbounds_user_usage_history" (
    "inbound_uuid" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "total_bytes" BIGINT NOT NULL,
    "created_at" DATE NOT NULL DEFAULT CURRENT_DATE,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "config_profile_inbounds_user_usage_history_pkey" PRIMARY KEY ("inbound_uuid","created_at","user_id")
);

-- CreateIndex
CREATE INDEX "config_profile_inbounds_user_usage_history_user_id_created__idx" ON "config_profile_inbounds_user_usage_history"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "config_profile_inbounds_user_usage_history" ADD CONSTRAINT "config_profile_inbounds_user_usage_history_inbound_uuid_fkey" FOREIGN KEY ("inbound_uuid") REFERENCES "config_profile_inbounds"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_profile_inbounds_user_usage_history" ADD CONSTRAINT "config_profile_inbounds_user_usage_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

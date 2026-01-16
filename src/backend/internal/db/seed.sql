-- Seed data for local development
-- This file is executed by `just migrate-local`

INSERT INTO "public"."subscription_plans" (tier, monthly_price, specview_monthly_limit, analysis_monthly_limit, retention_days) VALUES
('free', 0, 5000, 50, 30),
('pro', 15, 100000, 1000, 180),
('pro_plus', 59, 500000, 5000, 365),
('enterprise', NULL, NULL, NULL, NULL);

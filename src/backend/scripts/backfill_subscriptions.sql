-- Backfill: Assign free plan to existing users without subscription
-- Run this script once after deploying the subscription feature

-- First, ensure subscription_plans has the required tiers
INSERT INTO subscription_plans (tier, specview_monthly_limit, analysis_monthly_limit, retention_days)
VALUES
    ('free', 5000, 50, 30),
    ('pro', 100000, 1000, 180),
    ('pro_plus', 500000, 5000, 365),
    ('enterprise', NULL, NULL, NULL)
ON CONFLICT (tier) DO NOTHING;

-- Then assign free plan to users without active subscription
WITH free_plan AS (
    SELECT id FROM subscription_plans WHERE tier = 'free'
),
users_without_sub AS (
    SELECT u.id AS user_id
    FROM users u
    WHERE NOT EXISTS (
        SELECT 1 FROM user_subscriptions us
        WHERE us.user_id = u.id AND us.status = 'active'
    )
)
INSERT INTO user_subscriptions (user_id, plan_id, current_period_start, current_period_end)
SELECT
    uws.user_id,
    fp.id,
    date_trunc('month', NOW()),
    date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 nanosecond'
FROM users_without_sub uws
CROSS JOIN free_plan fp;

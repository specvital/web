package port

import (
	"context"
	"time"

	"github.com/specvital/web/src/backend/modules/usage/domain/entity"
)

type UsageRepository interface {
	GetMonthlyUsage(ctx context.Context, userID string, eventType entity.EventType, periodStart, periodEnd time.Time) (int64, error)
	GetUsageByPeriod(ctx context.Context, userID string, periodStart, periodEnd time.Time) (*entity.UsageStats, error)
}

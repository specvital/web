package usecase

import (
	"context"
	"time"

	subscriptionentity "github.com/specvital/web/src/backend/modules/subscription/domain/entity"
	"github.com/specvital/web/src/backend/modules/subscription/domain/port"
	usageport "github.com/specvital/web/src/backend/modules/usage/domain/port"
)

type GetCurrentUsageInput struct {
	UserID string
}

type UsageMetricOutput struct {
	Used       int64
	Limit      *int32
	Percentage *float32
}

type PlanInfoOutput struct {
	Tier                 subscriptionentity.PlanTier
	SpecviewMonthlyLimit *int32
	AnalysisMonthlyLimit *int32
	RetentionDays        *int32
}

type GetCurrentUsageOutput struct {
	Specview UsageMetricOutput
	Analysis UsageMetricOutput
	ResetAt  time.Time
	Plan     PlanInfoOutput
}

type GetCurrentUsageUseCase struct {
	subscriptionRepo port.SubscriptionRepository
	usageRepo        usageport.UsageRepository
}

func NewGetCurrentUsageUseCase(
	subscriptionRepo port.SubscriptionRepository,
	usageRepo usageport.UsageRepository,
) *GetCurrentUsageUseCase {
	return &GetCurrentUsageUseCase{
		subscriptionRepo: subscriptionRepo,
		usageRepo:        usageRepo,
	}
}

func (uc *GetCurrentUsageUseCase) Execute(ctx context.Context, input GetCurrentUsageInput) (*GetCurrentUsageOutput, error) {
	subscription, err := uc.subscriptionRepo.GetActiveSubscriptionWithPlan(ctx, input.UserID)
	if err != nil {
		return nil, err
	}

	periodStart := subscription.CurrentPeriodStart
	periodEnd := subscription.CurrentPeriodEnd

	stats, err := uc.usageRepo.GetUsageByPeriod(ctx, input.UserID, periodStart, periodEnd)
	if err != nil {
		return nil, err
	}

	specview := buildUsageMetric(stats.Specview.Used, subscription.Plan.SpecviewMonthlyLimit, subscription.Plan.IsUnlimited())
	analysis := buildUsageMetric(stats.Analysis.Used, subscription.Plan.AnalysisMonthlyLimit, subscription.Plan.IsUnlimited())

	return &GetCurrentUsageOutput{
		Specview: specview,
		Analysis: analysis,
		ResetAt:  periodEnd,
		Plan: PlanInfoOutput{
			Tier:                 subscription.Plan.Tier,
			SpecviewMonthlyLimit: subscription.Plan.SpecviewMonthlyLimit,
			AnalysisMonthlyLimit: subscription.Plan.AnalysisMonthlyLimit,
			RetentionDays:        subscription.Plan.RetentionDays,
		},
	}, nil
}

func buildUsageMetric(used int64, limit *int32, isUnlimited bool) UsageMetricOutput {
	if isUnlimited {
		return UsageMetricOutput{
			Used:       used,
			Limit:      nil,
			Percentage: nil,
		}
	}

	var percentage *float32
	if limit != nil && *limit > 0 {
		pct := float32(used) / float32(*limit) * 100
		if pct > 100 {
			pct = 100
		}
		percentage = &pct
	}

	return UsageMetricOutput{
		Used:       used,
		Limit:      limit,
		Percentage: percentage,
	}
}

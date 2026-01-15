package mapper

import (
	"github.com/specvital/web/src/backend/internal/api"
	"github.com/specvital/web/src/backend/modules/subscription/domain/entity"
)

func ToUserSubscriptionResponse(sub *entity.SubscriptionWithPlan) api.UserSubscriptionResponse {
	return api.UserSubscriptionResponse{
		Plan:               toPlanInfo(&sub.Plan),
		CurrentPeriodStart: sub.CurrentPeriodStart,
		CurrentPeriodEnd:   sub.CurrentPeriodEnd,
	}
}

func toPlanInfo(plan *entity.Plan) api.PlanInfo {
	var specviewLimit, analysisLimit, retentionDays *int

	if plan.SpecviewMonthlyLimit != nil {
		l := int(*plan.SpecviewMonthlyLimit)
		specviewLimit = &l
	}
	if plan.AnalysisMonthlyLimit != nil {
		l := int(*plan.AnalysisMonthlyLimit)
		analysisLimit = &l
	}
	if plan.RetentionDays != nil {
		d := int(*plan.RetentionDays)
		retentionDays = &d
	}

	return api.PlanInfo{
		Tier:                 api.PlanTier(plan.Tier.String()),
		SpecviewMonthlyLimit: specviewLimit,
		AnalysisMonthlyLimit: analysisLimit,
		RetentionDays:        retentionDays,
	}
}

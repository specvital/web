import type { FilteredDocument } from "../hooks/use-document-filter";
import type {
  FlatSpecBehaviorItem,
  FlatSpecDomainItem,
  FlatSpecFeatureItem,
  FlatSpecItem,
} from "../types";

/**
 * Flatten hierarchical FilteredDocument into flat array for window-level virtualization
 */
export const flattenSpecDocument = (
  document: FilteredDocument,
  expandedDomains: Set<string>,
  expandedFeatures: Set<string>,
  hasFilter: boolean
): FlatSpecItem[] => {
  const result: FlatSpecItem[] = [];

  for (const domain of document.domains) {
    const isDomainExpanded = expandedDomains.has(domain.id);

    const domainItem: FlatSpecDomainItem = {
      depth: 0,
      domain,
      domainId: domain.id,
      isExpanded: isDomainExpanded,
      type: "domain-header",
    };
    result.push(domainItem);

    if (!isDomainExpanded) continue;

    for (const feature of domain.features) {
      const isFeatureExpanded = expandedFeatures.has(feature.id);

      const featureItem: FlatSpecFeatureItem = {
        depth: 1,
        domainId: domain.id,
        feature,
        featureId: feature.id,
        isExpanded: isFeatureExpanded,
        type: "feature-header",
      };
      result.push(featureItem);

      if (!isFeatureExpanded) continue;

      const visibleBehaviors = hasFilter
        ? feature.behaviors.filter((b) => b.hasMatch)
        : feature.behaviors;

      for (const behavior of visibleBehaviors) {
        const behaviorItem: FlatSpecBehaviorItem = {
          behavior,
          behaviorId: behavior.id,
          depth: 2,
          domainId: domain.id,
          featureId: feature.id,
          type: "behavior",
        };
        result.push(behaviorItem);
      }
    }
  }

  return result;
};

// Estimated heights per item type (pixels)
export const DOMAIN_HEADER_HEIGHT = 80;
export const FEATURE_HEADER_HEIGHT = 56;
export const BEHAVIOR_ITEM_HEIGHT = 72;

// Gap between items for virtualized layout (must be applied via padding/margin on each item)
export const DOMAIN_GAP = 24; // gap between domain cards (space-y-6 equivalent)
export const FEATURE_GAP = 12; // gap between features (space-y-3 equivalent)
export const BEHAVIOR_GAP = 2; // minimal gap between behaviors (space-y-0.5 equivalent)

/**
 * Returns estimated height for a flat spec item including gap
 * Gap is included in the height estimate and applied via padding on each row
 */
export const getItemHeight = (item: FlatSpecItem): number => {
  switch (item.type) {
    case "domain-header":
      return DOMAIN_HEADER_HEIGHT + DOMAIN_GAP;
    case "feature-header":
      return FEATURE_HEADER_HEIGHT + FEATURE_GAP;
    case "behavior":
      return BEHAVIOR_ITEM_HEIGHT + BEHAVIOR_GAP;
  }
};

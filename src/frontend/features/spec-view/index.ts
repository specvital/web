export {
  BehaviorItem,
  DocumentView,
  DomainSection,
  DomainStatsBadge,
  EmptyDocument,
  ExecutiveSummary,
  FeatureGroup,
  GenerationStatus,
  QuotaConfirmDialog,
  QuotaIndicator,
  TocSidebar,
} from "./components";

export {
  specViewKeys,
  useDocumentFilter,
  useQuotaConfirmDialog,
  useScrollSync,
  useSpecView,
} from "./hooks";

export { calculateDocumentStats, calculateDomainStats, isQuotaExceeded } from "./utils";

export type {
  SpecBehavior,
  SpecDocument,
  SpecDomain,
  SpecFeature,
  SpecGenerationStatusEnum,
  SpecLanguage,
} from "./types";

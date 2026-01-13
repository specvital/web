import type { SpecDocument, SpecDomain } from "../types";
import { calculateDocumentStats, calculateDomainStats } from "../utils/stats";

type DomainStatsBadgeProps =
  | { document: SpecDocument; domain?: never }
  | { document?: never; domain: SpecDomain };

export const DomainStatsBadge = ({ document, domain }: DomainStatsBadgeProps) => {
  if (document) {
    const { behaviorCount, domainCount, featureCount } = calculateDocumentStats(document);

    return (
      <span className="text-muted-foreground">
        {domainCount} domains / {featureCount} features / {behaviorCount} behaviors
      </span>
    );
  }

  if (domain) {
    const { behaviorCount, featureCount } = calculateDomainStats(domain);

    return (
      <span className="text-muted-foreground">
        {featureCount} features / {behaviorCount} behaviors
      </span>
    );
  }

  return null;
};

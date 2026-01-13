"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BehaviorItem } from "./behavior-item";
import type { FilteredFeature } from "../hooks/use-document-filter";

type FeatureGroupProps = {
  defaultOpen?: boolean;
  feature: FilteredFeature;
  hasFilter?: boolean;
  query?: string;
};

export const FeatureGroup = ({
  defaultOpen = true,
  feature,
  hasFilter = false,
  query = "",
}: FeatureGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Filter behaviors to only show matches when filtering
  const visibleBehaviors = hasFilter
    ? feature.behaviors.filter((b) => b.hasMatch)
    : feature.behaviors;

  const behaviorCount = visibleBehaviors.length;
  const totalCount = feature.behaviors.length;

  // Display count: show match/total when filtering
  const displayCount = hasFilter ? `${feature.matchCount}/${totalCount}` : behaviorCount;

  return (
    <div className="border-l-2 border-muted-foreground/20 ml-2" id={`feature-${feature.id}`}>
      <Button
        className={cn(
          "w-full justify-start gap-2 px-3 py-2 h-auto",
          "text-left font-medium hover:bg-muted/50"
        )}
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="flex-1 truncate">{feature.name}</span>
        <Badge className="text-xs" variant="secondary">
          {displayCount}
        </Badge>
      </Button>

      {isOpen && (
        <div className="pl-4 space-y-0.5">
          {feature.description && (
            <p className="px-3 py-1.5 text-sm text-muted-foreground">{feature.description}</p>
          )}
          {visibleBehaviors.map((behavior) => (
            <BehaviorItem behavior={behavior} key={behavior.id} query={query} />
          ))}
        </div>
      )}
    </div>
  );
};

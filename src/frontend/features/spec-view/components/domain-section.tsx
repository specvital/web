"use client";

import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { FeatureGroup } from "./feature-group";
import type { FilteredDomain } from "../hooks/use-document-filter";

type DomainSectionProps = {
  defaultOpen?: boolean;
  domain: FilteredDomain;
  hasFilter?: boolean;
};

const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

const getConfidenceVariant = (confidence: number) => {
  if (confidence >= 0.9)
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  if (confidence >= 0.7)
    return {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
    };
  return {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
  };
};

export const DomainSection = ({
  defaultOpen = true,
  domain,
  hasFilter = false,
}: DomainSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const featureCount = domain.features.length;
  const behaviorCount = domain.features.reduce((sum, f) => sum + f.behaviors.length, 0);

  const displayCount = hasFilter
    ? `${domain.matchCount} / ${behaviorCount}`
    : `${featureCount} features, ${behaviorCount} behaviors`;

  const confidenceVariant =
    domain.classificationConfidence !== undefined
      ? getConfidenceVariant(domain.classificationConfidence)
      : null;

  return (
    <Card
      aria-labelledby={`domain-title-${domain.id}`}
      className="overflow-hidden border-border/60"
      id={`domain-${domain.id}`}
      role="region"
      tabIndex={-1}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button
            aria-controls={isOpen ? `domain-content-${domain.id}` : undefined}
            aria-expanded={isOpen}
            className="flex-1 justify-start gap-3 px-0 h-auto hover:bg-transparent group min-w-0"
            onClick={() => setIsOpen(!isOpen)}
            variant="ghost"
          >
            {isOpen ? (
              <ChevronDown
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0 text-muted-foreground"
              />
            ) : (
              <ChevronRight
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0 text-muted-foreground"
              />
            )}

            {/* Icon with subtle background */}
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 flex-shrink-0">
              <Layers aria-hidden="true" className="h-4 w-4 text-primary" />
            </span>

            <CardTitle
              className="text-lg font-semibold tracking-tight truncate"
              id={`domain-title-${domain.id}`}
            >
              {domain.name}
            </CardTitle>
          </Button>

          {/* Metadata badges */}
          <div className="flex items-center gap-2 flex-wrap ml-[3.25rem] sm:ml-0 sm:flex-shrink-0">
            {confidenceVariant && domain.classificationConfidence !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      confidenceVariant.bg,
                      confidenceVariant.text,
                      confidenceVariant.border
                    )}
                    variant="outline"
                  >
                    {formatConfidence(domain.classificationConfidence)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>AI classification confidence</TooltipContent>
              </Tooltip>
            )}
            <Badge
              className="text-xs font-medium text-muted-foreground bg-muted/60"
              variant="secondary"
            >
              {displayCount}
            </Badge>
          </div>
        </div>

        {domain.description && (
          <p className="text-sm text-muted-foreground mt-2 ml-0 sm:ml-[3.75rem] leading-relaxed">
            {domain.description}
          </p>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-2 pb-4 space-y-3" id={`domain-content-${domain.id}`}>
          {domain.features.map((feature) => (
            <FeatureGroup feature={feature} hasFilter={hasFilter} key={feature.id} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

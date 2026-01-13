"use client";

import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { SpecDomain } from "../types";
import { FeatureGroup } from "./feature-group";

type DomainSectionProps = {
  defaultOpen?: boolean;
  domain: SpecDomain;
};

const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return "bg-green-500/10 text-green-700 border-green-500/30";
  if (confidence >= 0.7) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
  return "bg-red-500/10 text-red-700 border-red-500/30";
};

export const DomainSection = ({ defaultOpen = true, domain }: DomainSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const featureCount = domain.features.length;
  const behaviorCount = domain.features.reduce((sum, f) => sum + f.behaviors.length, 0);

  return (
    <Card className="overflow-hidden" id={`domain-${domain.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            className="flex-1 justify-start gap-3 px-0 h-auto hover:bg-transparent"
            onClick={() => setIsOpen(!isOpen)}
            variant="ghost"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            )}
            <Layers className="h-5 w-5 flex-shrink-0 text-primary" />
            <CardTitle className="text-lg">{domain.name}</CardTitle>
          </Button>

          <div className="flex items-center gap-2">
            {domain.classificationConfidence !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn("text-xs", getConfidenceColor(domain.classificationConfidence))}
                    variant="outline"
                  >
                    {formatConfidence(domain.classificationConfidence)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>AI classification confidence</TooltipContent>
              </Tooltip>
            )}
            <Badge variant="secondary">
              {featureCount} features / {behaviorCount} behaviors
            </Badge>
          </div>
        </div>

        {domain.description && (
          <p className="text-sm text-muted-foreground mt-2 ml-12">{domain.description}</p>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-3">
          {domain.features.map((feature) => (
            <FeatureGroup feature={feature} key={feature.id} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SpecFeature } from "../types";
import { BehaviorItem } from "./behavior-item";

type FeatureGroupProps = {
  defaultOpen?: boolean;
  feature: SpecFeature;
};

export const FeatureGroup = ({ defaultOpen = true, feature }: FeatureGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const behaviorCount = feature.behaviors.length;

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
          {behaviorCount}
        </Badge>
      </Button>

      {isOpen && (
        <div className="pl-4 space-y-0.5">
          {feature.description && (
            <p className="px-3 py-1.5 text-sm text-muted-foreground">{feature.description}</p>
          )}
          {feature.behaviors.map((behavior) => (
            <BehaviorItem behavior={behavior} key={behavior.id} />
          ))}
        </div>
      )}
    </div>
  );
};

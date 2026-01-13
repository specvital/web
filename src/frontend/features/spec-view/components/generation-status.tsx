"use client";

import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import type { SpecGenerationStatusEnum } from "../types";

type GenerationStatusProps = {
  errorMessage?: string;
  onRetry?: () => void;
  status: SpecGenerationStatusEnum;
};

const STATUS_CONFIG: Record<
  SpecGenerationStatusEnum,
  {
    description: string;
    icon: typeof Loader2;
    isAnimated: boolean;
    title: string;
    variant: "default" | "destructive";
  }
> = {
  completed: {
    description: "The specification document has been successfully generated.",
    icon: CheckCircle2,
    isAnimated: false,
    title: "Generation Complete",
    variant: "default",
  },
  failed: {
    description: "An error occurred while generating the specification document.",
    icon: AlertCircle,
    isAnimated: false,
    title: "Generation Failed",
    variant: "destructive",
  },
  not_found: {
    description: "No specification document exists for this analysis.",
    icon: AlertCircle,
    isAnimated: false,
    title: "Document Not Found",
    variant: "default",
  },
  pending: {
    description: "Your request is queued and will start processing soon.",
    icon: Clock,
    isAnimated: false,
    title: "Queued",
    variant: "default",
  },
  running: {
    description: "AI is analyzing your test cases and generating the specification document.",
    icon: Loader2,
    isAnimated: true,
    title: "Generating...",
    variant: "default",
  },
};

export const GenerationStatus = ({ errorMessage, onRetry, status }: GenerationStatusProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant}>
      <Icon className={config.isAnimated ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{errorMessage || config.description}</span>
        {status === "failed" && onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            Retry Generation
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

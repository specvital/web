"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { useGenerationProgress } from "../hooks/use-generation-progress";
import type { SpecGenerationStatusEnum } from "../types";

/**
 * Calculate the current phase based on status and elapsed time
 */
type PhaseInfo = {
  currentPhase: number;
  description: string;
  estimatedProgress: number;
  title: string;
  totalPhases: number;
};

const calculatePhase = (
  status: SpecGenerationStatusEnum | null,
  pollingStartTime: number | null
): PhaseInfo => {
  if (!status || status === "not_found") {
    return {
      currentPhase: 0,
      description: "",
      estimatedProgress: 0,
      title: "",
      totalPhases: 4,
    };
  }

  if (status === "completed") {
    return {
      currentPhase: 4,
      description: "The specification document has been generated.",
      estimatedProgress: 100,
      title: "Complete",
      totalPhases: 4,
    };
  }

  if (status === "failed") {
    return {
      currentPhase: 0,
      description: "An error occurred during generation.",
      estimatedProgress: 0,
      title: "Failed",
      totalPhases: 4,
    };
  }

  if (status === "pending") {
    return {
      currentPhase: 1,
      description: "Your request is queued and will start soon.",
      estimatedProgress: 10,
      title: "Queued",
      totalPhases: 4,
    };
  }

  // status === "running"
  const elapsedMs = pollingStartTime ? Date.now() - pollingStartTime : 0;
  const elapsedSeconds = elapsedMs / 1000;

  if (elapsedSeconds < 30) {
    // Phase 2: Analyzing (0-30s)
    const progress = 10 + (elapsedSeconds / 30) * 30; // 10% -> 40%
    return {
      currentPhase: 2,
      description: "Analyzing test cases and repository structure...",
      estimatedProgress: Math.min(progress, 40),
      title: "Analyzing",
      totalPhases: 4,
    };
  } else if (elapsedSeconds < 120) {
    // Phase 3: Generating (30s-2m)
    const phaseProgress = (elapsedSeconds - 30) / 90; // 0 -> 1 over 90s
    const progress = 40 + phaseProgress * 40; // 40% -> 80%
    return {
      currentPhase: 3,
      description: "AI is generating specification documentation...",
      estimatedProgress: Math.min(progress, 80),
      title: "Generating",
      totalPhases: 4,
    };
  } else {
    // Phase 4: Finalizing (2m+)
    const phaseProgress = Math.min((elapsedSeconds - 120) / 180, 1); // 0 -> 1 over 3m
    const progress = 80 + phaseProgress * 15; // 80% -> 95% (never 100% until complete)
    return {
      currentPhase: 4,
      description: "Finalizing and formatting the document...",
      estimatedProgress: Math.min(progress, 95),
      title: "Finalizing",
      totalPhases: 4,
    };
  }
};

type PhaseStep = {
  description: string;
  phase: number;
  title: string;
};

const PHASE_STEPS: PhaseStep[] = [
  { description: "queuedDescription", phase: 1, title: "queued" },
  { description: "analyzingDescription", phase: 2, title: "analyzing" },
  { description: "generatingDescription", phase: 3, title: "generating" },
  { description: "finalizingDescription", phase: 4, title: "finalizing" },
];

type StepIndicatorProps = {
  currentPhase: number;
  step: PhaseStep;
  t: ReturnType<typeof useTranslations>;
};

const StepIndicator = ({ currentPhase, step, t }: StepIndicatorProps) => {
  const isCompleted = currentPhase > step.phase;
  const isCurrent = currentPhase === step.phase;
  const isPending = currentPhase < step.phase;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {isCompleted ? (
          <Check className="h-5 w-5 text-primary" />
        ) : isCurrent ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex flex-col">
        <span
          className={cn(
            "text-sm font-medium",
            isCompleted && "text-primary",
            isCurrent && "text-foreground",
            isPending && "text-muted-foreground/50"
          )}
        >
          {t(`steps.${step.title}`)}
        </span>
        {isCurrent && (
          <span className="text-xs text-muted-foreground">{t(`steps.${step.description}`)}</span>
        )}
      </div>
    </div>
  );
};

type GenerationProgressContentProps = {
  onContinueBrowsing: () => void;
  onRetry?: () => void;
  phaseInfo: PhaseInfo;
  status: SpecGenerationStatusEnum | null;
};

const GenerationProgressContent = ({
  onContinueBrowsing,
  onRetry,
  phaseInfo,
  status,
}: GenerationProgressContentProps) => {
  const t = useTranslations("specView.generationProgress");
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress((prev) => {
        const target = phaseInfo.estimatedProgress;
        if (prev < target) {
          return Math.min(prev + 0.5, target);
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [phaseInfo.estimatedProgress]);

  const isFailed = status === "failed";
  const isCompleted = status === "completed";

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Icon */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          isFailed ? "bg-destructive/10" : isCompleted ? "bg-primary/10" : "bg-primary/10"
        )}
      >
        {isFailed ? (
          <AlertCircle className="h-8 w-8 text-destructive" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-8 w-8 text-primary" />
        ) : (
          <div className="relative">
            <FileText className="h-8 w-8 text-primary" />
            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {isFailed ? t("failed.title") : isCompleted ? t("completed.title") : t("title")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFailed
            ? t("failed.description")
            : isCompleted
              ? t("completed.description")
              : t("description")}
        </p>
      </div>

      {/* Progress Bar (only when generating) */}
      {!isFailed && !isCompleted && (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("phase", { current: phaseInfo.currentPhase, total: phaseInfo.totalPhases })}
            </span>
            <span className="font-medium">{Math.round(animatedProgress)}%</span>
          </div>
          <Progress className="h-2" value={animatedProgress} />
          <p className="text-center text-sm text-muted-foreground">{t("estimatedTime")}</p>
        </div>
      )}

      {/* Phase Steps (only when generating) */}
      {!isFailed && !isCompleted && (
        <div className="w-full space-y-3 rounded-lg border bg-muted/30 p-4">
          {PHASE_STEPS.map((step) => (
            <StepIndicator
              currentPhase={phaseInfo.currentPhase}
              key={step.phase}
              step={step}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full flex-col gap-2">
        {isFailed && onRetry && (
          <Button className="w-full" onClick={onRetry} variant="default">
            {t("retryButton")}
          </Button>
        )}
        {!isCompleted && (
          <Button className="w-full" onClick={onContinueBrowsing} variant="outline">
            {t("continueBrowsing")}
          </Button>
        )}
        {isCompleted && (
          <Button className="w-full" onClick={onContinueBrowsing} variant="default">
            {t("viewDocument")}
          </Button>
        )}
      </div>

      {/* Tip */}
      {!isFailed && !isCompleted && (
        <p className="text-center text-xs text-muted-foreground">{t("tip")}</p>
      )}
    </div>
  );
};

export const GenerationProgressModal = () => {
  const { close, isOpen, pollingStartTime, status, switchToBackground } = useGenerationProgress();
  const [phaseInfo, setPhaseInfo] = useState<PhaseInfo>(() =>
    calculatePhase(status, pollingStartTime)
  );

  // Update phase info when status changes (especially for completed/failed)
  useEffect(() => {
    setPhaseInfo(calculatePhase(status, pollingStartTime));
  }, [status, pollingStartTime]);

  // Update phase info periodically for time-based progress (only when generating)
  useEffect(() => {
    if (!isOpen || status === "completed" || status === "failed" || status === "not_found") {
      return;
    }

    // Update every second for smooth progress
    const timer = setInterval(() => {
      setPhaseInfo(calculatePhase(status, pollingStartTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, status, pollingStartTime]);

  const handleContinueBrowsing = () => {
    if (status === "completed") {
      close();
    } else {
      switchToBackground();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // When closing modal, switch to background instead of fully closing
      if (status === "pending" || status === "running") {
        switchToBackground();
      } else {
        close();
      }
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Generation Progress</DialogTitle>
          <DialogDescription>Track the progress of your spec document generation</DialogDescription>
        </DialogHeader>
        <GenerationProgressContent
          onContinueBrowsing={handleContinueBrowsing}
          phaseInfo={phaseInfo}
          status={status}
        />
      </DialogContent>
    </Dialog>
  );
};

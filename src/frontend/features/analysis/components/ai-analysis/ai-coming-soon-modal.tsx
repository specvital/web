"use client";

import { Check, ExternalLink, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AIComingSoonModalProps = {
  onClose: () => void;
  open: boolean;
};

const GITHUB_REPO_URL = "https://github.com/specvital";

export const AIComingSoonModal = ({ onClose, open }: AIComingSoonModalProps) => {
  const t = useTranslations("analyze.aiAnalysis.modal");

  const features = [t("feature1"), t("feature2"), t("feature3"), t("feature4")];

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
            <Sparkles
              className={cn("h-8 w-8 text-violet-600 dark:text-violet-400", "animate-pulse")}
            />
          </div>
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-base">{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">{t("description")}</p>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            {features.map((feature, index) => (
              <div className="flex items-start gap-2" key={index}>
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">{t("cta")}</p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full" variant="outline">
            <a href={GITHUB_REPO_URL} rel="noopener noreferrer" target="_blank">
              {t("starOnGitHub")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button className="w-full" onClick={onClose} variant="ghost">
            {t("dismiss")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

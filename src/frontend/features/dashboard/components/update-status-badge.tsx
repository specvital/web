import { CheckCircle2, CircleDashed, GitCommit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { UpdateStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type UpdateStatusBadgeProps = {
  status: UpdateStatus;
};

const STATUS_CONFIG = {
  "new-commits": {
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Icon: GitCommit,
    label: "New commits available",
  },
  unknown: {
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    Icon: CircleDashed,
    label: "Status unknown",
  },
  "up-to-date": {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Icon: CheckCircle2,
    label: "Up to date",
  },
} as const;

export const UpdateStatusBadge = ({ status }: UpdateStatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  const { className, Icon, label } = config;

  return (
    <Badge className={cn("gap-1", className)} variant="outline">
      <Icon aria-hidden="true" className="size-3" />
      <span className="sr-only">{label}</span>
    </Badge>
  );
};

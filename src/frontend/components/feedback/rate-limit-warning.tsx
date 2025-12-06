import type { RateLimitInfo } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

type RateLimitWarningProps = {
  rateLimit: RateLimitInfo;
};

const formatResetTime = (resetAt: number): string => {
  const resetDate = new Date(resetAt * 1000);
  const now = new Date();
  const diffMinutes = Math.ceil((resetDate.getTime() - now.getTime()) / 60000);

  if (diffMinutes <= 0) {
    return "now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
};

const getWarningLevel = (remaining: number, limit: number): "critical" | "warning" | "info" => {
  const percentage = (remaining / limit) * 100;

  if (percentage <= 10) {
    return "critical";
  }
  if (percentage <= 25) {
    return "warning";
  }
  return "info";
};

export const RateLimitWarning = ({ rateLimit }: RateLimitWarningProps) => {
  const { limit, remaining, resetAt } = rateLimit;

  if (limit === 0) {
    return null;
  }

  const warningLevel = getWarningLevel(remaining, limit);

  if (warningLevel === "info" && remaining > limit * 0.5) {
    return null;
  }

  const bgColor = {
    critical: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
  }[warningLevel];

  const textColor = {
    critical: "text-red-900 dark:text-red-100",
    info: "text-blue-900 dark:text-blue-100",
    warning: "text-yellow-900 dark:text-yellow-100",
  }[warningLevel];

  const iconColor = {
    critical: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
  }[warningLevel];

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
        <div className={`flex-1 space-y-1 text-sm ${textColor}`}>
          <p className="font-medium">
            GitHub API Rate Limit: {remaining} / {limit} requests remaining
          </p>
          <p className="text-xs opacity-90">
            Rate limit resets in {formatResetTime(resetAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

import type { Framework } from "@/lib/api";
import { cn } from "@/lib/utils";

type FrameworkBadgeProps = {
  framework: Framework;
};

const COLOR_PALETTE = [
  "bg-red-100 text-red-800",
  "bg-orange-100 text-orange-800",
  "bg-amber-100 text-amber-800",
  "bg-yellow-100 text-yellow-800",
  "bg-lime-100 text-lime-800",
  "bg-green-100 text-green-800",
  "bg-emerald-100 text-emerald-800",
  "bg-teal-100 text-teal-800",
  "bg-cyan-100 text-cyan-800",
  "bg-sky-100 text-sky-800",
  "bg-blue-100 text-blue-800",
  "bg-indigo-100 text-indigo-800",
  "bg-violet-100 text-violet-800",
  "bg-purple-100 text-purple-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-pink-100 text-pink-800",
  "bg-rose-100 text-rose-800",
  "bg-slate-100 text-slate-800",
  "bg-zinc-100 text-zinc-800",
  "bg-stone-100 text-stone-800",
];

const hashToIndex = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0) % COLOR_PALETTE.length;
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const FrameworkBadge = ({ framework }: FrameworkBadgeProps) => {
  const colorIndex = hashToIndex(framework.toLowerCase());
  const colorClasses = COLOR_PALETTE[colorIndex];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses
      )}
    >
      {capitalize(framework)}
    </span>
  );
};

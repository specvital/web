export const formatNumber = (value: number | null | undefined, unlimitedSymbol = "∞"): string => {
  if (value === null || value === undefined) return unlimitedSymbol;
  return value.toLocaleString();
};

export const formatResetDate = (resetAt: string, locale: string): string => {
  const resetDate = new Date(resetAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateStr = resetDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });

  return `${diffDays} (${dateStr})`;
};

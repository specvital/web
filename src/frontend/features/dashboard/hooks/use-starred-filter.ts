"use client";

import { parseAsBoolean, useQueryState } from "nuqs";

const starredParser = parseAsBoolean.withDefault(false);

export const useStarredFilter = () => {
  const [isStarredOnly, setIsStarredOnly] = useQueryState("starred", starredParser);

  const toggleStarredFilter = () => {
    setIsStarredOnly((prev) => !prev);
  };

  return { isStarredOnly, setIsStarredOnly, toggleStarredFilter } as const;
};

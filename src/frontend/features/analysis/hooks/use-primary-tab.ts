"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";

import { DEFAULT_PRIMARY_TAB, PRIMARY_TABS } from "../types/primary-tab";

const primaryTabParser = parseAsStringLiteral(PRIMARY_TABS).withDefault(DEFAULT_PRIMARY_TAB);

export const usePrimaryTab = () => {
  const [tab, setTab] = useQueryState("tab", primaryTabParser);
  const [viewParam, setViewParam] = useQueryState("view");

  // URL backward compatibility: migrate ?view=document to ?tab=spec
  useEffect(() => {
    if (viewParam === "document") {
      setTab("spec");
      setViewParam(null);
    }
  }, [viewParam, setTab, setViewParam]);

  return { setTab, tab } as const;
};

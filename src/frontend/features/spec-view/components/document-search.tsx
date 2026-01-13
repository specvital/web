"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { HighlightedText } from "./highlighted-text";
import type { FilteredBehavior, FilteredDocument } from "../hooks/use-document-filter";

type DocumentSearchProps = {
  filteredDocument: FilteredDocument | null;
  onQueryChange: (query: string) => void;
  query: string;
};

export const DocumentSearch = ({ filteredDocument, onQueryChange, query }: DocumentSearchProps) => {
  const t = useTranslations("specView.search");
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSelect = useCallback((behaviorId: string) => {
    const element = document.getElementById(`behavior-${behaviorId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setIsOpen(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open && inputValue !== query) {
        onQueryChange(inputValue);
      }
    },
    [inputValue, query, onQueryChange]
  );

  const matchingBehaviors = useMemo(() => {
    if (!filteredDocument || !inputValue) return [];

    const results: Array<{
      behavior: FilteredBehavior;
      domainName: string;
      featureName: string;
    }> = [];

    for (const domain of filteredDocument.domains) {
      for (const feature of domain.features) {
        for (const behavior of feature.behaviors) {
          if (behavior.hasMatch) {
            results.push({
              behavior,
              domainName: domain.name,
              featureName: feature.name,
            });
          }
        }
      }
    }

    return results;
  }, [filteredDocument, inputValue]);

  return (
    <>
      <button
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm",
          "border rounded-md bg-background",
          "text-muted-foreground hover:text-foreground hover:border-primary/50",
          "transition-colors cursor-pointer w-full sm:w-64"
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="flex-1 text-left truncate">{query || t("placeholder")}</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        description={t("dialogDescription")}
        onOpenChange={handleOpenChange}
        open={isOpen}
        showCloseButton={false}
        title={t("dialogTitle")}
      >
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={handleInputChange}
            placeholder={t("placeholder")}
            ref={inputRef}
            value={inputValue}
          />
          <CommandList>
            {inputValue && matchingBehaviors.length === 0 && (
              <CommandEmpty>{t("noResults")}</CommandEmpty>
            )}
            {matchingBehaviors.length > 0 && (
              <CommandGroup heading={t("resultsHeading", { count: matchingBehaviors.length })}>
                {matchingBehaviors.slice(0, 20).map(({ behavior, domainName, featureName }) => (
                  <CommandItem
                    key={behavior.id}
                    onSelect={() => handleSelect(behavior.id)}
                    value={behavior.id}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm truncate">
                        <HighlightedText
                          ranges={behavior.highlightRanges}
                          text={behavior.convertedDescription}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {domainName} / {featureName}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

"use client";

import { useTranslations } from "next-intl";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { AnalyzeDialog } from "@/features/home";

import { useGlobalSearchStore, useStaticActions } from "../hooks";
import { SearchKeyboardHints } from "./search-keyboard-hints";

export const GlobalSearchDialog = () => {
  const { close, isOpen } = useGlobalSearchStore();
  const t = useTranslations("globalSearch");
  const { analyzeDialogOpen, commandItems, navigationItems, setAnalyzeDialogOpen } =
    useStaticActions();

  return (
    <>
      <CommandDialog
        description={t("description")}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        open={isOpen}
        showCloseButton={false}
        title={t("title")}
      >
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>

          {navigationItems.length > 0 && (
            <CommandGroup heading={t("categories.navigation")}>
              {navigationItems.map((item) => (
                <CommandItem key={item.id} onSelect={item.onSelect}>
                  {item.icon && <item.icon className="mr-2 size-4" />}
                  <span>{item.label}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {commandItems.length > 0 && (
            <CommandGroup heading={t("categories.commands")}>
              {commandItems.map((item) => (
                <CommandItem key={item.id} onSelect={item.onSelect}>
                  {item.icon && <item.icon className="mr-2 size-4" />}
                  <span>{item.label}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        <SearchKeyboardHints />
      </CommandDialog>

      <AnalyzeDialog
        onOpenChange={setAnalyzeDialogOpen}
        open={analyzeDialogOpen}
        variant="header"
      />
    </>
  );
};

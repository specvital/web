"use client";

import { useTranslations } from "next-intl";

import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";

import { useGlobalSearchStore } from "../hooks/use-global-search-store";

export const GlobalSearchDialog = () => {
  const { close, isOpen } = useGlobalSearchStore();
  const t = useTranslations("globalSearch");

  return (
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
      </CommandList>
    </CommandDialog>
  );
};

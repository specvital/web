"use client";

import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FilterEmptyStateProps = {
  description?: string;
  onClearFilters: () => void;
  title?: string;
};

export const FilterEmptyState = ({ description, onClearFilters, title }: FilterEmptyStateProps) => {
  const t = useTranslations("specView.filter");

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
        )}
        <Button onClick={onClearFilters} variant="outline">
          {t("clearFilters")}
        </Button>
      </CardContent>
    </Card>
  );
};

export type SearchCategory = "recent" | "repositories" | "bookmarks" | "community" | "actions";

export type SearchableItem = {
  category: SearchCategory;
  icon?: string;
  id: string;
  label: string;
  metadata?: Record<string, unknown>;
  onSelect: () => void;
  shortcut?: string;
};

export type GlobalSearchState = {
  isOpen: boolean;
};

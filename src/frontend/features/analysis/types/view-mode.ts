export const VIEW_MODES = ["list", "tree"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export const DEFAULT_VIEW_MODE: ViewMode = "list";

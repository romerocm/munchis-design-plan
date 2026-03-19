import type { RecipeStatus } from "@/types/database";

/** All valid recipe statuses, in lifecycle order */
export const RECIPE_STATUSES = ["draft", "testing", "active", "archived"] as const;

/** Valid transitions for recipes (archive is always available separately) */
export const RECIPE_TRANSITIONS: Record<RecipeStatus, RecipeStatus[]> = {
  idea: ["draft"],           // legacy: auto-migrate to draft
  draft: ["testing", "active"],
  testing: ["active", "draft"],
  active: ["testing", "draft"],
  archived: ["draft"],
};

/** Friendly labels for transition actions */
export const RECIPE_TRANSITION_LABELS: Record<string, Record<string, string>> = {
  idea: { draft: "Start building" },
  draft: { testing: "Move to testing", active: "Promote to Signature" },
  testing: { active: "Promote to Signature", draft: "Back to draft" },
  active: { testing: "Move back to testing", draft: "Demote to draft" },
  archived: { draft: "Restore as draft" },
};

/** Human-readable labels for recipe statuses */
export const RECIPE_STATUS_LABELS: Record<RecipeStatus, string> = {
  idea: "Draft",             // legacy: display as Draft
  draft: "Draft",
  testing: "Testing",
  active: "Signature",
  archived: "Archived",
};

/** Tailwind classes for recipe status badges */
export const RECIPE_STATUS_COLORS: Record<RecipeStatus, string> = {
  idea: "bg-amber-100 text-amber-700",  // legacy: same as draft
  draft: "bg-amber-100 text-amber-700",
  testing: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-gray-200 text-gray-500",
};

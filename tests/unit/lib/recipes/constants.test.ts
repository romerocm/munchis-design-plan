import { describe, it, expect } from "vitest";
import {
  RECIPE_STATUSES,
  RECIPE_TRANSITIONS,
  RECIPE_STATUS_LABELS,
  RECIPE_STATUS_COLORS,
  RECIPE_TRANSITION_LABELS,
} from "@/lib/recipes/constants";

describe("RECIPE_STATUSES", () => {
  it("contains 4 display statuses", () => {
    expect(RECIPE_STATUSES).toEqual(["draft", "testing", "active", "archived"]);
  });
});

describe("RECIPE_TRANSITIONS", () => {
  it("covers all 5 statuses including legacy 'idea'", () => {
    expect(RECIPE_TRANSITIONS).toHaveProperty("idea");
    expect(RECIPE_TRANSITIONS).toHaveProperty("draft");
    expect(RECIPE_TRANSITIONS).toHaveProperty("testing");
    expect(RECIPE_TRANSITIONS).toHaveProperty("active");
    expect(RECIPE_TRANSITIONS).toHaveProperty("archived");
  });

  it("idea -> draft only (legacy migration)", () => {
    expect(RECIPE_TRANSITIONS.idea).toEqual(["draft"]);
  });

  it("draft -> testing or active", () => {
    expect(RECIPE_TRANSITIONS.draft).toContain("testing");
    expect(RECIPE_TRANSITIONS.draft).toContain("active");
    expect(RECIPE_TRANSITIONS.draft).toHaveLength(2);
  });

  it("testing -> active or draft", () => {
    expect(RECIPE_TRANSITIONS.testing).toContain("active");
    expect(RECIPE_TRANSITIONS.testing).toContain("draft");
    expect(RECIPE_TRANSITIONS.testing).toHaveLength(2);
  });

  it("active -> testing or draft", () => {
    expect(RECIPE_TRANSITIONS.active).toContain("testing");
    expect(RECIPE_TRANSITIONS.active).toContain("draft");
    expect(RECIPE_TRANSITIONS.active).toHaveLength(2);
  });

  it("archived -> draft (restore)", () => {
    expect(RECIPE_TRANSITIONS.archived).toEqual(["draft"]);
  });
});

describe("RECIPE_STATUS_LABELS", () => {
  it("has a label for every status including legacy 'idea'", () => {
    expect(RECIPE_STATUS_LABELS.idea).toBe("Draft");
    expect(RECIPE_STATUS_LABELS.draft).toBe("Draft");
    expect(RECIPE_STATUS_LABELS.testing).toBe("Testing");
    expect(RECIPE_STATUS_LABELS.active).toBe("Signature");
    expect(RECIPE_STATUS_LABELS.archived).toBe("Archived");
  });

  it("idea label matches draft label (legacy display)", () => {
    expect(RECIPE_STATUS_LABELS.idea).toBe(RECIPE_STATUS_LABELS.draft);
  });
});

describe("RECIPE_STATUS_COLORS", () => {
  it("has a color for every status including legacy 'idea'", () => {
    expect(RECIPE_STATUS_COLORS.idea).toBeDefined();
    expect(RECIPE_STATUS_COLORS.draft).toBeDefined();
    expect(RECIPE_STATUS_COLORS.testing).toBeDefined();
    expect(RECIPE_STATUS_COLORS.active).toBeDefined();
    expect(RECIPE_STATUS_COLORS.archived).toBeDefined();
  });
});

describe("RECIPE_TRANSITION_LABELS", () => {
  it("has labels for each status transition", () => {
    expect(RECIPE_TRANSITION_LABELS.idea.draft).toBe("Start building");
    expect(RECIPE_TRANSITION_LABELS.draft.testing).toBe("Move to testing");
    expect(RECIPE_TRANSITION_LABELS.draft.active).toBe("Promote to Signature");
    expect(RECIPE_TRANSITION_LABELS.archived.draft).toBe("Restore as draft");
  });
});

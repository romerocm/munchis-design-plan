import { describe, it, expect } from "vitest";
import { formatCents, getInitials } from "@/lib/format";

describe("formatCents", () => {
  it("formats cents to dollars with 2 decimals by default", () => {
    expect(formatCents(370)).toBe("$3.70");
    expect(formatCents(1000)).toBe("$10.00");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(99)).toBe("$0.99");
  });

  it("formats cents with 0 decimals when specified", () => {
    expect(formatCents(6700, 0)).toBe("$67");
    expect(formatCents(370, 0)).toBe("$4"); // rounds up
    expect(formatCents(0, 0)).toBe("$0");
  });
});

describe("getInitials", () => {
  it("extracts 2-letter initials from a full name", () => {
    expect(getInitials("Maria Alejandra")).toBe("MA");
    expect(getInitials("Carlos Rivas")).toBe("CR");
  });

  it("handles single names", () => {
    expect(getInitials("Heidi")).toBe("H");
  });

  it("handles names with 3+ parts", () => {
    expect(getInitials("Juan Carlos Mendez Rivera")).toBe("JC");
  });

  it("handles empty string without crashing", () => {
    expect(getInitials("")).toBe("");
  });
});

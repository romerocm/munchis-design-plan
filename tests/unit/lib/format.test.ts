import { describe, it, expect } from "vitest";
import { formatCents, getInitials, parseLocalDate, formatDay, formatDayOffset, utcToCST, cstToUTC } from "@/lib/format";

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

describe("parseLocalDate", () => {
  it("parses date-only string without timezone shift", () => {
    const d = parseLocalDate("2026-03-22");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March = 2
    expect(d.getDate()).toBe(22);
  });

  it("extracts date part from ISO datetime string", () => {
    const d = parseLocalDate("2026-03-22T23:59:00.000Z");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(22);
  });

  it("handles single-digit months and days", () => {
    const d = parseLocalDate("2026-01-05");
    expect(d.getMonth()).toBe(0); // January = 0
    expect(d.getDate()).toBe(5);
  });
});

describe("formatDay", () => {
  it("returns correct weekday for known dates", () => {
    // 2026-03-22 is a Sunday
    expect(formatDay("2026-03-22")).toBe("Sunday");
    // 2026-03-23 is a Monday
    expect(formatDay("2026-03-23")).toBe("Monday");
    // 2026-03-18 is a Wednesday
    expect(formatDay("2026-03-18")).toBe("Wednesday");
  });

  it("works with ISO datetime strings", () => {
    expect(formatDay("2026-03-22T14:00:00.000Z")).toBe("Sunday");
  });
});

describe("formatDayOffset", () => {
  it("shifts forward by N days", () => {
    // 2026-03-22 (Sunday) + 1 = Monday
    expect(formatDayOffset("2026-03-22", 1)).toBe("Monday");
    // + 6 = Saturday
    expect(formatDayOffset("2026-03-22", 6)).toBe("Saturday");
  });

  it("shifts backward by negative N days", () => {
    // 2026-03-22 (Sunday) - 1 = Saturday
    expect(formatDayOffset("2026-03-22", -1)).toBe("Saturday");
  });

  it("handles month boundary crossings", () => {
    // 2026-03-31 (Tuesday) + 1 = April 1 (Wednesday)
    expect(formatDayOffset("2026-03-31", 1)).toBe("Wednesday");
  });
});

describe("utcToCST", () => {
  it("converts UTC to CST (UTC-6)", () => {
    // 2026-03-20T05:59:00.000Z → CST: 2026-03-19 23:59
    const result = utcToCST("2026-03-20T05:59:00.000Z");
    expect(result.date).toBe("2026-03-19");
    expect(result.time).toBe("23:59");
  });

  it("handles same-day conversion", () => {
    // 2026-03-20T18:00:00.000Z → CST: 2026-03-20 12:00
    const result = utcToCST("2026-03-20T18:00:00.000Z");
    expect(result.date).toBe("2026-03-20");
    expect(result.time).toBe("12:00");
  });

  it("handles midnight UTC → previous day CST", () => {
    // 2026-03-20T00:00:00.000Z → CST: 2026-03-19 18:00
    const result = utcToCST("2026-03-20T00:00:00.000Z");
    expect(result.date).toBe("2026-03-19");
    expect(result.time).toBe("18:00");
  });
});

describe("cstToUTC", () => {
  it("converts CST to UTC (adds 6 hours)", () => {
    const result = cstToUTC("2026-03-19", "23:59");
    expect(result).toBe("2026-03-20T05:59:00.000Z");
  });

  it("handles morning times", () => {
    const result = cstToUTC("2026-03-20", "08:00");
    expect(result).toBe("2026-03-20T14:00:00.000Z");
  });

  it("handles midnight CST", () => {
    const result = cstToUTC("2026-03-20", "00:00");
    expect(result).toBe("2026-03-20T06:00:00.000Z");
  });
});

describe("utcToCST / cstToUTC round-trip", () => {
  it("round-trips correctly", () => {
    const originalDate = "2026-03-19";
    const originalTime = "14:30";

    const utcIso = cstToUTC(originalDate, originalTime);
    const { date, time } = utcToCST(utcIso);

    expect(date).toBe(originalDate);
    expect(time).toBe(originalTime);
  });

  it("round-trips midnight correctly", () => {
    const utcIso = cstToUTC("2026-03-20", "00:00");
    const { date, time } = utcToCST(utcIso);
    expect(date).toBe("2026-03-20");
    expect(time).toBe("00:00");
  });

  it("round-trips late night correctly", () => {
    const utcIso = cstToUTC("2026-03-19", "23:59");
    const { date, time } = utcToCST(utcIso);
    expect(date).toBe("2026-03-19");
    expect(time).toBe("23:59");
  });
});

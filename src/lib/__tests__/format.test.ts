import {
  dayKey,
  defaultSet,
  epley,
  formatSet,
  fmtDuration,
  initials,
  rollingDays,
  slugify,
  startOfDay,
} from "../format";

describe("slugify", () => {
  it("lowercases and hyphenates exercise names", () => {
    expect(slugify("Romanian Deadlift")).toBe("romanian-deadlift");
    expect(slugify("Bench Press")).toBe("bench-press");
  });

  it("trims, strips punctuation, and collapses separators", () => {
    expect(slugify("  Bench!! Press  ")).toBe("bench-press");
    expect(slugify("dead_lift")).toBe("dead-lift");
    expect(slugify("---Squat---")).toBe("squat");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});

describe("epley", () => {
  it("returns weight for a single rep", () => {
    expect(epley(100, 1)).toBe(100);
  });

  it("estimates 1RM for multi-rep sets", () => {
    expect(epley(100, 5)).toBeCloseTo(100 * (1 + 5 / 30), 5);
  });

  it("returns 0 when reps are 0", () => {
    expect(epley(225, 0)).toBe(0);
  });
});

describe("fmtDuration", () => {
  it("formats minutes and seconds with zero padding", () => {
    expect(fmtDuration(0)).toBe("00:00");
    expect(fmtDuration(125)).toBe("02:05");
    expect(fmtDuration(3600)).toBe("60:00");
  });
});

describe("formatSet", () => {
  it("formats weight sets as weight×reps", () => {
    expect(
      formatSet({ kind: "weight", weight: 135, reps: 5, unit: "lb" })
    ).toBe("135×5");
  });

  it("formats time sets with and without seconds", () => {
    expect(
      formatSet({ kind: "time", minutes: 10, seconds: 0, note: "" })
    ).toBe("10 min");
    expect(
      formatSet({ kind: "time", minutes: 10, seconds: 30, note: "" })
    ).toBe("10m 30s");
  });

  it("coerces empty numeric fields to 0 for time sets", () => {
    expect(
      formatSet({ kind: "time", minutes: "", seconds: "", note: "" })
    ).toBe("0 min");
  });
});

describe("initials", () => {
  it("uses up to two initials", () => {
    expect(initials("Alex")).toBe("A");
    expect(initials("Jane Doe")).toBe("JD");
    expect(initials("Ada Lovelace Byron")).toBe("AL");
  });

  it("falls back for empty names", () => {
    expect(initials("")).toBe("?");
  });
});

describe("startOfDay / dayKey / rollingDays", () => {
  it("pins startOfDay to local noon", () => {
    const d = startOfDay(new Date(2024, 5, 15, 23, 45, 0));
    expect(d.getHours()).toBe(12);
    expect(d.getDate()).toBe(15);
  });

  it("builds dayKey from Date in local calendar", () => {
    expect(dayKey(new Date(2024, 0, 5, 8, 0, 0))).toBe("2024-01-05");
  });

  it("preserves YYYY-MM-DD strings without UTC shift", () => {
    expect(dayKey("2024-01-15")).toBe("2024-01-15");
    expect(dayKey("2024-06-01")).toBe("2024-06-01");
  });

  it("returns a 7-day window oldest → newest ending today", () => {
    const now = new Date(2024, 5, 15, 18, 30, 0);
    const days = rollingDays(now);
    expect(days).toHaveLength(7);
    expect(dayKey(days[0])).toBe("2024-06-09");
    expect(dayKey(days[6])).toBe("2024-06-15");
    for (const d of days) {
      expect(d.getHours()).toBe(12);
    }
  });
});

describe("defaultSet", () => {
  it("returns chalk defaults per mode", () => {
    expect(defaultSet("weight")).toEqual({
      kind: "weight",
      weight: 135,
      reps: 5,
      unit: "lb",
    });
    expect(defaultSet("time")).toEqual({
      kind: "time",
      minutes: 10,
      seconds: 0,
      note: "",
    });
  });
});

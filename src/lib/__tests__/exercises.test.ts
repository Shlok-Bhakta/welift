import { COMMON_EXERCISES, commonMode } from "../exercises";
import { slugify } from "../format";

describe("COMMON_EXERCISES", () => {
  it("includes both weight and time modes", () => {
    expect(COMMON_EXERCISES.some((e) => e.mode === "weight")).toBe(true);
    expect(COMMON_EXERCISES.some((e) => e.mode === "time")).toBe(true);
  });

  it("has stable unique slugs", () => {
    const keys = COMMON_EXERCISES.map((e) => slugify(e.name));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every(Boolean)).toBe(true);
  });
});

describe("commonMode", () => {
  it("resolves known exercise keys", () => {
    expect(commonMode("deadlift")).toBe("weight");
    expect(commonMode("elliptical")).toBe("time");
    expect(commonMode("bench-press")).toBe("weight");
  });

  it("returns undefined for unknown keys", () => {
    expect(commonMode("not-a-real-lift")).toBeUndefined();
  });
});

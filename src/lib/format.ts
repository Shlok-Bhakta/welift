import type { ExerciseMode, LiftSet } from "../types";

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function epley(weight: number, reps: number): number {
  if (!reps) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function formatSet(set: LiftSet): string {
  if (set.kind === "time") {
    const m = Number(set.minutes) || 0;
    const s = Number(set.seconds) || 0;
    return s ? `${m}m ${s}s` : `${m} min`;
  }
  return `${set.weight}×${set.reps}`;
}

export function initials(name: string): string {
  return (name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export function dayKey(d: Date | string): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** Rolling window: today and previous 6 days, oldest → newest. */
export function rollingDays(now = new Date()): Date[] {
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return startOfDay(d);
  });
}

export function defaultSet(mode: ExerciseMode): LiftSet {
  if (mode === "time") {
    return { kind: "time", minutes: 10, seconds: 0, note: "" };
  }
  return { kind: "weight", weight: 135, reps: 5, unit: "lb" };
}

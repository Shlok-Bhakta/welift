import type { ExerciseMode } from "../types";
import { slugify } from "./format";

export const COMMON_EXERCISES: { name: string; mode: ExerciseMode }[] = [
  { name: "Bench Press", mode: "weight" },
  { name: "Squat", mode: "weight" },
  { name: "Deadlift", mode: "weight" },
  { name: "Overhead Press", mode: "weight" },
  { name: "Barbell Row", mode: "weight" },
  { name: "Pull Up", mode: "weight" },
  { name: "Romanian Deadlift", mode: "weight" },
  { name: "Incline Bench", mode: "weight" },
  { name: "Lat Pulldown", mode: "weight" },
  { name: "Dumbbell Curl", mode: "weight" },
  { name: "Elliptical", mode: "time" },
  { name: "Treadmill", mode: "time" },
  { name: "Rowing Machine", mode: "time" },
  { name: "Bike", mode: "time" },
  { name: "Plank", mode: "time" },
];

export function commonMode(key: string): ExerciseMode | undefined {
  return COMMON_EXERCISES.find((c) => slugify(c.name) === key)?.mode;
}

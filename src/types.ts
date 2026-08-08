export type ExerciseMode = "weight" | "time";

export type WeightSet = {
  kind: "weight";
  weight: number | "";
  reps: number | "";
  unit: "lb" | "kg";
};

export type TimeSet = {
  kind: "time";
  minutes: number | "";
  seconds: number | "";
  note?: string;
};

export type LiftSet = WeightSet | TimeSet;

export type SessionExercise = {
  key: string;
  name: string;
  mode: ExerciseMode;
  sets: LiftSet[];
};

export type Session = {
  id: string;
  profileId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  exercises: SessionExercise[];
};

export type BodyWeightEntry = {
  date: string;
  value: number;
  unit: "lb" | "kg";
};

export type Profile = {
  id: string;
  name: string;
  bodyWeight: BodyWeightEntry[];
  catalog: Record<string, { key: string; name: string }>;
  sessions: Session[];
};

export type WeliftBundle = {
  type: "welift/v1";
  exportedAt: string;
  modes?: Record<string, ExerciseMode>;
  profile: Profile;
};

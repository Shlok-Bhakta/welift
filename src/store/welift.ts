import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { COMMON_EXERCISES, commonMode } from "../lib/exercises";
import {
  dayKey,
  defaultSet,
  epley,
  rollingDays,
  slugify,
  startOfDay,
} from "../lib/format";
import type {
  ExerciseMode,
  LiftSet,
  Profile,
  Session,
  SessionExercise,
  WeliftBundle,
} from "../types";

const STORAGE_KEY = "welift-v1";

type Draft = Session & { _timerStarted?: number };

type WeliftState = {
  hydrated: boolean;
  meId: string | null;
  profiles: Record<string, Profile>;
  modes: Record<string, ExerciseMode>;
  selectedDay: string;
  draft: Draft | null;
  editingId: string | null;
  newExerciseMode: ExerciseMode;

  setHydrated: (v: boolean) => void;
  createProfile: (name: string) => void;
  selectDay: (day: string) => void;
  openDay: (day: string, sessionId?: string) => void;
  saveDraft: () => void;
  deleteDraft: () => void;
  addExercise: (name: string, modeHint?: ExerciseMode) => void;
  removeExercise: (key: string) => void;
  setExerciseMode: (key: string, mode: ExerciseMode) => void;
  duplicateSet: (key: string) => void;
  updateSet: (key: string, index: number, patch: Partial<LiftSet>) => void;
  removeSet: (key: string, index: number) => void;
  tickDraft: () => void;
  logBodyWeight: (value: number, unit: "lb" | "kg") => void;
  importBundle: (bundle: WeliftBundle) => void;
  exportBundle: () => WeliftBundle | null;
  setNewExerciseMode: (mode: ExerciseMode) => void;
  knownMode: (key: string, fallback?: ExerciseMode) => ExerciseMode;
  me: () => Profile | null;
  sessionsOn: (day: string, profileId?: string) => Session[];
};

function uid(): string {
  return Crypto.randomUUID();
}

export const useWelift = create<WeliftState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      meId: null,
      profiles: {},
      modes: {},
      selectedDay: dayKey(new Date()),
      draft: null,
      editingId: null,
      newExerciseMode: "weight",

      setHydrated: (v) => set({ hydrated: v }),

      me: () => {
        const { meId, profiles } = get();
        return meId ? profiles[meId] ?? null : null;
      },

      knownMode: (key, fallback = "weight") => {
        const { modes } = get();
        return modes[key] ?? commonMode(key) ?? fallback;
      },

      sessionsOn: (day, profileId) => {
        const { meId, profiles } = get();
        const pid = profileId ?? meId;
        if (!pid) return [];
        return (profiles[pid]?.sessions ?? []).filter(
          (s) => dayKey(s.startedAt) === day
        );
      },

      createProfile: (name) => {
        const id = uid();
        const profile: Profile = {
          id,
          name: name.trim(),
          bodyWeight: [],
          catalog: {},
          sessions: [],
        };
        set({
          meId: id,
          profiles: { [id]: profile },
          modes: {},
          selectedDay: dayKey(new Date()),
        });
      },

      selectDay: (day) => set({ selectedDay: day }),

      openDay: (day, sessionId) => {
        const state = get();
        const me = state.me();
        if (!me) return;
        const list = state.sessionsOn(day);
        const existing =
          (sessionId ? list.find((s) => s.id === sessionId) : null) ?? list[0];
        if (existing) {
          const draft: Draft = JSON.parse(JSON.stringify(existing));
          draft._timerStarted = Date.now() - (draft.durationSec || 0) * 1000;
          set({
            selectedDay: day,
            editingId: existing.id,
            draft,
          });
        } else {
          const draft: Draft = {
            id: uid(),
            profileId: me.id,
            startedAt: new Date(`${day}T17:00:00`).toISOString(),
            endedAt: null,
            durationSec: 0,
            exercises: [],
            _timerStarted: Date.now(),
          };
          set({ selectedDay: day, editingId: null, draft });
        }
      },

      tickDraft: () => {
        const { draft } = get();
        if (!draft?._timerStarted) return;
        const durationSec = Math.floor(
          (Date.now() - draft._timerStarted) / 1000
        );
        if (durationSec === draft.durationSec) return;
        set({ draft: { ...draft, durationSec } });
      },

      saveDraft: () => {
        const state = get();
        const me = state.me();
        const draft = state.draft;
        if (!me || !draft) return;

        const durationSec = Math.max(
          draft.durationSec || 0,
          draft._timerStarted
            ? Math.floor((Date.now() - draft._timerStarted) / 1000)
            : 0
        );
        const clean: Session = {
          id: draft.id,
          profileId: draft.profileId,
          startedAt: draft.startedAt,
          endedAt: new Date().toISOString(),
          durationSec,
          exercises: draft.exercises
            .map((e) => ({
              ...e,
              sets: e.sets.filter((s) => {
                if (s.kind === "time")
                  return s.minutes !== "" || s.seconds !== "";
                return s.weight !== "" || s.reps !== "";
              }),
            }))
            .filter((e) => e.sets.length),
        };

        const profiles = { ...state.profiles };
        const mine = { ...profiles[me.id] };
        const sessions = [...mine.sessions];
        const idx = sessions.findIndex(
          (s) => s.id === (state.editingId || draft.id)
        );
        const modes = { ...state.modes };

        if (!clean.exercises.length) {
          if (idx >= 0) sessions.splice(idx, 1);
        } else if (idx >= 0) {
          sessions[idx] = clean;
        } else {
          sessions.unshift(clean);
        }

        const catalog = { ...mine.catalog };
        for (const e of clean.exercises) {
          catalog[e.key] = { key: e.key, name: e.name };
          modes[e.key] = e.mode;
        }

        profiles[me.id] = { ...mine, sessions, catalog };
        set({
          profiles,
          modes,
          draft: null,
          editingId: null,
          selectedDay: dayKey(clean.startedAt),
        });
      },

      deleteDraft: () => {
        const state = get();
        const me = state.me();
        if (!me || !state.draft) return;
        const id = state.editingId || state.draft.id;
        const profiles = { ...state.profiles };
        const mine = { ...profiles[me.id] };
        mine.sessions = mine.sessions.filter((s) => s.id !== id);
        profiles[me.id] = mine;
        set({ profiles, draft: null, editingId: null });
      },

      addExercise: (name, modeHint) => {
        const state = get();
        if (!state.draft || !state.meId) return;
        const key = slugify(name);
        if (!key) return;
        if (state.draft.exercises.some((e) => e.key === key)) return;
        const mode =
          modeHint ?? state.knownMode(key, state.newExerciseMode);
        const modes = { ...state.modes, [key]: mode };
        const exercise: SessionExercise = {
          key,
          name: name.trim(),
          mode,
          sets: [defaultSet(mode)],
        };
        const profiles = { ...state.profiles };
        const mine = { ...profiles[state.meId] };
        mine.catalog = {
          ...mine.catalog,
          [key]: { key, name: name.trim() },
        };
        profiles[state.meId] = mine;
        set({
          modes,
          profiles,
          draft: {
            ...state.draft,
            exercises: [...state.draft.exercises, exercise],
          },
        });
      },

      removeExercise: (key) => {
        const { draft } = get();
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.filter((e) => e.key !== key),
          },
        });
      },

      setExerciseMode: (key, mode) => {
        const { draft, modes } = get();
        if (!draft) return;
        set({
          modes: { ...modes, [key]: mode },
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.key === key
                ? { ...e, mode, sets: [defaultSet(mode)] }
                : e
            ),
          },
        });
      },

      duplicateSet: (key) => {
        const { draft } = get();
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) => {
              if (e.key !== key || !e.sets.length) return e;
              const last = e.sets[e.sets.length - 1];
              return { ...e, sets: [...e.sets, JSON.parse(JSON.stringify(last))] };
            }),
          },
        });
      },

      updateSet: (key, index, patch) => {
        const { draft } = get();
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) => {
              if (e.key !== key) return e;
              const sets = e.sets.map((s, i) =>
                i === index ? ({ ...s, ...patch } as LiftSet) : s
              );
              return { ...e, sets };
            }),
          },
        });
      },

      removeSet: (key, index) => {
        const { draft, knownMode } = get();
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) => {
              if (e.key !== key) return e;
              const sets = e.sets.filter((_, i) => i !== index);
              if (!sets.length) {
                return { ...e, sets: [defaultSet(e.mode || knownMode(e.key))] };
              }
              return { ...e, sets };
            }),
          },
        });
      },

      logBodyWeight: (value, unit) => {
        const state = get();
        const me = state.me();
        if (!me) return;
        const profiles = { ...state.profiles };
        profiles[me.id] = {
          ...me,
          bodyWeight: [
            ...me.bodyWeight,
            { date: new Date().toISOString(), value, unit },
          ],
        };
        set({ profiles });
      },

      importBundle: (bundle) => {
        if (bundle.type !== "welift/v1" || !bundle.profile?.id) return;
        const profiles = { ...get().profiles, [bundle.profile.id]: bundle.profile };
        const modes = { ...get().modes, ...(bundle.modes ?? {}) };
        set({ profiles, modes });
      },

      exportBundle: () => {
        const me = get().me();
        if (!me) return null;
        return {
          type: "welift/v1",
          exportedAt: new Date().toISOString(),
          modes: get().modes,
          profile: me,
        };
      },

      setNewExerciseMode: (mode) => set({ newExerciseMode: mode }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        meId: s.meId,
        profiles: s.profiles,
        modes: s.modes,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export function dayLoad(day: string): number {
  const sessions = useWelift.getState().sessionsOn(day);
  let n = 0;
  for (const s of sessions) for (const e of s.exercises) n += e.sets.length;
  return n;
}

export function weekLoads(): number[] {
  return rollingDays().map((d) => dayLoad(dayKey(d)));
}

export function exerciseDaySeries(
  profileId: string,
  exerciseKey: string,
  mode: ExerciseMode,
  now = new Date()
): Array<{ label: string; value: number; day: string }> {
  const p = useWelift.getState().profiles[profileId];
  if (!p) return [];

  return rollingDays(now).map((d) => {
    const dk = dayKey(d);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    let best = 0;
    for (const s of p.sessions) {
      if (dayKey(s.startedAt) !== dk) continue;
      for (const e of s.exercises) {
        if (e.key !== exerciseKey) continue;
        for (const set of e.sets) {
          if (mode === "time" && set.kind === "time") {
            best = Math.max(
              best,
              (Number(set.minutes) || 0) + (Number(set.seconds) || 0) / 60
            );
          } else if (set.kind === "weight") {
            best = Math.max(
              best,
              epley(Number(set.weight) || 0, Number(set.reps) || 0)
            );
          }
        }
      }
    }
    return { label, value: Math.round(best), day: dk };
  });
}

export function bestMetric(
  profileId: string,
  exerciseKey: string,
  mode: ExerciseMode
): number {
  const p = useWelift.getState().profiles[profileId];
  if (!p) return 0;
  let best = 0;
  for (const s of p.sessions) {
    for (const e of s.exercises) {
      if (e.key !== exerciseKey) continue;
      for (const set of e.sets) {
        if (mode === "time" && set.kind === "time") {
          best = Math.max(
            best,
            (Number(set.minutes) || 0) + (Number(set.seconds) || 0) / 60
          );
        } else if (set.kind === "weight") {
          best = Math.max(
            best,
            epley(Number(set.weight) || 0, Number(set.reps) || 0)
          );
        }
      }
    }
  }
  return best;
}

export function toLb(value: number, unit: "lb" | "kg"): number {
  return unit === "kg" ? value * 2.20462 : value;
}

/** Latest body-weight entry in lb, or null when none logged. */
export function latestBodyWeightLb(profileId: string): number | null {
  const p = useWelift.getState().profiles[profileId];
  if (!p?.bodyWeight.length) return null;
  const last = p.bodyWeight[p.bodyWeight.length - 1];
  return Math.round(toLb(Number(last.value) || 0, last.unit) * 10) / 10;
}

/**
 * Body-weight series over the rolling 7 days, normalized to lb.
 * Last entry logged on a day wins; days without entries are 0.
 */
export function bodyWeightDaySeries(
  profileId: string,
  now = new Date()
): Array<{ label: string; value: number; day: string }> {
  const p = useWelift.getState().profiles[profileId];
  if (!p) return [];

  const byDay = new Map<string, number>();
  for (const entry of p.bodyWeight) {
    const dk = dayKey(entry.date);
    byDay.set(dk, toLb(Number(entry.value) || 0, entry.unit));
  }

  return rollingDays(now).map((d) => {
    const dk = dayKey(d);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const raw = byDay.get(dk) ?? 0;
    return { label, value: Math.round(raw * 10) / 10, day: dk };
  });
}

export { COMMON_EXERCISES, rollingDays, startOfDay, dayKey };

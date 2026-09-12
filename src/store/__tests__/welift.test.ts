import AsyncStorage from "@react-native-async-storage/async-storage";

import { dayKey } from "../../lib/format";
import type { WeliftBundle } from "../../types";
import {
  bestMetric,
  bodyWeightDaySeries,
  dayLoad,
  exerciseDaySeries,
  latestBodyWeightLb,
  toLb,
  useWelift,
  weekLoads,
} from "../welift";

function resetStore() {
  useWelift.setState({
    hydrated: true,
    meId: null,
    profiles: {},
    modes: {},
    selectedDay: dayKey(new Date()),
    draft: null,
    editingId: null,
    newExerciseMode: "weight",
  });
}

describe("welift store", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetStore();
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createProfile", () => {
    it("creates a mint profile with no seeded sessions or demo friends", () => {
      useWelift.getState().createProfile("  Shlok  ");
      const state = useWelift.getState();

      expect(state.meId).toBeTruthy();
      expect(state.me()?.name).toBe("Shlok");
      expect(state.me()?.sessions).toEqual([]);
      expect(state.me()?.bodyWeight).toEqual([]);
      expect(Object.keys(state.profiles)).toHaveLength(1);
      expect(state.profiles["alex-demo"]).toBeUndefined();
    });
  });

  function seedOneSession(day = "2099-01-15") {
    useWelift.getState().openDay(day);
    useWelift.getState().addExercise("Squat");
    useWelift.getState().updateSet("squat", 0, { weight: 225, reps: 5 });
    useWelift.getState().saveDraft();
    return day;
  }

  describe("draft session lifecycle", () => {
    beforeEach(() => {
      useWelift.getState().createProfile("Shlok");
    });

    it("opens an empty day with a fresh draft", () => {
      const day = "2099-01-01";
      useWelift.getState().openDay(day);
      const draft = useWelift.getState().draft;

      expect(useWelift.getState().selectedDay).toBe(day);
      expect(useWelift.getState().editingId).toBeNull();
      expect(draft?.exercises).toEqual([]);
      expect(draft?.profileId).toBe(useWelift.getState().meId);
      expect(dayKey(draft!.startedAt)).toBe(day);
    });

    it("opens an existing session as an editable draft", () => {
      seedOneSession();
      const me = useWelift.getState().me()!;
      const existing = me.sessions[0];
      const day = dayKey(existing.startedAt);

      useWelift.getState().openDay(day, existing.id);

      expect(useWelift.getState().editingId).toBe(existing.id);
      expect(useWelift.getState().draft?.id).toBe(existing.id);
      expect(useWelift.getState().draft?.exercises.length).toBe(
        existing.exercises.length
      );
    });

    it("adds an exercise once and rejects duplicate slugs", () => {
      useWelift.getState().openDay("2099-01-02");
      useWelift.getState().addExercise("Deadlift");
      useWelift.getState().addExercise("deadlift");
      useWelift.getState().addExercise("!!!");

      const exercises = useWelift.getState().draft!.exercises;
      expect(exercises).toHaveLength(1);
      expect(exercises[0].key).toBe("deadlift");
      expect(exercises[0].mode).toBe("weight");
      expect(exercises[0].sets).toHaveLength(1);
      expect(useWelift.getState().modes.deadlift).toBe("weight");
      expect(useWelift.getState().me()?.catalog.deadlift?.name).toBe("Deadlift");
    });

    it("honors modeHint and newExerciseMode for unknown lifts", () => {
      useWelift.getState().openDay("2099-01-03");
      useWelift.getState().setNewExerciseMode("time");
      useWelift.getState().addExercise("Custom Cardio");
      expect(useWelift.getState().draft!.exercises[0].mode).toBe("time");

      useWelift.getState().addExercise("Custom Strength", "weight");
      expect(
        useWelift.getState().draft!.exercises.find((e) => e.key === "custom-strength")
          ?.mode
      ).toBe("weight");
    });

    it("saves a filled draft onto the selected day", () => {
      const day = "2099-02-01";
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Squat");
      useWelift.getState().updateSet("squat", 0, { weight: 225, reps: 5 });
      useWelift.getState().saveDraft();

      expect(useWelift.getState().draft).toBeNull();
      const sessions = useWelift.getState().sessionsOn(day);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].exercises[0].sets[0]).toMatchObject({
        kind: "weight",
        weight: 225,
        reps: 5,
      });
      expect(sessions[0].endedAt).toBeTruthy();
    });

    it("updates an existing session in place on re-save", () => {
      const day = "2099-02-05";
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Front Squat");
      useWelift.getState().updateSet("front-squat", 0, { weight: 185, reps: 5 });
      useWelift.getState().saveDraft();

      const id = useWelift.getState().sessionsOn(day)[0].id;
      useWelift.getState().openDay(day, id);
      useWelift.getState().updateSet("front-squat", 0, { weight: 205, reps: 3 });
      useWelift.getState().saveDraft();

      const sessions = useWelift.getState().sessionsOn(day);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(id);
      expect(sessions[0].exercises[0].sets[0]).toMatchObject({
        weight: 205,
        reps: 3,
      });
    });

    it("prunes empty sets and deletes a session when nothing remains", () => {
      seedOneSession();
      const me = useWelift.getState().me()!;
      const existing = me.sessions[0];
      const day = dayKey(existing.startedAt);
      const before = me.sessions.length;

      useWelift.getState().openDay(day, existing.id);
      const draft = useWelift.getState().draft!;
      useWelift.setState({
        draft: {
          ...draft,
          exercises: draft.exercises.map((e) => ({
            ...e,
            sets: e.sets.map((s) =>
              s.kind === "weight"
                ? { ...s, weight: "" as const, reps: "" as const }
                : { ...s, minutes: "" as const, seconds: "" as const }
            ),
          })),
        },
      });
      useWelift.getState().saveDraft();

      expect(useWelift.getState().sessionsOn(day)).toHaveLength(0);
      expect(useWelift.getState().me()!.sessions.length).toBe(before - 1);
    });

    it("keeps bodyweight pull-ups with 0 weight", () => {
      const day = "2099-02-02";
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Pull Up");
      useWelift.getState().updateSet("pull-up", 0, { weight: 0, reps: 8 });
      useWelift.getState().saveDraft();

      const set = useWelift.getState().sessionsOn(day)[0].exercises[0].sets[0];
      expect(set).toMatchObject({ kind: "weight", weight: 0, reps: 8 });
    });

    it("deleteDraft removes the edited session", () => {
      seedOneSession();
      const existing = useWelift.getState().me()!.sessions[0];
      const day = dayKey(existing.startedAt);
      useWelift.getState().openDay(day, existing.id);
      useWelift.getState().deleteDraft();

      expect(useWelift.getState().draft).toBeNull();
      expect(
        useWelift.getState().me()!.sessions.some((s) => s.id === existing.id)
      ).toBe(false);
    });

    it("updates, duplicates, and removes sets safely", () => {
      useWelift.getState().openDay("2099-03-01");
      useWelift.getState().addExercise("Bench Press");
      useWelift.getState().updateSet("bench-press", 0, { weight: 155, reps: 5 });
      useWelift.getState().duplicateSet("bench-press");

      let sets = useWelift.getState().draft!.exercises[0].sets;
      expect(sets).toHaveLength(2);
      expect(sets[1]).toEqual(sets[0]);
      expect(sets[1]).not.toBe(sets[0]);

      useWelift.getState().updateSet("bench-press", 1, { weight: 165 });
      sets = useWelift.getState().draft!.exercises[0].sets;
      expect(sets[0]).toMatchObject({ weight: 155 });
      expect(sets[1]).toMatchObject({ weight: 165, reps: 5 });

      useWelift.getState().removeSet("bench-press", 0);
      expect(useWelift.getState().draft!.exercises[0].sets).toHaveLength(1);

      useWelift.getState().removeSet("bench-press", 0);
      // Last set removed → replaced with defaultSet
      expect(useWelift.getState().draft!.exercises[0].sets).toHaveLength(1);
      expect(useWelift.getState().draft!.exercises[0].sets[0]).toMatchObject({
        kind: "weight",
        weight: 135,
        reps: 5,
      });
    });

    it("setExerciseMode resets sets to the mode default", () => {
      useWelift.getState().openDay("2099-03-02");
      useWelift.getState().addExercise("Bike", "time");
      useWelift.getState().updateSet("bike", 0, { minutes: 25, seconds: 0 });
      useWelift.getState().setExerciseMode("bike", "weight");

      const ex = useWelift.getState().draft!.exercises[0];
      expect(ex.mode).toBe("weight");
      expect(ex.sets).toEqual([
        { kind: "weight", weight: 135, reps: 5, unit: "lb" },
      ]);
      expect(useWelift.getState().modes.bike).toBe("weight");
    });

    it("removeExercise drops an exercise from the draft", () => {
      useWelift.getState().openDay("2099-03-03");
      useWelift.getState().addExercise("Squat");
      useWelift.getState().addExercise("Deadlift");
      useWelift.getState().removeExercise("squat");
      expect(
        useWelift.getState().draft!.exercises.map((e) => e.key)
      ).toEqual(["deadlift"]);
    });

    it("tickDraft advances durationSec from timer start", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
      useWelift.getState().openDay("2099-03-04");
      const started = useWelift.getState().draft!._timerStarted!;
      expect(started).toBe(Date.now());

      jest.setSystemTime(new Date("2024-06-15T12:00:10.000Z"));
      useWelift.getState().tickDraft();
      expect(useWelift.getState().draft!.durationSec).toBe(10);

      // Same second → no-op state write path
      useWelift.getState().tickDraft();
      expect(useWelift.getState().draft!.durationSec).toBe(10);
    });
  });

  describe("body weight + metrics", () => {
    beforeEach(() => {
      useWelift.getState().createProfile("Shlok");
    });

    it("logBodyWeight appends an entry", () => {
      const before = useWelift.getState().me()!.bodyWeight.length;
      useWelift.getState().logBodyWeight(185.5, "lb");
      const bw = useWelift.getState().me()!.bodyWeight;
      expect(bw).toHaveLength(before + 1);
      expect(bw[bw.length - 1]).toMatchObject({ value: 185.5, unit: "lb" });
    });

    it("toLb converts kg and passes lb through", () => {
      expect(toLb(180, "lb")).toBe(180);
      expect(toLb(82, "kg")).toBeCloseTo(180.78, 1);
    });

    it("bodyWeightDaySeries tracks last entry per day over 7 days", () => {
      const meId = useWelift.getState().meId!;
      const now = new Date();
      const today = dayKey(now);

      expect(
        bodyWeightDaySeries(meId, now).filter((p) => p.value > 0)
      ).toHaveLength(0);

      useWelift.getState().logBodyWeight(180, "lb");
      useWelift.getState().logBodyWeight(82, "kg");
      const series = bodyWeightDaySeries(meId, now);
      expect(series).toHaveLength(7);
      expect(series.filter((p) => p.value > 0)).toHaveLength(1);
      expect(series.find((p) => p.day === today)?.value).toBeCloseTo(180.8, 1);
      expect(bodyWeightDaySeries("missing", now)).toEqual([]);
    });

    it("latestBodyWeightLb returns newest entry in lb or null", () => {
      const meId = useWelift.getState().meId!;
      expect(latestBodyWeightLb(meId)).toBeNull();
      useWelift.getState().logBodyWeight(180, "lb");
      useWelift.getState().logBodyWeight(82, "kg");
      expect(latestBodyWeightLb(meId)).toBeCloseTo(180.8, 1);
    });

    it("bestMetric returns max Epley for weight lifts", () => {
      const meId = useWelift.getState().meId!;
      const day = "2099-04-01";
      useWelift.getState().openDay(day);
      // Unique key — avoid collision with seeded Deadlift history
      useWelift.getState().addExercise("Trap Bar Deadlift");
      useWelift.getState().updateSet("trap-bar-deadlift", 0, {
        weight: 100,
        reps: 5,
      });
      useWelift.getState().duplicateSet("trap-bar-deadlift");
      useWelift.getState().updateSet("trap-bar-deadlift", 1, {
        weight: 315,
        reps: 1,
      });
      useWelift.getState().saveDraft();

      expect(bestMetric(meId, "trap-bar-deadlift", "weight")).toBe(315);
      // 100×5 Epley is lower than a true single at 315
      expect(bestMetric(meId, "trap-bar-deadlift", "weight")).toBeGreaterThan(
        100 * (1 + 5 / 30) - 0.01
      );
      expect(bestMetric("missing", "trap-bar-deadlift", "weight")).toBe(0);
    });

    it("bestMetric returns max minutes for time lifts", () => {
      const meId = useWelift.getState().meId!;
      const day = "2099-04-02";
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Assault Bike", "time");
      useWelift.getState().updateSet("assault-bike", 0, {
        minutes: 20,
        seconds: 30,
      });
      useWelift.getState().saveDraft();

      expect(bestMetric(meId, "assault-bike", "time")).toBeCloseTo(20.5, 5);
    });

    it("dayLoad / weekLoads count sets on the rolling window", () => {
      const day = dayKey(new Date());
      useWelift.getState().openDay(day);
      // clear any seed collision by using a unique exercise and saving
      useWelift.getState().addExercise("Unique Load Lift");
      useWelift.getState().duplicateSet("unique-load-lift");
      useWelift.getState().saveDraft();

      expect(dayLoad(day)).toBeGreaterThanOrEqual(2);
      const loads = weekLoads();
      expect(loads).toHaveLength(7);
      expect(loads.some((n) => n > 0)).toBe(true);
    });
  });

  describe("export / import", () => {
    beforeEach(() => {
      useWelift.getState().createProfile("Shlok");
    });

    it("exportBundle packages welift/v1 for me", () => {
      const bundle = useWelift.getState().exportBundle();
      expect(bundle?.type).toBe("welift/v1");
      expect(bundle?.profile.id).toBe(useWelift.getState().meId);
      expect(bundle?.modes).toEqual(useWelift.getState().modes);
      expect(bundle?.exportedAt).toBeTruthy();
    });

    it("exportBundle returns null without a profile", () => {
      resetStore();
      expect(useWelift.getState().exportBundle()).toBeNull();
    });

    it("importBundle merges a friend profile and modes", () => {
      const friend: WeliftBundle = {
        type: "welift/v1",
        exportedAt: "2024-01-01T00:00:00.000Z",
        modes: { "hip-thrust": "weight" },
        profile: {
          id: "friend-1",
          name: "Riley",
          bodyWeight: [{ date: "2024-01-01T00:00:00.000Z", value: 150, unit: "lb" }],
          catalog: {
            "hip-thrust": { key: "hip-thrust", name: "Hip Thrust" },
          },
          sessions: [
            {
              id: "s1",
              profileId: "friend-1",
              startedAt: "2024-01-02T17:00:00.000Z",
              endedAt: "2024-01-02T18:00:00.000Z",
              durationSec: 3600,
              exercises: [
                {
                  key: "hip-thrust",
                  name: "Hip Thrust",
                  mode: "weight",
                  sets: [
                    { kind: "weight", weight: 185, reps: 8, unit: "lb" },
                  ],
                },
              ],
            },
          ],
        },
      };

      useWelift.getState().importBundle(friend);
      expect(useWelift.getState().profiles["friend-1"].name).toBe("Riley");
      expect(useWelift.getState().modes["hip-thrust"]).toBe("weight");
      expect(
        useWelift.getState().sessionsOn(dayKey("2024-01-02T17:00:00.000Z"), "friend-1")
      ).toHaveLength(1);
    });

    it("importBundle replaces the same profile id (documented clobber)", () => {
      useWelift.getState().importBundle({
        type: "welift/v1",
        exportedAt: "2024-01-01T00:00:00.000Z",
        profile: {
          id: "friend-1",
          name: "Riley Updated",
          bodyWeight: [],
          catalog: {},
          sessions: [],
        },
      });
      expect(useWelift.getState().profiles["friend-1"].name).toBe(
        "Riley Updated"
      );
      expect(useWelift.getState().profiles["friend-1"].sessions).toEqual([]);
    });

    it("importBundle ignores invalid bundles", () => {
      const before = { ...useWelift.getState().profiles };
      useWelift.getState().importBundle({
        type: "nope" as any,
        exportedAt: "",
        profile: { id: "x", name: "x", bodyWeight: [], catalog: {}, sessions: [] },
      });
      useWelift.getState().importBundle({
        type: "welift/v1",
        exportedAt: "",
        profile: {
          id: "",
          name: "bad",
          bodyWeight: [],
          catalog: {},
          sessions: [],
        },
      });
      expect(useWelift.getState().profiles).toEqual(before);
    });

    it("round-trips export → import onto a clean device state", () => {
      const exported = useWelift.getState().exportBundle()!;
      resetStore();
      useWelift.getState().importBundle(exported);

      expect(useWelift.getState().profiles[exported.profile.id].name).toBe(
        "Shlok"
      );
      expect(useWelift.getState().modes).toMatchObject(exported.modes ?? {});
      // meId is not set by import alone — friend profile lands for People view
      expect(useWelift.getState().meId).toBeNull();
    });
  });

  describe("exerciseDaySeries", () => {
    beforeEach(() => {
      useWelift.getState().createProfile("Shlok");
    });

    it("returns zeros for days without logged work", () => {
      const meId = useWelift.getState().meId!;
      const day = dayKey(new Date());
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Brand New Lift");
      useWelift.getState().updateSet("brand-new-lift", 0, {
        weight: 135,
        reps: 5,
      });
      useWelift.getState().saveDraft();

      const series = exerciseDaySeries(meId, "brand-new-lift", "weight");
      expect(series).toHaveLength(7);
      expect(series.filter((p) => p.value > 0)).toHaveLength(1);
      expect(series.find((p) => p.day === day)?.value).toBeGreaterThan(0);
    });

    it("tracks best est. 1RM per day across sessions", () => {
      const meId = useWelift.getState().meId!;
      const day = "2099-05-01";
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise("Deadlift");
      useWelift.getState().updateSet("deadlift", 0, { weight: 225, reps: 5 });
      useWelift.getState().saveDraft();

      const series = exerciseDaySeries(
        meId,
        "deadlift",
        "weight",
        new Date(`${day}T12:00:00`)
      );
      const point = series.find((p) => p.day === day);
      expect(point?.value).toBe(Math.round(225 * (1 + 5 / 30)));
      expect(series.filter((p) => p.value > 0)).toHaveLength(1);
    });
  });

  describe("selectors", () => {
    it("me / knownMode / selectDay behave", () => {
      expect(useWelift.getState().me()).toBeNull();
      useWelift.getState().createProfile("Shlok");
      expect(useWelift.getState().knownMode("bench-press")).toBe("weight");
      expect(useWelift.getState().knownMode("mystery-lift", "time")).toBe(
        "time"
      );
      useWelift.getState().selectDay("2099-12-25");
      expect(useWelift.getState().selectedDay).toBe("2099-12-25");
    });
  });

  describe("guards when unhydrated / no draft", () => {
    it("no-ops mutations without a profile or draft", () => {
      useWelift.getState().openDay("2099-01-01");
      expect(useWelift.getState().draft).toBeNull();

      useWelift.getState().saveDraft();
      useWelift.getState().deleteDraft();
      useWelift.getState().addExercise("Squat");
      useWelift.getState().logBodyWeight(180, "lb");
      useWelift.getState().tickDraft();
      expect(useWelift.getState().sessionsOn("2099-01-01")).toEqual([]);

      useWelift.getState().createProfile("Shlok");
      useWelift.getState().removeExercise("squat");
      useWelift.getState().setExerciseMode("squat", "time");
      useWelift.getState().duplicateSet("squat");
      useWelift.getState().updateSet("squat", 0, { weight: 100 });
      useWelift.getState().removeSet("squat", 0);
      expect(useWelift.getState().draft).toBeNull();
    });
  });
});

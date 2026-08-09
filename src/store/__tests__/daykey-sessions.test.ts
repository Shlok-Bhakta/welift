import { dayKey, rollingDays } from "../../lib/format";
import { useWelift } from "../welift";

/**
 * Calendar-day invariants for the week rail.
 * Sessions must land on the day the user tapped, not a UTC-shifted neighbor.
 */
describe("dayKey session bucketing", () => {
  beforeEach(() => {
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
    jest.spyOn(Math, "random").mockReturnValue(0.25);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps openDay / sessionsOn on the same calendar day string", () => {
    useWelift.getState().createProfile("Shlok");
    for (const day of ["2024-01-15", "2024-06-30", "2024-12-31"]) {
      useWelift.getState().openDay(day);
      useWelift.getState().addExercise(`Lift ${day}`);
      useWelift.getState().saveDraft();
      expect(useWelift.getState().sessionsOn(day)).toHaveLength(1);
      expect(
        dayKey(useWelift.getState().sessionsOn(day)[0].startedAt)
      ).toBe(day);
    }
  });

  it("rollingDays dayKeys are unique and contiguous", () => {
    const keys = rollingDays(new Date(2024, 0, 15, 9, 0, 0)).map(dayKey);
    expect(new Set(keys).size).toBe(7);
    expect(keys[0]).toBe("2024-01-09");
    expect(keys[6]).toBe("2024-01-15");
  });
});

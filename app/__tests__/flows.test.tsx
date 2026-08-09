import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { dayKey } from "../../src/lib/format";
import * as share from "../../src/lib/share";
import { useWelift } from "../../src/store/welift";
import {
  mockRouter,
  prepareFlow,
  seedProfile,
} from "../../src/test/flowHelpers";
import type { WeliftBundle } from "../../src/types";
import OnboardScreen from "../onboard";
import PeopleScreen from "../people";
import ProgressScreen from "../progress";
import SessionScreen from "../session";
import WeekScreen from "../week";

jest.mock("expo-router", () => {
  const { mockRouter: router } = require("../../src/test/flowHelpers");
  return {
    router,
    Redirect: () => null,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => children ?? null,
      { Screen: () => null }
    ),
  };
});

jest.mock("../../src/lib/share", () => ({
  shareWeliftBundle: jest.fn(async () => undefined),
  pickWeliftBundle: jest.fn(async () => null),
}));

describe("screen flows (E2E-lite)", () => {
  beforeEach(async () => {
    await prepareFlow();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("onboard rejects empty name and opens week with a profile", () => {
    render(<OnboardScreen />);
    expect(screen.getByText("Open my week")).toBeTruthy();

    fireEvent.press(screen.getByText("Open my week"));
    expect(useWelift.getState().meId).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText("Shlok"), "  Shlok  ");
    fireEvent.press(screen.getByText("Open my week"));

    expect(useWelift.getState().me()?.name).toBe("Shlok");
    expect(mockRouter.replace).toHaveBeenCalledWith("/week");
    expect(useWelift.getState().profiles["alex-demo"]).toBeTruthy();
  });

  it("week shows seeded history and opens an empty day into session", () => {
    seedProfile("Shlok");
    render(<WeekScreen />);

    expect(screen.getByText("Your week")).toBeTruthy();
    expect(screen.getByText("Shlok")).toBeTruthy();
    expect(screen.getByText(/sets \/ bouts this week/)).toBeTruthy();

    // Today is empty in seed data → empty-day CTA
    fireEvent.press(screen.getByText("Log this day"));
    expect(useWelift.getState().draft).toBeTruthy();
    expect(mockRouter.push).toHaveBeenCalledWith("/session");
  });

  it("session logs a set, saves, and returns to week", () => {
    seedProfile("Shlok");
    const day = "2099-07-04";
    useWelift.getState().openDay(day);
    useWelift.getState().addExercise("Trap Bar Deadlift");

    render(<SessionScreen />);

    expect(screen.getAllByText("Trap Bar Deadlift").length).toBeGreaterThan(0);
    expect(screen.getAllByText("trap-bar-deadlift").length).toBeGreaterThan(0);
    expect(screen.getByText("New")).toBeTruthy();

    fireEvent.changeText(screen.getAllByPlaceholderText("lb")[0], "405");
    fireEvent.changeText(screen.getAllByPlaceholderText("reps")[0], "2");
    fireEvent.press(screen.getByText("Save"));

    expect(useWelift.getState().draft).toBeNull();
    const saved = useWelift.getState().sessionsOn(day)[0];
    expect(saved.exercises[0].sets[0]).toMatchObject({
      kind: "weight",
      weight: 405,
      reps: 2,
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/week");
  });

  it("people exports and imports a friend bundle", async () => {
    seedProfile("Shlok");
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const friend: WeliftBundle = {
      type: "welift/v1",
      exportedAt: "2024-01-01T00:00:00.000Z",
      modes: { "hip-thrust": "weight" },
      profile: {
        id: "friend-flow",
        name: "Riley",
        bodyWeight: [],
        catalog: {},
        sessions: [],
      },
    };
    (share.pickWeliftBundle as jest.Mock).mockResolvedValueOnce(friend);

    render(<PeopleScreen />);
    expect(screen.getByText(/Shlok/)).toBeTruthy();
    expect(screen.getByText(/Alex/)).toBeTruthy();

    fireEvent.press(screen.getByText("Export"));
    await waitFor(() => {
      expect(share.shareWeliftBundle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "welift/v1",
          profile: expect.objectContaining({ name: "Shlok" }),
        })
      );
    });

    fireEvent.press(screen.getByText("Import"));
    await waitFor(() => {
      expect(useWelift.getState().profiles["friend-flow"].name).toBe("Riley");
      expect(alertSpy).toHaveBeenCalledWith("Imported", "Riley");
    });
  });

  it("people logs body weight", () => {
    seedProfile("Shlok");
    const before = useWelift.getState().me()!.bodyWeight.length;
    render(<PeopleScreen />);

    fireEvent.changeText(screen.getByPlaceholderText("185"), "190");
    fireEvent.press(screen.getByText("+"));

    expect(useWelift.getState().me()!.bodyWeight).toHaveLength(before + 1);
    expect(
      useWelift.getState().me()!.bodyWeight.slice(-1)[0]
    ).toMatchObject({ value: 190, unit: "lb" });
  });

  it("progress shows shared exercise chart chrome", () => {
    seedProfile("Shlok");
    render(<ProgressScreen />);
    expect(screen.getByText("Progress")).toBeTruthy();
    expect(
      screen.getByText(/Est\. 1RM for weight lifts/i)
    ).toBeTruthy();
    expect(screen.getByText("Deadlift")).toBeTruthy();
  });

  it("full happy path: onboard → log → save → day has the lift", () => {
    render(<OnboardScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Shlok"), "Shlok");
    fireEvent.press(screen.getByText("Open my week"));

    const day = dayKey(new Date());
    useWelift.getState().openDay(day);
    useWelift.getState().addExercise("Quality Check Lift");
    useWelift.getState().updateSet("quality-check-lift", 0, {
      weight: 135,
      reps: 5,
    });
    useWelift.getState().saveDraft();

    expect(
      useWelift
        .getState()
        .sessionsOn(day)
        .some((s) =>
          s.exercises.some((e) => e.key === "quality-check-lift")
        )
    ).toBe(true);
  });
});

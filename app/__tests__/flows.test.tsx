import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { dayKey } from "../../src/lib/format";
import * as share from "../../src/lib/share";
import { useWelift, exerciseDaySeries } from "../../src/store/welift";
import {
  mockRouter,
  prepareFlow,
  seedProfile,
} from "../../src/test/flowHelpers";
import type { WeliftBundle } from "../../src/types";
import OnboardScreen from "../onboard";
import PeopleScreen from "../(tabs)/people";
import ProgressScreen from "../(tabs)/progress";
import SessionScreen from "../session";
import WeekScreen from "../(tabs)/week";

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
    expect(screen.getByText("WeLift")).toBeTruthy();
    expect(screen.getByText("Enter your name")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();

    fireEvent.press(screen.getByText("Next"));
    expect(useWelift.getState().meId).toBeNull();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText("Name"), "  Shlok  ");
    fireEvent.press(screen.getByText("Next"));

    expect(useWelift.getState().me()?.name).toBe("Shlok");
    expect(mockRouter.replace).toHaveBeenCalledWith("/week");
    expect(useWelift.getState().me()?.sessions).toEqual([]);
    expect(useWelift.getState().profiles["alex-demo"]).toBeUndefined();
  });

  it("week starts empty and opens session from empty-day CTA", () => {
    seedProfile("Shlok");
    render(<WeekScreen />);

    expect(screen.getByText("Your week")).toBeTruthy();
    expect(screen.getByText("Shlok")).toBeTruthy();
    expect(screen.getByText("0 sets")).toBeTruthy();
    expect(screen.getByText("0 active")).toBeTruthy();
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
    expect(screen.queryByText(/Alex/)).toBeNull();

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

  it("progress shows real logged data only", () => {
    seedProfile("Shlok");
    const day = dayKey(new Date());
    useWelift.getState().openDay(day);
    useWelift.getState().addExercise("Mint Chart Lift");
    useWelift.getState().updateSet("mint-chart-lift", 0, {
      weight: 135,
      reps: 5,
    });
    useWelift.getState().saveDraft();

    render(<ProgressScreen />);
    expect(screen.getByText("Progress")).toBeTruthy();
    expect(screen.queryByTestId("progress-empty")).toBeNull();
    expect(screen.getByTestId("progress-chart")).toBeTruthy();
    expect(screen.getByText(/158 lb/)).toBeTruthy();
    expect(screen.getByTestId("progress-chip-mint-chart-lift")).toBeTruthy();
    const meId = useWelift.getState().meId!;
    expect(
      exerciseDaySeries(meId, "mint-chart-lift", "weight").filter(
        (p) => p.value > 0
      )
    ).toHaveLength(1);
  });

  it("full happy path: onboard → log → save → day has the lift", () => {
    render(<OnboardScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Name"), "Shlok");
    fireEvent.press(screen.getByText("Next"));

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

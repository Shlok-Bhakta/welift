import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { dayKey } from "../../src/lib/format";
import {
  bodyWeightDaySeries,
  latestBodyWeightLb,
  useWelift,
} from "../../src/store/welift";
import {
  mockRouter,
  prepareFlow,
  seedProfile,
} from "../../src/test/flowHelpers";
import TabsLayout from "../(tabs)/_layout";
import PeopleScreen from "../(tabs)/people";
import ProgressScreen from "../(tabs)/progress";
import WeekScreen from "../(tabs)/week";
import SessionScreen from "../session";

jest.mock("expo-router", () => {
  const ReactActual = require("react");
  const { View: RNView } = require("react-native");
  const { mockRouter: router } = require("../../src/test/flowHelpers");
  const Screen = ({ name, options }: { name: string; options?: { tabBarButtonTestID?: string } }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      ReactActual.createElement(RNView, { testID: `tab-${name}` }),
      options?.tabBarButtonTestID
        ? ReactActual.createElement(RNView, { testID: options.tabBarButtonTestID })
        : null
    );
  const Tabs = ({ children }: { children?: React.ReactNode }) =>
    ReactActual.createElement(ReactActual.Fragment, null, children);
  (Tabs as unknown as Record<string, unknown>).Screen = Screen;
  const Stack = ({ children }: { children?: React.ReactNode }) =>
    children ?? null;
  (Stack as unknown as Record<string, unknown>).Screen = () => null;
  return { router, Redirect: () => null, Tabs, Stack };
});

describe("bottom-tab navigation regression", () => {
  beforeEach(async () => {
    await prepareFlow();
  });

  it("tabs layout exposes Week, Progress, and People tabs", () => {
    render(<TabsLayout />);
    expect(screen.getByTestId("tab-week")).toBeTruthy();
    expect(screen.getByTestId("tab-progress")).toBeTruthy();
    expect(screen.getByTestId("tab-people")).toBeTruthy();
    expect(screen.getByTestId("week-tab")).toBeTruthy();
    expect(screen.getByTestId("progress-tab")).toBeTruthy();
    expect(screen.getByTestId("people-tab")).toBeTruthy();
  });

  it("week has no sidebar drawer or hamburger", () => {
    seedProfile("Shlok");
    render(<WeekScreen />);
    expect(screen.queryByTestId("week-menu")).toBeNull();
    expect(screen.queryByText("☰")).toBeNull();
    expect(screen.getByText("Your week")).toBeTruthy();
  });

  it("progress and people have no back-to-Week button", () => {
    seedProfile("Shlok");
    const { unmount } = render(<ProgressScreen />);
    expect(screen.queryByText("Week", { exact: true })).toBeNull();
    unmount();

    render(<PeopleScreen />);
    expect(screen.queryByText("Week", { exact: true })).toBeNull();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("session uses Close instead of Week", () => {
    seedProfile("Shlok");
    useWelift.getState().openDay("2099-07-04");
    render(<SessionScreen />);
    expect(screen.getAllByText("Close").length).toBeGreaterThan(0);
    expect(screen.queryByText("Week", { exact: true })).toBeNull();
  });
});

describe("body-weight chart regression", () => {
  beforeEach(async () => {
    await prepareFlow();
  });

  it("bodyWeightDaySeries buckets last-entry-per-day in lb", () => {
    seedProfile("Shlok");
    const meId = useWelift.getState().meId!;
    const now = new Date();
    const today = dayKey(now);

    expect(bodyWeightDaySeries(meId, now).filter((p) => p.value > 0)).toHaveLength(0);

    useWelift.getState().logBodyWeight(180, "lb");
    useWelift.getState().logBodyWeight(82, "kg"); // 180.8 lb, same day, wins
    const series = bodyWeightDaySeries(meId, now);
    expect(series).toHaveLength(7);
    expect(series.filter((p) => p.value > 0)).toHaveLength(1);
    expect(series.find((p) => p.day === today)?.value).toBeCloseTo(180.8, 1);
    expect(bodyWeightDaySeries("missing", now)).toEqual([]);
  });

  it("latestBodyWeightLb returns the newest entry or null", () => {
    seedProfile("Shlok");
    const meId = useWelift.getState().meId!;
    expect(latestBodyWeightLb(meId)).toBeNull();
    useWelift.getState().logBodyWeight(180, "lb");
    useWelift.getState().logBodyWeight(82, "kg");
    expect(latestBodyWeightLb(meId)).toBeCloseTo(180.8, 1);
  });

  it("progress weight tab charts logged body weight", () => {
    seedProfile("Shlok");
    useWelift.getState().logBodyWeight(182, "lb");
    render(<ProgressScreen />);

    fireEvent.press(screen.getByTestId("progress-tab-weight"));
    expect(screen.getByTestId("progress-weight-section")).toBeTruthy();
    expect(screen.getByTestId("progress-weight-chart")).toBeTruthy();
    expect(screen.getByText("182 lb")).toBeTruthy();
  });

  it("progress weight tab shows empty state with no weigh-ins", () => {
    seedProfile("Shlok");
    render(<ProgressScreen />);

    fireEvent.press(screen.getByTestId("progress-tab-weight"));
    expect(screen.getByTestId("progress-weight-empty")).toBeTruthy();
    expect(screen.queryByTestId("progress-weight-chart")).toBeNull();
  });

  it("people list shows the latest body weight", () => {
    seedProfile("Shlok");
    useWelift.getState().logBodyWeight(190, "lb");
    render(<PeopleScreen />);
    expect(screen.getByText(/0 sessions · 190 lb/)).toBeTruthy();
  });
});

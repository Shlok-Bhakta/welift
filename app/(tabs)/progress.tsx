import { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Body,
  Chip,
  Display,
  Mini,
  Muted,
  Screen,
} from "../../src/components/ui";
import { COMMON_EXERCISES } from "../../src/lib/exercises";
import { initials, slugify } from "../../src/lib/format";
import {
  bodyWeightDaySeries,
  exerciseDaySeries,
  latestBodyWeightLb,
  useWelift,
} from "../../src/store/welift";
import { colors, radius, space, type } from "../../src/theme";

type ChartPoint = { value: number; label: string };

function ProgressPointChart({
  points,
  color,
  testID,
}: {
  points: ChartPoint[];
  color: string;
  testID?: string;
}) {
  const peak = Math.max(...points.map((p) => p.value), 1);
  const plotHeight = 140;
  const ticks = Array.from({ length: 5 }, (_, i) =>
    Math.round((peak * (4 - i)) / 4)
  );

  return (
    <View testID={testID} style={styles.pointChart}>
      <View style={styles.pointYAxis}>
        {ticks.map((tick) => (
          <Muted key={tick} style={styles.pointTick}>
            {tick}
          </Muted>
        ))}
      </View>
      <View style={styles.pointPlotWrap}>
        {ticks.slice(1).map((tick) => (
          <View key={tick} style={styles.pointRule} />
        ))}
        <View style={styles.pointRow}>
          {points.map((pt, i) => {
            const barHeight = Math.max(8, (pt.value / peak) * plotHeight);
            return (
              <View key={`${pt.label}-${i}`} style={styles.pointCol}>
                <View style={[styles.pointBarTrack, { height: plotHeight }]}>
                  <View
                    style={[
                      styles.pointBar,
                      { height: barHeight, backgroundColor: color },
                    ]}
                  />
                  <View style={[styles.pointDot, { backgroundColor: color }]} />
                </View>
                <Mini style={styles.pointLabel}>{pt.label}</Mini>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function WeightChart({
  points,
  chartWidth,
}: {
  points: ChartPoint[];
  chartWidth: number;
}) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const offset = Math.max(0, Math.floor(min - Math.max(5, (max - min) * 0.5)));

  if (points.length === 1) {
    return (
      <ProgressPointChart
        testID="progress-weight-chart"
        points={points}
        color={colors.accent}
      />
    );
  }

  if (Platform.OS === "web") {
    const span = Math.max(1, max - min);
    return (
      <View style={styles.webChart} testID="progress-weight-chart">
        <View style={styles.webBars}>
          {points.map((pt, i) => (
            <View
              key={`${pt.label}-${i}`}
              style={[
                styles.webBar,
                {
                  height: 8 + ((pt.value - min) / span) * 72,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View testID="progress-weight-chart">
      <LineChart
        data={points}
        color={colors.accent}
        thickness={2}
        hideDataPoints={false}
        dataPointsColor={colors.accent}
        dataPointsRadius={4}
        curved={false}
        areaChart={false}
        yAxisColor={colors.line}
        xAxisColor={colors.line}
        yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
        rulesColor={colors.line}
        noOfSections={4}
        height={180}
        width={chartWidth}
        isAnimated
        animationDuration={480}
        yAxisOffset={offset}
      />
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, Math.min(360, windowWidth - 48));
  const profiles = useWelift((s) => s.profiles);
  const meId = useWelift((s) => s.meId);
  const knownMode = useWelift((s) => s.knownMode);
  const [tab, setTab] = useState<"lifts" | "weight">("lifts");

  const keys = useMemo(() => {
    const map = new Map(COMMON_EXERCISES.map((c) => [slugify(c.name), c.name]));
    for (const p of Object.values(profiles)) {
      for (const s of p.sessions) {
        for (const e of s.exercises) map.set(e.key, e.name);
      }
    }
    return [...map.entries()];
  }, [profiles]);

  const loggedKeys = useMemo(() => {
    if (!meId) return [];
    return keys.filter(([k]) =>
      exerciseDaySeries(meId, k, knownMode(k)).some((pt) => pt.value > 0)
    );
  }, [keys, meId, knownMode, profiles]);

  const sortedKeys = useMemo(() => {
    const logged = new Set(loggedKeys.map(([k]) => k));
    return [
      ...keys.filter(([k]) => logged.has(k)),
      ...keys.filter(([k]) => !logged.has(k)),
    ];
  }, [keys, loggedKeys]);

  const [picked, setPicked] = useState<string | null>(null);
  const exercise =
    picked ?? loggedKeys[0]?.[0] ?? sortedKeys[0]?.[0] ?? "deadlift";
  const mode = knownMode(exercise);

  const series = useMemo(
    () =>
      Object.values(profiles).map((p) => {
        const points = exerciseDaySeries(p.id, exercise, mode)
          .filter((pt) => pt.value > 0)
          .map((pt) => ({
            value: pt.value,
            label: pt.label,
          }));
        const peak = points.length ? Math.max(...points.map((pt) => pt.value)) : 0;
        return {
          id: p.id,
          name: p.name,
          you: p.id === meId,
          color: p.id === meId ? colors.accent : colors.them,
          points,
          peak,
        };
      }),
    [profiles, exercise, mode, meId]
  );

  const plotted = series.filter((s) => s.points.length > 0);
  const hasLoggedData = plotted.length > 0;
  const primary = plotted[0];

  const weightPoints = useMemo(
    () =>
      meId
        ? bodyWeightDaySeries(meId).filter((pt) => pt.value > 0)
        : [],
    [meId, profiles]
  );
  const latestWeight = meId ? latestBodyWeightLb(meId) : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingBottom: space.xxl,
          paddingHorizontal: space.lg,
        }}
      >
        <Display testID="progress-heading" style={{ fontSize: type.displayLg, marginTop: 10 }}>
          Progress
        </Display>

        <View style={styles.tabRow}>
          <Chip
            testID="progress-tab-lifts"
            label="Lifts"
            active={tab === "lifts"}
            onPress={() => setTab("lifts")}
          />
          <Chip
            testID="progress-tab-weight"
            label="Weight"
            active={tab === "weight"}
            onPress={() => setTab("weight")}
          />
        </View>

        {tab === "weight" ? (
          <View style={styles.chart} testID="progress-weight-section">
            {latestWeight != null ? (
              <Body testID="progress-weight-value">{`${latestWeight} lb`}</Body>
            ) : null}
            {!weightPoints.length ? (
              <Muted testID="progress-weight-empty">No weigh-ins yet</Muted>
            ) : (
              <WeightChart points={weightPoints} chartWidth={chartWidth} />
            )}
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: space.sm }}>
                {sortedKeys.map(([k, n]) => (
                  <Chip
                    key={k}
                    testID={`progress-chip-${k}`}
                    label={n}
                    active={exercise === k}
                    onPress={() => setPicked(k)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.chart} testID="progress-chart">
              {!hasLoggedData ? (
                <Muted testID="progress-empty">No data yet</Muted>
              ) : primary ? (
                Platform.OS === "web" ? (
                  <View style={styles.webChart} testID="progress-web-chart">
                    {plotted.map((s) => (
                      <View key={s.id} style={styles.webSeries}>
                        <Muted>
                          {s.name}
                          {s.you ? " · you" : ""}
                        </Muted>
                        <View style={styles.webBars}>
                          {s.points.map((pt, i) => {
                            const max = Math.max(1, s.peak);
                            return (
                              <View
                                key={`${s.id}-${i}`}
                                style={[
                                  styles.webBar,
                                  {
                                    height: 8 + (pt.value / max) * 72,
                                    backgroundColor: s.color,
                                  },
                                ]}
                              />
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : primary.points.length === 1 ? (
                  <ProgressPointChart
                    testID="progress-point-chart"
                    points={primary.points}
                    color={primary.color}
                  />
                ) : (
                  <View testID="progress-line-chart">
                    <LineChart
                      data={primary.points}
                      data2={plotted[1]?.points}
                      color={primary.color}
                      color2={plotted[1]?.color}
                      thickness={2}
                      thickness2={2}
                      hideDataPoints={false}
                      dataPointsColor={primary.color}
                      dataPointsColor2={plotted[1]?.color}
                      dataPointsRadius={4}
                      curved={false}
                      areaChart={false}
                      yAxisColor={colors.line}
                      xAxisColor={colors.line}
                      yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
                      rulesColor={colors.line}
                      noOfSections={4}
                      height={180}
                      width={chartWidth}
                      isAnimated
                      animationDuration={480}
                    />
                  </View>
                )
              ) : null}
            </View>

            <Mini style={{ marginTop: space.md }}>
              {mode === "time" ? "Best minutes" : "Best est. 1RM"}
            </Mini>
            {plotted.map((s) => (
              <View key={s.id} style={styles.person}>
                <Avatar label={initials(s.name)} />
                <View>
                  <Body>
                    {s.name}
                    {s.you ? " · you" : ""}
                  </Body>
                  <Muted testID={`progress-peak-${s.id}`}>
                    {s.peak}
                    {mode === "time" ? " min" : " lb"}
                  </Muted>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  chart: {
    marginTop: space.lg,
    paddingVertical: space.sm,
    minHeight: 180,
  },
  pointChart: {
    flexDirection: "row",
    gap: space.sm,
    minHeight: 180,
  },
  pointYAxis: {
    width: 28,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  pointTick: {
    fontSize: 10,
    textAlign: "right",
  },
  pointPlotWrap: {
    flex: 1,
    position: "relative",
    justifyContent: "flex-end",
  },
  pointRule: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.md,
    paddingTop: space.sm,
  },
  pointCol: {
    flex: 1,
    alignItems: "center",
    gap: space.sm,
  },
  pointBarTrack: {
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  pointBar: {
    width: 4,
    borderRadius: 2,
    opacity: 0.35,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -5,
  },
  pointLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  webChart: {
    gap: 14,
    paddingVertical: space.sm,
  },
  webSeries: { gap: 6 },
  webBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 90,
  },
  webBar: {
    width: 18,
    borderRadius: 3,
    opacity: 0.9,
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});

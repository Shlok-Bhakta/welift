import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Body,
  Button,
  Display,
  Mini,
  Muted,
  Screen,
} from "../src/components/ui";
import { COMMON_EXERCISES } from "../src/lib/exercises";
import { initials, slugify } from "../src/lib/format";
import { exerciseDaySeries, useWelift } from "../src/store/welift";
import { colors } from "../src/theme";

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

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const profiles = useWelift((s) => s.profiles);
  const meId = useWelift((s) => s.meId);
  const knownMode = useWelift((s) => s.knownMode);

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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.topbar}>
          <Button label="Week" variant="line" small onPress={() => router.back()} />
        </View>
        <Display testID="progress-heading" style={{ fontSize: 40, marginTop: 10 }}>
          Progress
        </Display>
        <Muted style={{ marginBottom: 12 }}>
          Est. 1RM for weight lifts · total minutes for timed work.
        </Muted>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sortedKeys.map(([k, n]) => (
              <Pressable
                key={k}
                testID={`progress-chip-${k}`}
                onPress={() => setPicked(k)}
                style={[styles.chip, exercise === k && styles.chipOn]}
              >
                <Body
                  style={{
                    fontSize: 13,
                    color: exercise === k ? colors.accentInk : colors.muted,
                  }}
                >
                  {n}
                </Body>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.chart} testID="progress-chart">
          {!hasLoggedData ? (
            <Muted testID="progress-empty">
              Log this exercise to see your rolling week.
            </Muted>
          ) : primary ? (
            Platform.OS === "web" ? (
              <View style={styles.webChart} testID="progress-web-chart">
                {plotted.map((s) => (
                  <View key={s.id} style={styles.webSeries}>
                    <Muted>
                      {s.name}
                      {s.you ? " (you)" : ""}
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
                  width={320}
                  isAnimated={false}
                />
              </View>
            )
          ) : null}
        </View>

        <Mini style={{ marginTop: 12 }}>
          {mode === "time" ? "Best minutes" : "Best est. 1RM"}
        </Mini>
        {plotted.map((s) => (
          <View key={s.id} style={styles.person}>
            <View style={styles.av}>
              <Body style={{ fontSize: 12 }}>{initials(s.name)}</Body>
            </View>
            <View>
              <Body>
                {s.name}
                {s.you ? " (you)" : ""}
              </Body>
              <Muted testID={`progress-peak-${s.id}`}>
                {s.peak}
                {mode === "time" ? " min" : " lb"}
              </Muted>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.accent,
    borderColor: "transparent",
  },
  chart: {
    marginTop: 16,
    paddingVertical: 8,
    minHeight: 180,
  },
  pointChart: {
    flexDirection: "row",
    gap: 8,
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
    gap: 12,
    paddingTop: 8,
  },
  pointCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
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
    paddingVertical: 8,
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
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
});

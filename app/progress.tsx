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

  const [exercise, setExercise] = useState(keys[0]?.[0] ?? "deadlift");
  const mode = knownMode(exercise);

  const series = useMemo(
    () =>
      Object.values(profiles).map((p) => {
        const points = exerciseDaySeries(p.id, exercise, mode).map((pt) => ({
          value: pt.value,
          label: pt.label,
        }));
        const peak = Math.max(0, ...points.map((pt) => pt.value));
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

  const hasLoggedData = series.some((s) => s.peak > 0);

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
        <Display testID="progress-heading" style={{ fontSize: 40, marginTop: 10 }}>Progress</Display>
        <Muted style={{ marginBottom: 12 }}>
          Est. 1RM for weight lifts · total minutes for timed work.
        </Muted>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {keys.map(([k, n]) => (
              <Pressable
                key={k}
                onPress={() => setExercise(k)}
                style={[
                  styles.chip,
                  exercise === k && styles.chipOn,
                ]}
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
          ) : series[0] ? (
            Platform.OS === "web" ? (
              // gifted-charts LineChart currently throws on RN-web; keep a readable fallback.
              <View style={styles.webChart} testID="progress-web-chart">
                {series
                  .filter((s) => s.peak > 0)
                  .map((s) => (
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
                                height: pt.value
                                  ? 8 + (pt.value / max) * 72
                                  : 4,
                                backgroundColor: s.color,
                                opacity: pt.value ? 0.9 : 0.25,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <LineChart
                data={series.find((s) => s.peak > 0)?.points ?? series[0].points}
                data2={
                  series.filter((s) => s.peak > 0)[1]?.points ??
                  series[1]?.points
                }
                color={series[0].color}
                color2={series[1]?.color}
                thickness={2}
                thickness2={2}
                hideDataPoints={false}
                dataPointsColor={series[0].color}
                dataPointsColor2={series[1]?.color}
                dataPointsRadius={3}
                curved
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
            )
          ) : null}
        </View>

        <Mini style={{ marginTop: 12 }}>
          {mode === "time" ? "Best minutes" : "Best est. 1RM"}
        </Mini>
        {series
          .filter((s) => s.peak > 0)
          .map((s) => (
          <View key={s.id} style={styles.person}>
            <View style={styles.av}>
              <Body style={{ fontSize: 12 }}>{initials(s.name)}</Body>
            </View>
            <View>
              <Body>
                {s.name}
                {s.you ? " (you)" : ""}
              </Body>
              <Muted>
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

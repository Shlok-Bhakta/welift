import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "../src/components/GlassSurface";
import { Sparkline } from "../src/components/Sparkline";
import {
  Body,
  Button,
  Display,
  Mini,
  Muted,
  Pill,
  Screen,
} from "../src/components/ui";
import { dayKey, fmtDuration, formatSet, rollingDays } from "../src/lib/format";
import { dayLoad, useWelift } from "../src/store/welift";
import { colors, space } from "../src/theme";

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const meId = useWelift((s) => s.meId);
  const profiles = useWelift((s) => s.profiles);
  const selectedDay = useWelift((s) => s.selectedDay);
  const selectDay = useWelift((s) => s.selectDay);
  const openDay = useWelift((s) => s.openDay);
  const sessionsOn = useWelift((s) => s.sessionsOn);
  const [menu, setMenu] = useState(false);

  const me = meId ? profiles[meId] : null;
  const days = useMemo(() => rollingDays(), [selectedDay, profiles]);
  const loads = days.map((d) => dayLoad(dayKey(d)));
  const maxL = Math.max(1, ...loads);
  const total = loads.reduce((a, b) => a + b, 0);
  const list = sessionsOn(selectedDay);
  const selectedDate = new Date(`${selectedDay}T12:00:00`);
  const todayKey = dayKey(new Date());
  const isToday = selectedDay === todayKey;

  if (!me) {
    router.replace("/onboard");
    return null;
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 16,
        }}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.railWrap}>
          <View style={styles.topbar}>
            <Pressable
              onPress={() => setMenu(true)}
              style={styles.iconBtn}
              hitSlop={8}
              testID="week-menu"
            >
              <Body style={{ fontSize: 18 }}>☰</Body>
            </Pressable>
            <Muted>{me.name}</Muted>
            <Button
              label="Today"
              variant="line"
              small
              onPress={() => selectDay(todayKey)}
            />
          </View>
          <Mini style={{ marginTop: 12 }}>Rolling 7 days</Mini>
          <Display style={{ fontSize: 32, marginTop: 2 }}>Your week</Display>
          <View style={styles.rail}>
            {days.map((d, i) => {
              const k = dayKey(d);
              const on = k === selectedDay;
              const empty = loads[i] === 0;
              const sparkVals = [
                0,
                loads[i] * 0.35,
                loads[i] * 0.7,
                loads[i],
              ].map((x) => Math.round(x));
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    selectDay(k);
                    openDay(k);
                    router.push("/session");
                  }}
                  style={[
                    styles.day,
                    on && styles.dayOn,
                    empty && styles.dayEmpty,
                  ]}
                >
                  <Mini style={{ fontSize: 10 }}>
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </Mini>
                  <Body style={{ fontSize: 14 }}>{d.getDate()}</Body>
                  <Sparkline values={sparkVals} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <GlassSurface style={styles.heroCard}>
          <View style={styles.topbar}>
            <View>
              <Mini>Week intensity</Mini>
              <Body style={{ marginTop: 4 }}>
                {total
                  ? `${total} sets / bouts this week`
                  : "Quiet stretch — tap a day to log"}
              </Body>
            </View>
            <Pill testID="week-active-pill">{`${loads.filter((x) => x > 0).length} active`}</Pill>
          </View>
          <View style={styles.bars}>
            {loads.map((n, i) => (
              <View
                key={dayKey(days[i])}
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (n / maxL) * 42),
                    backgroundColor:
                      dayKey(days[i]) === selectedDay
                        ? colors.mark
                        : "rgba(196,165,116,0.28)",
                  },
                ]}
              />
            ))}
          </View>
        </GlassSurface>

        <View style={{ marginTop: 14, marginBottom: 10 }}>
          <Mini>
            {isToday
              ? "Today"
              : selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
          </Mini>
          <Display style={{ fontSize: 36, marginTop: 4 }}>
            {selectedDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Display>
          <Muted style={{ marginTop: 4 }}>
            {list.length
              ? `${list.length} session · tap to edit anytime`
              : "Empty day — tap here or a dashed square to log."}
          </Muted>
        </View>

        {!list.length ? (
          <Pressable
            testID="week-empty-day"
            onPress={() => {
              openDay(selectedDay);
              router.push("/session");
            }}
            style={styles.emptyDay}
          >
            <Display style={{ fontSize: 34, color: "#6d6458" }}>
              Log this day
            </Display>
            <Muted style={{ textAlign: "center", marginTop: 6 }}>
              Weight lifts, timed cardio, whatever you did.
            </Muted>
          </Pressable>
        ) : (
          list.map((s) => {
            const setCount = s.exercises.reduce(
              (a, e) => a + e.sets.length,
              0
            );
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  openDay(selectedDay, s.id);
                  router.push("/session");
                }}
              >
                <GlassSurface style={styles.card}>
                  <View style={styles.topbar}>
                    <Body style={{ fontSize: 16 }}>
                      {fmtDuration(s.durationSec || 0)}
                    </Body>
                    <Pill>{`${setCount} entries · edit`}</Pill>
                  </View>
                  <View style={{ gap: 7, marginTop: 4 }}>
                    {s.exercises.map((e) => (
                      <View key={e.key} style={styles.liftline}>
                        <Body>{e.name}</Body>
                        <Muted>{e.sets.map(formatSet).join(", ")}</Muted>
                      </View>
                    ))}
                  </View>
                </GlassSurface>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={menu}
        animationType="fade"
        transparent
        onRequestClose={() => setMenu(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setMenu(false)}>
          <Pressable style={[styles.drawer, { paddingTop: insets.top + 22 }]}>
            <Mini>WeLift</Mini>
            <Display style={{ fontSize: 32, marginVertical: 12 }}>
              {me.name}
            </Display>
            <MenuLink
              title="Week"
              sub="Rolling last 7 days"
              onPress={() => setMenu(false)}
            />
            <MenuLink
              title="Progress"
              sub="You + circle"
              testID="menu-progress"
              onPress={() => {
                setMenu(false);
                router.push("/progress");
              }}
            />
            <MenuLink
              title="People & share"
              sub=".welift import / export"
              onPress={() => {
                setMenu(false);
                router.push("/people");
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function MenuLink({
  title,
  sub,
  onPress,
  testID,
}: {
  title: string;
  sub: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.nav} testID={testID}>
      <Body>{title}</Body>
      <Muted style={{ marginTop: 2 }}>{sub}</Muted>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  railWrap: {
    backgroundColor: colors.bg,
    paddingBottom: 8,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(28,25,22,0.75)",
  },
  rail: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  day: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(28,25,22,0.4)",
  },
  dayOn: {
    borderColor: colors.mark,
    backgroundColor: "rgba(196,165,116,0.12)",
  },
  dayEmpty: {
    borderStyle: "dashed",
    borderColor: colors.dashed,
  },
  heroCard: {
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 42,
    marginTop: 10,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 4,
  },
  emptyDay: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    backgroundColor: "rgba(28,25,22,0.35)",
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  liftline: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
  },
  drawer: {
    width: "80%",
    maxWidth: 310,
    backgroundColor: colors.bg2,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  nav: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});

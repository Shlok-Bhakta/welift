import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Body,
  Button,
  Chip,
  Display,
  Field,
  Mini,
  Muted,
  Pill,
  Screen,
} from "../src/components/ui";
import { COMMON_EXERCISES, commonMode } from "../src/lib/exercises";
import { fmtDuration, slugify } from "../src/lib/format";
import { useWelift } from "../src/store/welift";
import type { ExerciseMode } from "../src/types";
import { colors, radius, space, type } from "../src/theme";

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const draft = useWelift((s) => s.draft);
  const editingId = useWelift((s) => s.editingId);
  const tickDraft = useWelift((s) => s.tickDraft);
  const saveDraft = useWelift((s) => s.saveDraft);
  const deleteDraft = useWelift((s) => s.deleteDraft);
  const addExercise = useWelift((s) => s.addExercise);
  const removeExercise = useWelift((s) => s.removeExercise);
  const setExerciseMode = useWelift((s) => s.setExerciseMode);
  const duplicateSet = useWelift((s) => s.duplicateSet);
  const updateSet = useWelift((s) => s.updateSet);
  const removeSet = useWelift((s) => s.removeSet);
  const newExerciseMode = useWelift((s) => s.newExerciseMode);
  const setNewExerciseMode = useWelift((s) => s.setNewExerciseMode);
  const knownMode = useWelift((s) => s.knownMode);
  const me = useWelift((s) => s.me());
  const profiles = useWelift((s) => s.profiles);
  const meId = useWelift((s) => s.meId);

  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState("");
  const snapPoints = useMemo(() => ["72%"], []);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!draft) router.replace("/week");
  }, [draft]);

  useEffect(() => {
    const id = setInterval(() => tickDraft(), 400);
    return () => clearInterval(id);
  }, [tickDraft]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  );

  const catalog = me?.catalog ?? {};
  const mine = Object.values(catalog);
  const others: { key: string; name: string; mode: ExerciseMode; from: string }[] =
    [];
  for (const p of Object.values(profiles)) {
    if (p.id === meId) continue;
    for (const s of p.sessions) {
      for (const e of s.exercises) {
        if (!mine.some((m) => m.key === e.key) && !others.some((o) => o.key === e.key)) {
          others.push({
            key: e.key,
            name: e.name,
            mode: e.mode || knownMode(e.key),
            from: p.name,
          });
        }
      }
    }
  }

  const filter = (name: string, key: string) => {
    const q = query.toLowerCase();
    return !q || name.toLowerCase().includes(q) || key.includes(q);
  };

  const finish = () => {
    saveDraft();
    router.replace("/week");
  };

  if (!draft) return null;

  const canCreate = query.trim().length > 0;

  return (
    <BottomSheetModalProvider>
      <Screen>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={insets.top}
        >
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + space.md,
              paddingBottom: insets.bottom + 32,
              paddingHorizontal: space.lg,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topbar}>
              <Button label="Close" variant="line" small onPress={finish} />
              <View style={[styles.liveRow, styles.livePill]}>
                <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
                <Muted>{editingId ? "Editing" : "New"}</Muted>
              </View>
              <Button label="Save" testID="session-save" small onPress={finish} />
            </View>

            <Mini style={{ marginTop: space.md }}>
              {new Date(draft.startedAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Mini>
            <Display style={styles.timer}>{fmtDuration(draft.durationSec || 0)}</Display>

            <Button
              label="Add exercise"
              testID="add-exercise"
              style={{ marginTop: 14, marginBottom: 8 }}
              onPress={() => sheetRef.current?.present()}
            />

            {draft.exercises.length === 0 ? (
              <View style={{ marginTop: 8, gap: 8 }}>
                <Mini>Quick add</Mini>
                {["Deadlift", "Squat", "Bench Press"].map((name) => {
                  const key = slugify(name);
                  return (
                    <Button
                      key={key}
                      label={name}
                      variant="line"
                      testID={`quick-add-${key}`}
                      onPress={() => addExercise(name, commonMode(key))}
                    />
                  );
                })}
              </View>
            ) : (
              draft.exercises.map((e) => (
                <View key={e.key} style={styles.exblock}>
                  <View style={styles.topbar}>
                    <View style={{ flex: 1 }}>
                      <Body>{e.name}</Body>
                    </View>
                    <Button
                      label="Remove"
                      variant="line"
                      small
                      onPress={() => removeExercise(e.key)}
                    />
                  </View>

                  <View style={styles.modeRow}>
                    <Chip
                      label="Weight × reps"
                      active={e.mode === "weight"}
                      onPress={() => setExerciseMode(e.key, "weight")}
                      style={{ flex: 1 }}
                    />
                    <Chip
                      label="Time based"
                      active={e.mode === "time"}
                      onPress={() => setExerciseMode(e.key, "time")}
                      style={{ flex: 1 }}
                    />
                  </View>

                  {e.sets.map((set, i) => (
                    <View key={i} style={styles.setrow}>
                      <Muted style={styles.setN}>{i + 1}</Muted>
                      {e.mode === "time" && set.kind === "time" ? (
                        <>
                          <Field
                            style={styles.setField}
                            keyboardType="number-pad"
                            value={String(set.minutes ?? "")}
                            onChangeText={(t) =>
                              updateSet(e.key, i, {
                                minutes: t === "" ? "" : Number(t),
                              })
                            }
                            placeholder="min"
                          />
                          <Field
                            style={styles.setField}
                            keyboardType="number-pad"
                            value={String(set.seconds ?? "")}
                            onChangeText={(t) =>
                              updateSet(e.key, i, {
                                seconds: t === "" ? "" : Number(t),
                              })
                            }
                            placeholder="sec"
                          />
                        </>
                      ) : set.kind === "weight" ? (
                        <>
                          <Field
                            style={styles.setField}
                            keyboardType="decimal-pad"
                            value={String(set.weight ?? "")}
                            onChangeText={(t) =>
                              updateSet(e.key, i, {
                                weight: t === "" ? "" : Number(t),
                              })
                            }
                            placeholder="lb"
                          />
                          <Field
                            style={styles.setField}
                            keyboardType="number-pad"
                            value={String(set.reps ?? "")}
                            onChangeText={(t) =>
                              updateSet(e.key, i, {
                                reps: t === "" ? "" : Number(t),
                              })
                            }
                            placeholder="reps"
                          />
                        </>
                      ) : null}
                      <Pressable
                        accessibilityLabel={`Remove set ${i + 1}`}
                        onPress={() => removeSet(e.key, i)}
                        style={styles.ghostX}
                      >
                        <Body style={{ color: colors.muted }}>×</Body>
                      </Pressable>
                    </View>
                  ))}

                  <Button
                    label="+ same as last"
                    variant="line"
                    style={{ marginTop: 10 }}
                    onPress={() => duplicateSet(e.key)}
                  />
                </View>
              ))
            )}

            {editingId || draft.exercises.length > 0 ? (
              <Button
                label="Delete session"
                variant="hot"
                style={{ marginTop: 20 }}
                onPress={() =>
                  Alert.alert("Delete this session?", undefined, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        deleteDraft();
                        router.replace("/week");
                      },
                    },
                  ])
                }
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomSheetModal
          ref={sheetRef}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.bg2 }}
          handleIndicatorStyle={{ backgroundColor: colors.muted }}
        >
          <BottomSheetScrollView
            contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topbar}>
              <Display style={{ fontSize: type.displayXs }}>Exercises</Display>
              <Button
                label="Close"
                variant="line"
                small
                onPress={() => sheetRef.current?.dismiss()}
              />
            </View>
            <Field
              value={query}
              onChangeText={setQuery}
              placeholder="Search or create…"
              testID="exercise-search"
              style={{ marginVertical: 10 }}
            />
            <Mini>Default style for new lifts</Mini>
            <View style={[styles.modeRow, { marginTop: 8, marginBottom: 12 }]}>
              <Chip
                label="Weight × reps"
                active={newExerciseMode === "weight"}
                onPress={() => setNewExerciseMode("weight")}
                style={{ flex: 1 }}
              />
              <Chip
                label="Time based"
                active={newExerciseMode === "time"}
                onPress={() => setNewExerciseMode("time")}
                style={{ flex: 1 }}
              />
            </View>

            <Mini>Yours</Mini>
            {mine.filter((x) => filter(x.name, x.key)).map((x) => (
              <ExerciseRow
                key={x.key}
                name={x.name}
                meta={x.key}
                mode={knownMode(x.key)}
                onPress={() => {
                  addExercise(x.name, knownMode(x.key));
                  sheetRef.current?.dismiss();
                }}
              />
            ))}

            <Mini style={{ marginTop: 14 }}>Common</Mini>
            {COMMON_EXERCISES.filter((x) =>
              filter(x.name, slugify(x.name))
            ).map((x) => (
              <ExerciseRow
                key={x.name}
                name={x.name}
                meta={slugify(x.name)}
                mode={x.mode}
                onPress={() => {
                  addExercise(x.name, x.mode);
                  sheetRef.current?.dismiss();
                }}
              />
            ))}

            <Mini style={{ marginTop: 14 }}>From other people</Mini>
            {others.filter((x) => filter(x.name, x.key)).length === 0 ? null : (
              others
                .filter((x) => filter(x.name, x.key))
                .map((x) => (
                  <ExerciseRow
                    key={x.key}
                    name={x.name}
                    meta={`from ${x.from}`}
                    mode={x.mode}
                    onPress={() => {
                      addExercise(x.name, x.mode);
                      sheetRef.current?.dismiss();
                    }}
                  />
                ))
            )}

            {canCreate ? (
              <Button
                label="Create from search"
                testID="create-from-search"
                style={{ marginTop: 14 }}
                onPress={() => {
                  const n = query.trim();
                  if (!n) return;
                  addExercise(n, newExerciseMode);
                  sheetRef.current?.dismiss();
                  setQuery("");
                }}
              />
            ) : null}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </Screen>
    </BottomSheetModalProvider>
  );
}

function ExerciseRow({
  name,
  meta,
  mode,
  onPress,
}: {
  name: string;
  meta: string;
  mode: ExerciseMode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.exRow}
      testID={`exercise-row-${slugify(name)}`}
    >
      <View style={{ flex: 1 }}>
        <Body>{name}</Body>
        <Muted>{meta}</Muted>
      </View>
      <Pill>{mode === "time" ? "time" : "weight"}</Pill>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  timer: { fontSize: type.timer, marginTop: 4 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  livePill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.hot,
  },
  exblock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 14,
  },
  modeRow: { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 4 },
  setrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  setN: {
    width: 28,
    textAlign: "center",
    fontFamily: "DMSans_700Bold",
  },
  setField: { flex: 1, paddingVertical: 11 },
  ghostX: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});

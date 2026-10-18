import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Body,
  Button,
  Display,
  Field,
  Mini,
  Screen,
} from "../../src/components/ui";
import { initials } from "../../src/lib/format";
import { pickWeliftBundle, shareWeliftBundle } from "../../src/lib/share";
import { latestBodyWeightLb, useWelift } from "../../src/store/welift";
import { colors, space, type } from "../../src/theme";

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const profiles = useWelift((s) => s.profiles);
  const meId = useWelift((s) => s.meId);
  const logBodyWeight = useWelift((s) => s.logBodyWeight);
  const exportBundle = useWelift((s) => s.exportBundle);
  const importBundle = useWelift((s) => s.importBundle);
  const [bw, setBw] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingBottom: space.xxl,
          paddingHorizontal: space.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Display style={{ fontSize: type.displayLg, marginTop: 10 }}>People</Display>

        {Object.values(profiles).map((p) => {
          const latest = latestBodyWeightLb(p.id);
          return (
            <View key={p.id} style={styles.person}>
              <Avatar label={initials(p.name)} />
              <View style={{ flex: 1 }}>
                <Body>
                  {p.name}
                  {p.id === meId ? " · you" : ""}
                </Body>
                <Body
                  testID="people-latest-weight"
                  style={{ color: colors.muted, fontSize: type.bodySm }}
                >
                  {`${p.sessions.length} sessions`}
                  {latest != null ? ` · ${latest} lb` : ""}
                </Body>
              </View>
            </View>
          );
        })}

        <Mini style={{ marginTop: 18 }}>Body weight</Mini>
        <View style={styles.row}>
          <Field
            style={{ flex: 1 }}
            keyboardType="decimal-pad"
            value={bw}
            onChangeText={setBw}
            placeholder="185"
            testID="bodyweight-input"
            accessibilityLabel="Body weight"
          />
          <Button
            label={unit}
            variant="line"
            small
            onPress={() => setUnit((u) => (u === "lb" ? "kg" : "lb"))}
            style={{ minWidth: 56 }}
            accessibilityLabel={`Unit ${unit}`}
          />
          <Button
            label="+"
            small
            testID="bodyweight-add"
            accessibilityLabel="Add body weight"
            onPress={() => {
              const v = Number(bw);
              if (!v) {
                Alert.alert("Enter a weight");
                return;
              }
              logBodyWeight(v, unit);
              setBw("");
            }}
            style={{ minWidth: 44 }}
          />
        </View>

        <Mini style={{ marginTop: 18 }}>Share</Mini>
        <View style={styles.row}>
          <Button
            label="Export"
            style={{ flex: 1 }}
            onPress={async () => {
              const bundle = exportBundle();
              if (!bundle) return;
              try {
                await shareWeliftBundle(bundle);
              } catch (e) {
                Alert.alert("Export failed", String(e));
              }
            }}
          />
          <Button
            label="Import"
            variant="line"
            style={{ flex: 1 }}
            onPress={async () => {
              try {
                const bundle = await pickWeliftBundle();
                if (!bundle) return;
                importBundle(bundle);
                Alert.alert("Imported", bundle.profile.name);
              } catch (e) {
                Alert.alert("Import failed", String(e));
              }
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.sm,
  },
});

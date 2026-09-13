import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextProps,
  type ViewProps,
} from "react-native";

import { colors, radius, space, type } from "../theme";

export function useWeliftFonts() {
  return useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
}

export function Screen({ style, ...rest }: ViewProps) {
  return <View style={[styles.screen, style]} {...rest} />;
}

export function Display({ style, ...rest }: TextProps) {
  return <Text style={[styles.display, style]} {...rest} />;
}

export function Body({ style, ...rest }: TextProps) {
  return <Text style={[styles.body, style]} {...rest} />;
}

export function Muted({ style, ...rest }: TextProps) {
  return <Text style={[styles.muted, style]} {...rest} />;
}

export function Mini({ style, ...rest }: TextProps) {
  return <Text style={[styles.mini, style]} {...rest} />;
}

export function Pill({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.pill} testID={testID}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

export function Avatar({
  label,
  size = 40,
}: {
  label: string;
  size?: number;
}) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius.md }]}>
      <Body style={{ fontSize: type.mini }}>{label}</Body>
    </View>
  );
}

type ChipProps = PressableProps & {
  label: string;
  active?: boolean;
  testID?: string;
};

export function Chip({ label, active, style, onPress, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={(e) => {
        if (active == null || !active) {
          void Haptics.selectionAsync().catch(() => undefined);
        }
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipOn,
        pressed && Platform.OS === "ios" && { opacity: 0.88 },
        style as object,
      ]}
      {...rest}
    >
      <Body
        style={{
          fontSize: type.bodySm,
          color: active ? colors.accentInk : colors.muted,
        }}
      >
        {label}
      </Body>
    </Pressable>
  );
}

type BtnProps = PressableProps & {
  label: string;
  variant?: "fill" | "line" | "hot";
  small?: boolean;
};

export function Button({
  label,
  variant = "fill",
  small,
  style,
  onPress,
  ...rest
}: BtnProps) {
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={
        Platform.OS === "android"
          ? { color: "rgba(244,239,230,0.12)" }
          : undefined
      }
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => undefined
        );
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSm,
        variant === "fill" && styles.btnFill,
        variant === "line" && styles.btnLine,
        variant === "hot" && styles.btnHot,
        pressed &&
          Platform.OS === "ios" && {
            opacity: 0.9,
            transform: [{ scale: 0.98 }],
          },
        style as object,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.btnLabel,
          variant === "fill" && { color: colors.accentInk },
          variant === "line" && { color: colors.ink },
          variant === "hot" && { color: colors.hot },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  display: {
    fontFamily: "BebasNeue_400Regular",
    color: colors.ink,
    letterSpacing: 0.6,
  },
  body: {
    fontFamily: "DMSans_600SemiBold",
    color: colors.ink,
    fontSize: type.body,
  },
  muted: {
    fontFamily: "DMSans_400Regular",
    color: colors.muted,
    fontSize: type.bodySm,
    lineHeight: 18,
  },
  mini: {
    fontFamily: "DMSans_600SemiBold",
    color: colors.muted,
    fontSize: type.mini,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: "DMSans_600SemiBold",
    color: colors.muted,
    fontSize: type.mini,
  },
  avatar: {
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg2,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.accent,
    borderColor: "transparent",
  },
  btn: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSm: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  btnFill: {
    backgroundColor: colors.accent,
  },
  btnLine: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnHot: {
    borderWidth: 1,
    borderColor: colors.hotLine,
  },
  btnLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: type.body,
  },
  field: {
    width: "100%",
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});

export { colors, radius, space, type };

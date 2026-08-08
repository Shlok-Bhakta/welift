import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useFonts } from "expo-font";
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

import { colors, space } from "../theme";

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

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
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
  ...rest
}: BtnProps) {
  return (
    <Pressable
      android_ripple={
        Platform.OS === "android"
          ? { color: "rgba(244,239,230,0.12)" }
          : undefined
      }
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSm,
        variant === "fill" && styles.btnFill,
        variant === "line" && styles.btnLine,
        variant === "hot" && styles.btnHot,
        pressed && Platform.OS === "ios" && { opacity: 0.9, transform: [{ scale: 0.98 }] },
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
    fontSize: 15,
  },
  muted: {
    fontFamily: "DMSans_400Regular",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  mini: {
    fontFamily: "DMSans_600SemiBold",
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: "DMSans_600SemiBold",
    color: colors.muted,
    fontSize: 11,
  },
  btn: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    borderColor: "#5a3428",
  },
  btnLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
  },
  field: {
    width: "100%",
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
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

export { colors, space };

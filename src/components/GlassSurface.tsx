import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";

import { colors } from "../theme";

type Props = ViewProps & {
  interactive?: boolean;
  intensity?: "regular" | "clear";
};

/** iOS Liquid Glass when available; warm chalk fallback elsewhere (incl. Android). */
export function GlassSurface({
  interactive = false,
  intensity = "regular",
  style,
  children,
  ...rest
}: Props) {
  const canGlass =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  if (canGlass) {
    return (
      <GlassView
        glassEffectStyle={intensity}
        isInteractive={interactive}
        tintColor="rgba(228,215,195,0.18)"
        colorScheme="dark"
        style={[styles.base, style]}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.base, styles.fallback, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  fallback: {
    backgroundColor: "rgba(28,25,22,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
});

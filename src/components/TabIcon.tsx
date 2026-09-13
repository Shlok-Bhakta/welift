import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  name: "week" | "progress" | "people";
  color: string;
  size?: number;
};

/** Chalk-line tab glyphs. Avoids MissingIcon triangles when tabBarIcon is unset. */
export function TabIcon({ name, color, size = 22 }: Props) {
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  if (name === "week") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="3.5" y="5" width="17" height="15" rx="2.5" {...common} />
        <Path d="M8 3.5v3M16 3.5v3M3.5 10h17" {...common} />
        <Path d="M8 14h2M12 14h2M16 14h1.5M8 17h2M12 17h2" {...common} />
      </Svg>
    );
  }

  if (name === "progress") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 19V5M4 19h16" {...common} />
        <Path d="M8 15v-4M12 15V8M16 15v-6" {...common} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="9" cy="8" r="3" {...common} />
      <Circle cx="17" cy="9" r="2.5" {...common} />
      <Path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5s4.7 1.5 5.5 4.5" {...common} />
      <Path d="M15 14.5c2 .2 3.6 1.3 4.5 3.5" {...common} />
    </Svg>
  );
}

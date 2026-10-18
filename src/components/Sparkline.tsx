import Svg, { Rect } from "react-native-svg";

import { colors } from "../theme";

/** Tiny load mark for the week rail — height tracks set count, not a fake trend. */
export function Sparkline({
  values,
  width = 28,
  height = 16,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const load = values[values.length - 1] ?? 0;
  const max = Math.max(1, ...values);
  const barH = Math.max(load > 0 ? 3 : 2, (load / max) * height);
  const active = load > 0;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect
        x={width * 0.28}
        y={height - barH}
        width={width * 0.44}
        height={barH}
        rx={1.5}
        fill={active ? colors.mark : colors.dashed}
      />
    </Svg>
  );
}

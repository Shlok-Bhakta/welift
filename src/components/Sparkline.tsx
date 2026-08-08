import Svg, { Polyline } from "react-native-svg";

import { colors } from "../theme";

export function Sparkline({
  values,
  width = 28,
  height = 16,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const active = values.some((v) => v > 0);
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        fill="none"
        stroke={active ? colors.mark : colors.dashed}
        strokeWidth={1.5}
        points={pts}
      />
    </Svg>
  );
}

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

let mockUuidSeq = 0;
jest.mock("expo-crypto", () => ({
  randomUUID: () => {
    mockUuidSeq += 1;
    return `00000000-0000-4000-8000-${String(mockUuidSeq).padStart(12, "0")}`;
  },
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(async () => undefined),
}));

jest.mock("@expo-google-fonts/bebas-neue", () => ({
  BebasNeue_400Regular: "BebasNeue_400Regular",
  useFonts: () => [true, null],
}));

jest.mock("@expo-google-fonts/dm-sans", () => ({
  DMSans_400Regular: "DMSans_400Regular",
  DMSans_500Medium: "DMSans_500Medium",
  DMSans_600SemiBold: "DMSans_600SemiBold",
  DMSans_700Bold: "DMSans_700Bold",
  useFonts: () => [true, null],
}));

jest.mock("expo-glass-effect", () => ({
  GlassView: require("react-native").View,
  isGlassEffectAPIAvailable: () => false,
  isLiquidGlassAvailable: () => false,
}));

jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 47, right: 0, bottom: 34, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Sheet = React.forwardRef((props: { children?: unknown }, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      present: jest.fn(),
      dismiss: jest.fn(),
    }));
    return React.createElement(
      View,
      { testID: "bottom-sheet" },
      props.children
    );
  });
  Sheet.displayName = "BottomSheetModal";
  return {
    BottomSheetModal: Sheet,
    BottomSheetModalProvider: ({
      children,
    }: {
      children: unknown;
    }) => children,
    BottomSheetBackdrop: () => null,
    BottomSheetScrollView: View,
  };
});

jest.mock("react-native-gifted-charts", () => ({
  LineChart: () => null,
}));

beforeEach(() => {
  mockUuidSeq = 0;
  jest.useRealTimers();
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import { View } from "react-native";

import {
  Body,
  Button,
  Display,
  Field,
  Loading,
  Mini,
  Muted,
  Pill,
  Screen,
  useWeliftFonts,
} from "../ui";

describe("ui primitives", () => {
  it("renders typography helpers", () => {
    render(
      <Screen testID="screen">
        <Display>WeLift</Display>
        <Body>Log a set</Body>
        <Muted>Private</Muted>
        <Mini>WEEK</Mini>
        <Pill>demo</Pill>
      </Screen>
    );

    expect(screen.getByTestId("screen")).toBeTruthy();
    expect(screen.getByText("WeLift")).toBeTruthy();
    expect(screen.getByText("Log a set")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
    expect(screen.getByText("WEEK")).toBeTruthy();
    expect(screen.getByText("demo")).toBeTruthy();
  });

  it("fires fill Button presses", () => {
    const onPress = jest.fn();
    render(<Button label="Export" onPress={onPress} />);
    fireEvent.press(screen.getByText("Export"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("fires line and hot Button variants", () => {
    const onPress = jest.fn();
    render(
      <View>
        <Button label="Line" variant="line" small onPress={onPress} />
        <Button label="Hot" variant="hot" onPress={onPress} />
      </View>
    );
    fireEvent.press(screen.getByText("Line"));
    fireEvent.press(screen.getByText("Hot"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("updates Field text", () => {
    const onChangeText = jest.fn();
    render(
      <Field
        value=""
        onChangeText={onChangeText}
        placeholder="185"
        testID="bw"
      />
    );
    fireEvent.changeText(screen.getByTestId("bw"), "190");
    expect(onChangeText).toHaveBeenCalledWith("190");
  });

  it("renders Loading indicator", () => {
    const { toJSON } = render(<Loading />);
    expect(toJSON()).toBeTruthy();
  });

  it("reports fonts ready via useWeliftFonts", () => {
    function Probe() {
      const [ready] = useWeliftFonts();
      return <Body>{ready ? "fonts-ready" : "fonts-loading"}</Body>;
    }
    render(<Probe />);
    expect(screen.getByText("fonts-ready")).toBeTruthy();
  });
});

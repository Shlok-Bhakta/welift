import AsyncStorage from "@react-native-async-storage/async-storage";

import { dayKey } from "../lib/format";
import { useWelift } from "../store/welift";

export const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export function resetWeliftStore() {
  useWelift.setState({
    hydrated: true,
    meId: null,
    profiles: {},
    modes: {},
    selectedDay: dayKey(new Date()),
    draft: null,
    editingId: null,
    newExerciseMode: "weight",
  });
}

export async function prepareFlow() {
  await AsyncStorage.clear();
  resetWeliftStore();
  mockRouter.replace.mockClear();
  mockRouter.push.mockClear();
  mockRouter.back.mockClear();
  jest.spyOn(Math, "random").mockReturnValue(0.42);
}

export function seedProfile(name = "Shlok") {
  useWelift.getState().createProfile(name);
  return useWelift.getState();
}

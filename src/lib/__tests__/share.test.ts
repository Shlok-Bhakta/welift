import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { WeliftBundle } from "../../types";
import { pickWeliftBundle, shareWeliftBundle } from "../share";

const mockFsState = {
  cacheDirectory: "file:///cache/" as string | null,
};

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  EncodingType: { UTF8: "utf8" },
  get cacheDirectory() {
    return mockFsState.cacheDirectory;
  },
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const sampleBundle: WeliftBundle = {
  type: "welift/v1",
  exportedAt: "2024-06-15T12:00:00.000Z",
  modes: { squat: "weight" },
  profile: {
    id: "p1",
    name: "Shlok",
    bodyWeight: [],
    catalog: {},
    sessions: [],
  },
};

beforeEach(() => {
  mockFsState.cacheDirectory = "file:///cache/";
});

describe("shareWeliftBundle", () => {
  it("throws when cacheDirectory is unavailable", async () => {
    mockFsState.cacheDirectory = null;
    await expect(shareWeliftBundle(sampleBundle)).rejects.toThrow(
      "No cache directory"
    );
  });

  it("writes slugified .welift JSON and shares when available", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    await shareWeliftBundle(sampleBundle);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///cache/shlok.welift",
      JSON.stringify(sampleBundle, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      "file:///cache/shlok.welift",
      expect.objectContaining({
        mimeType: "application/json",
        UTI: "public.json",
      })
    );
  });

  it("skips share sheet when sharing is unavailable", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    await shareWeliftBundle(sampleBundle);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it("uses welift filename when profile name slugifies empty", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    await shareWeliftBundle({
      ...sampleBundle,
      profile: { ...sampleBundle.profile, name: "!!!" },
    });

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///cache/welift.welift",
      expect.any(String),
      expect.any(Object)
    );
  });
});

describe("pickWeliftBundle", () => {
  it("returns null when the picker is canceled", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    await expect(pickWeliftBundle()).resolves.toBeNull();
  });

  it("returns null when assets are missing", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [],
    });

    await expect(pickWeliftBundle()).resolves.toBeNull();
  });

  it("parses a valid welift/v1 bundle", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/shlok.welift" }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(sampleBundle)
    );

    await expect(pickWeliftBundle()).resolves.toEqual(sampleBundle);
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      "file:///tmp/shlok.welift",
      { encoding: FileSystem.EncodingType.UTF8 }
    );
  });

  it("rejects invalid type", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/bad.json" }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ type: "nope", profile: { id: "x" } })
    );

    await expect(pickWeliftBundle()).rejects.toThrow(
      "Not a valid .welift file"
    );
  });

  it("rejects missing profile id", async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///tmp/bad.json" }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ type: "welift/v1", profile: { name: "x" } })
    );

    await expect(pickWeliftBundle()).rejects.toThrow(
      "Not a valid .welift file"
    );
  });
});

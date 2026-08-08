import * as DocumentPicker from "expo-document-picker";
import {
  EncodingType,
  cacheDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { WeliftBundle } from "../types";
import { slugify } from "./format";

export async function shareWeliftBundle(bundle: WeliftBundle): Promise<void> {
  const name = slugify(bundle.profile.name) || "welift";
  if (!cacheDirectory) throw new Error("No cache directory");
  const path = `${cacheDirectory}${name}.welift`;
  await writeAsStringAsync(path, JSON.stringify(bundle, null, 2), {
    encoding: EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Share WeLift bundle",
      UTI: "public.json",
    });
  }
}

export async function pickWeliftBundle(): Promise<WeliftBundle | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "public.json", "*/*"],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const uri = result.assets[0].uri;
  const raw = await readAsStringAsync(uri, {
    encoding: EncodingType.UTF8,
  });
  const data = JSON.parse(raw) as WeliftBundle;
  if (data.type !== "welift/v1" || !data.profile?.id) {
    throw new Error("Not a valid .welift file");
  }
  return data;
}

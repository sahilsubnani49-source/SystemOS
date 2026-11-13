import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/** Let the user pick a plan file (.json); returns its text, or null if they cancelled. */
export async function pickPlanFile(): Promise<{ name: string; text: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    // Android often labels .json as text/plain or octet-stream, so allow anything and let the parser judge.
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  return { name: asset.name, text: await new File(asset.uri).text() };
}

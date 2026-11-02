import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/** Let the user pick a planner file; returns its text, or null if they cancelled. */
export async function pickPlannerFile(): Promise<{ name: string; text: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['text/markdown', 'text/x-markdown', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  return { name: asset.name, text: await new File(asset.uri).text() };
}

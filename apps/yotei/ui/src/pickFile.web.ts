import * as DocumentPicker from 'expo-document-picker';

/** Web: the picker hands back a browser File object; read it directly. */
export async function pickPlannerFile(): Promise<{ name: string; text: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['.md', 'text/markdown', 'text/plain'], multiple: false });
  if (res.canceled || !res.assets?.[0]) return null;
  const asset = res.assets[0];
  const text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  return { name: asset.name, text };
}

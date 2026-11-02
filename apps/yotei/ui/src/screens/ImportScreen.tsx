import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useYotei, useYoteiApi } from '../state/context';
import { Button } from '../components/ui';
import { pickPlannerFile } from '../pickFile';
import { C, S } from '../theme';

/** Paste a planner or pick a .md file, then let the LLM structure it (and code verify it). */
export function ImportScreen() {
  const api = useYoteiApi();
  const text = useYotei((s) => s.importText);
  const name = useYotei((s) => s.importName);
  const analyzing = useYotei((s) => s.analyzing);

  const pick = async () => {
    try {
      const file = await pickPlannerFile();
      if (file) api.getState().setImportText(file.text, file.name);
    } catch (e) {
      api.setState({ error: `Could not open that file: ${e instanceof Error ? e.message : String(e)}` });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Import a planner</Text>
      <Text style={styles.p}>
        Yotei uses your planner exactly as written. Every task shown later is a word-for-word line from it, and every
        date comes from what it says. It must state a time limit (hours, days, weeks, months or years).
      </Text>
      <View style={styles.row}>
        <Button label="Pick .md file" tone="plain" onPress={pick} testID="pick-file" style={{ flex: 1 }} />
        {text ? (
          <Button label="Clear" tone="plain" onPress={() => api.getState().setImportText('')} style={{ flex: 1 }} />
        ) : null}
      </View>
      {name ? <Text style={styles.file}>📄 {name}</Text> : null}
      <TextInput
        testID="planner-input"
        value={text}
        onChangeText={(t) => api.getState().setImportText(t, name)}
        multiline
        placeholder={'…or paste the planner here\n\n# 12-week plan\n## Week 1\n- …'}
        placeholderTextColor={C.dim}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        textAlignVertical="top"
      />
      <Text style={styles.count}>{text.length.toLocaleString()} / 60,000 characters</Text>
      {analyzing ? (
        <View style={styles.row}>
          <ActivityIndicator color={C.accent} />
          <Text style={styles.p}>Reading the planner… (long planners take a minute)</Text>
        </View>
      ) : (
        <Button
          label="Analyze planner"
          onPress={() => void api.getState().analyze()}
          disabled={!text.trim() || text.length > 60_000}
          testID="analyze"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120, gap: S.md },
  h1: { color: C.text, fontSize: 22, fontWeight: '700' },
  p: { color: C.dim, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  row: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  file: { color: C.text, fontSize: 13 },
  input: {
    minHeight: 260,
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 10,
    color: C.text,
    padding: S.md,
    fontSize: 14,
    fontFamily: undefined,
  },
  count: { color: C.dim, fontSize: 12, textAlign: 'right' },
});

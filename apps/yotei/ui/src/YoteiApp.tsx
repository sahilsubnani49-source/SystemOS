import React, { useEffect, useMemo, useRef } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createYoteiState, type Screen } from './state/yoteiStore';
import { YoteiStoreProvider, useYotei, useYoteiApi } from './state/context';
import { createYoteiStore } from './storage/store';
import { TodayScreen } from './screens/TodayScreen';
import { WeekScreen } from './screens/WeekScreen';
import { YearScreen } from './screens/YearScreen';
import { AddScreen } from './screens/AddScreen';
import { PlansScreen, SourceScreen } from './screens/PlansScreen';
import { C, S } from './theme';
import type { YoteiAppProps, YoteiDiagnostic } from './types';

/** How often "now" is re-read: the views roll over at hour/day/week boundaries by themselves. */
const TICK_MS = 30_000;

export function YoteiApp({ onExit, onDiagnostic, databaseName = 'yotei.db' }: YoteiAppProps) {
  // Host callbacks may change identity every render: read them through a ref so the
  // store is created exactly once per database.
  const diagRef = useRef(onDiagnostic);
  diagRef.current = onDiagnostic;

  const store = useMemo(
    () =>
      createYoteiState({
        store: createYoteiStore(databaseName),
        report: (e: YoteiDiagnostic) => diagRef.current?.(e),
      }),
    [databaseName],
  );

  useEffect(() => {
    void store.getState().boot();
    const t = setInterval(() => store.getState().tick(), TICK_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') store.getState().tick();
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [store]);

  return (
    <SafeAreaProvider>
      <YoteiStoreProvider value={store}>
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
          <Shell onExit={onExit} />
        </SafeAreaView>
      </YoteiStoreProvider>
    </SafeAreaProvider>
  );
}

function Shell({ onExit }: { onExit?: () => void }) {
  const screen = useYotei((s) => s.screen);
  const error = useYotei((s) => s.error);
  const api = useYoteiApi();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.top}>
        <Text style={styles.brand}>
          <Text style={{ color: C.accent }}>予定</Text> Yotei
        </Text>
        {onExit ? (
          <Pressable onPress={onExit} accessibilityRole="button" hitSlop={12} testID="yotei-exit">
            <Text style={styles.exit}>Close</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Pressable onPress={() => api.getState().clearError()} style={styles.error} testID="yotei-error">
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorDismiss}>tap to dismiss</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Body screen={screen} />
      </View>
      <Nav screen={screen} />
    </View>
  );
}

function Body({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'loading':
      return null;
    case 'today':
      return <TodayScreen />;
    case 'week':
      return <WeekScreen />;
    case 'year':
      return <YearScreen />;
    case 'plans':
      return <PlansScreen />;
    case 'source':
      return <SourceScreen />;
    case 'add':
      return <AddScreen />;
  }
}

const TABS: { key: Screen; label: string; glyph: string }[] = [
  { key: 'today', label: 'Today', glyph: '◉' },
  { key: 'week', label: 'Week', glyph: '▤' },
  { key: 'year', label: 'Year', glyph: '▦' },
  { key: 'plans', label: 'Plans', glyph: '☰' },
  { key: 'add', label: 'Add', glyph: '＋' },
];

function Nav({ screen }: { screen: Screen }) {
  const api = useYoteiApi();
  if (screen === 'loading') return null;
  return (
    <SafeAreaView edges={['bottom']} style={styles.nav}>
      {TABS.map((t) => {
        const on = screen === t.key || (t.key === 'plans' && screen === 'source');
        return (
          <Pressable
            key={t.key}
            testID={`tab-${t.key}`}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            onPress={() => api.getState().go(t.key)}
            style={styles.tab}
          >
            <Text style={[styles.glyph, on && { color: C.accent }]}>{t.glyph}</Text>
            <Text style={[styles.tabText, on && { color: C.accent }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
  },
  brand: { color: C.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  exit: { color: C.accent, fontSize: 15 },
  error: { backgroundColor: '#3A1D1D', marginHorizontal: S.lg, borderRadius: 8, padding: S.md },
  errorText: { color: C.text, fontSize: 13, lineHeight: 18 },
  errorDismiss: { color: C.dim, fontSize: 11, marginTop: 4 },
  nav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.surface,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 8, gap: 2 },
  glyph: { color: C.dim, fontSize: 16 },
  tabText: { color: C.dim, fontSize: 12, fontWeight: '600' },
});

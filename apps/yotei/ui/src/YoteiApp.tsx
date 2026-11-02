import React, { useEffect, useMemo, useRef } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createYoteiState, type Screen } from './state/yoteiStore';
import { YoteiStoreProvider, useYotei, useYoteiApi } from './state/context';
import { createYoteiStore } from './storage/store';
import { NowScreen } from './screens/NowScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { PlansScreen, SourceScreen } from './screens/PlansScreen';
import { C, S } from './theme';
import type { YoteiAppProps, YoteiDiagnostic } from './types';

/** How often "now" is re-read: the view rolls over at hour/day/week boundaries by itself. */
const TICK_MS = 30_000;

export function YoteiApp({ parsePlan, onExit, onDiagnostic, databaseName = 'yotei.db' }: YoteiAppProps) {
  // Host callbacks may change identity every render: read them through refs so the
  // store is created exactly once per database.
  const parseRef = useRef(parsePlan);
  parseRef.current = parsePlan;
  const diagRef = useRef(onDiagnostic);
  diagRef.current = onDiagnostic;

  const store = useMemo(
    () =>
      createYoteiState({
        store: createYoteiStore(databaseName),
        parsePlan: (md) => parseRef.current(md),
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
        <Text style={styles.brand}>予定 Yotei</Text>
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
    case 'now':
      return <NowScreen />;
    case 'import':
      return <ImportScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'plans':
      return <PlansScreen />;
    case 'source':
      return <SourceScreen />;
  }
}

const TABS: { key: Screen; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: 'plans', label: 'Plans' },
  { key: 'import', label: '+ Import' },
];

function Nav({ screen }: { screen: Screen }) {
  const api = useYoteiApi();
  if (screen === 'review' || screen === 'loading') return null;
  return (
    <SafeAreaView edges={['bottom']} style={styles.nav}>
      {TABS.map((t) => {
        const on = screen === t.key || (t.key === 'plans' && screen === 'source');
        return (
          <Pressable
            key={t.key}
            testID={`tab-${t.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => api.getState().go(t.key)}
            style={styles.tab}
          >
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { color: C.dim, fontSize: 14, fontWeight: '600' },
});

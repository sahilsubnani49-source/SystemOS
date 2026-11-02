import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { createGameStore } from './state/gameStore';
import { GameStoreProvider, useGame, useGameApi } from './state/context';
import { createSaveStore } from './storage/saveStore';
import { TitleScreen } from './screens/TitleScreen';
import { HeroSelectScreen } from './screens/HeroSelectScreen';
import { WorldScreen } from './screens/WorldScreen';
import { BattleScreen } from './battle/BattleScreen';
import { C } from './theme';
import type { GameDiagnostic, KotodamaGameProps } from './types';

export function GameRoot({ onExit, onStudySession, onDiagnostic, databaseName = 'kotodama.db' }: KotodamaGameProps) {
  // The callback may change identity on every host render; read it through a ref
  // so the store (and the whole game) is created exactly once per database.
  const reportRef = useRef(onStudySession);
  reportRef.current = onStudySession;
  const diagnosticRef = useRef(onDiagnostic);
  diagnosticRef.current = onDiagnostic;
  const store = useMemo(
    () =>
      createGameStore({
        storage: createSaveStore(databaseName),
        onStudySession: (r) => reportRef.current?.(r),
        onDiagnostic: (e) => diagnosticRef.current?.(e),
      }),
    [databaseName],
  );
  const [fontsLoaded] = useFonts({ DotGothic16_400Regular, PressStart2P_400Regular });

  useEffect(() => {
    void store.getState().boot();
    // Backgrounding = the session might end here: save, and report study time.
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        void store.getState().persist();
        store.getState().flushSession();
      }
    });
    return () => {
      sub.remove();
      void store.getState().persist();
      store.getState().flushSession();
    };
  }, [store]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    // Own SafeAreaProvider: the game must not depend on what the host app provides.
    <SafeAreaProvider>
      <GameStoreProvider value={store}>
        <View style={styles.root}>
          <GameErrorBoundary report={(e) => diagnosticRef.current?.(e)} onExit={onExit}>
            <Router onExit={onExit} />
          </GameErrorBoundary>
        </View>
      </GameStoreProvider>
    </SafeAreaProvider>
  );
}

function Router({ onExit }: { onExit?: () => void }) {
  const screen = useGame((s) => s.screen);
  const api = useGameApi();
  const exit = onExit
    ? () => {
        void api.getState().persist();
        api.getState().flushSession();
        onExit();
      }
    : undefined;
  switch (screen) {
    case 'boot':
      return <View style={styles.loading} />;
    case 'title':
      return <TitleScreen onExit={exit} />;
    case 'heroSelect':
      return <HeroSelectScreen />;
    case 'world':
      return <WorldScreen onExit={exit} />;
    case 'battle':
      return <BattleScreen />;
  }
}

/**
 * A render error inside the game must not take down the host app. Report it, then
 * offer a retry (re-mounts the screens; the store and save are untouched) or an exit.
 */
class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; report: (e: GameDiagnostic) => void; onExit?: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const componentStack = (info.componentStack ?? '').trim().split('\n').slice(0, 6).join(' <- ');
    this.props.report({ level: 'error', message: 'Game render error', data: { name: error.name, error: error.message, componentStack } });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.loading}>
        <Text style={styles.crashTitle}>The scroll tore.</Text>
        <Text style={styles.crashBody}>{this.state.error.message}</Text>
        <Pressable onPress={() => this.setState({ error: null })} style={styles.crashBtn} accessibilityRole="button">
          <Text style={styles.crashBtnText}>TRY AGAIN</Text>
        </Pressable>
        {this.props.onExit ? (
          <Pressable onPress={this.props.onExit} style={styles.crashBtn} accessibilityRole="button">
            <Text style={styles.crashBtnText}>LEAVE</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  crashTitle: { color: C.gold, fontSize: 18, marginBottom: 8 },
  crashBody: { color: C.paper, fontSize: 12, textAlign: 'center', marginHorizontal: 32, marginBottom: 16 },
  crashBtn: { borderColor: C.gold, borderWidth: 2, borderRadius: 6, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
  crashBtnText: { color: C.gold, fontSize: 12 },
  loading: { flex: 1, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
});

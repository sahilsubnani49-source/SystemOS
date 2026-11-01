import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
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
import type { KotodamaGameProps } from './types';

export function GameRoot({ onExit, onStudySession, databaseName = 'kotodama.db' }: KotodamaGameProps) {
  // The callback may change identity on every host render; read it through a ref
  // so the store (and the whole game) is created exactly once per database.
  const reportRef = useRef(onStudySession);
  reportRef.current = onStudySession;
  const store = useMemo(
    () => createGameStore({ storage: createSaveStore(databaseName), onStudySession: (r) => reportRef.current?.(r) }),
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
          <Router onExit={onExit} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  loading: { flex: 1, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
});

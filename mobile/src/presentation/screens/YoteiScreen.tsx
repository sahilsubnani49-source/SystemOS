import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { YoteiApp, type YoteiDiagnostic } from '@yotei/ui';
import { draftFromWire } from '@yotei/core';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { Monitor } from '../../data/services/MonitorService';
import { usePlayerStore } from '../stores/usePlayerStore';

/**
 * Host for Yotei (apps/yotei). Yotei owns its own screens and database (yotei.db);
 * SystemOS only supplies the planner analysis call (with this session's token) and
 * forwards diagnostics to the System Monitor.
 */
export function YoteiScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const openedAt = Date.now();
    Monitor.log('info', 'lifecycle', 'Yotei opened');
    return () => Monitor.log('info', 'lifecycle', 'Yotei closed', { ms: Date.now() - openedAt });
  }, []);

  const parsePlan = useCallback(async (markdown: string) => {
    const modelPreference = usePlayerStore.getState().player?.modelPreference;
    return draftFromWire(await ApiDataSource.parseYoteiPlan(markdown, modelPreference));
  }, []);

  const onDiagnostic = useCallback((e: YoteiDiagnostic) => {
    Monitor.log(e.level, 'lifecycle', `Yotei: ${e.message}`, e.data);
  }, []);

  return (
    <View style={styles.root}>
      <YoteiApp
        parsePlan={parsePlan}
        onExit={() => navigation.goBack()}
        onDiagnostic={onDiagnostic}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1217' },
});

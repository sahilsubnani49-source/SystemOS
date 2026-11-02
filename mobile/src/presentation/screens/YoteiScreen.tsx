import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { YoteiApp, type YoteiDiagnostic } from '@yotei/ui';
import { Monitor } from '../../data/services/MonitorService';

/**
 * Host for Yotei (apps/yotei). Yotei is fully offline: it owns its own screens and
 * database (yotei.db) and needs nothing from SystemOS but a way to close and a place to
 * send diagnostics (the System Monitor).
 */
export function YoteiScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const openedAt = Date.now();
    Monitor.log('info', 'lifecycle', 'Yotei opened');
    return () => Monitor.log('info', 'lifecycle', 'Yotei closed', { ms: Date.now() - openedAt });
  }, []);

  const onDiagnostic = useCallback((e: YoteiDiagnostic) => {
    Monitor.log(e.level, 'lifecycle', `Yotei: ${e.message}`, e.data);
  }, []);

  return (
    <View style={styles.root}>
      <YoteiApp onExit={() => navigation.goBack()} onDiagnostic={onDiagnostic} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1217' },
});

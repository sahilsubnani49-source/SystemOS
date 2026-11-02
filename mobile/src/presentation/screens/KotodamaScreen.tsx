import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KotodamaGame, type GameDiagnostic, type StudySessionReport } from '@kotodama/game';
import { useTaskLogStore } from '../stores/useTaskLogStore';
import { Monitor } from '../../data/services/MonitorService';

/**
 * Host for the Kotodama game package. The game owns its own world, save file and
 * UI; SystemOS only opens it and receives study sessions back through the bridge.
 */
export function KotodamaScreen() {
  const navigation = useNavigation();

  // System Monitor: how long the game was open (the session reports carry the detail).
  useEffect(() => {
    const openedAt = Date.now();
    Monitor.log('info', 'kotodama', 'Game opened');
    return () => Monitor.log('info', 'kotodama', 'Game closed', { ms: Date.now() - openedAt });
  }, []);

  const onStudySession = useCallback((report: StudySessionReport) => {
    Monitor.log('info', 'kotodama', 'Study session reported', {
      activeMinutes: report.activeMinutes,
      prompts: report.promptsAnswered,
      correct: report.correct,
      mastered: report.itemsMastered.length,
    });
    useTaskLogStore
      .getState()
      .recordJapaneseSession(report)
      .catch((e) => {
        // Study time is a bonus for SystemOS; a failed write must never break the game.
        Monitor.error('kotodama', 'Filing the study session failed', e);
      });
  }, []);

  const onDiagnostic = useCallback((e: GameDiagnostic) => {
    Monitor.log(e.level, 'kotodama', e.message, e.data);
  }, []);

  return (
    <View style={styles.root}>
      <KotodamaGame
        onExit={() => navigation.goBack()}
        onStudySession={onStudySession}
        onDiagnostic={onDiagnostic}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B12' },
});

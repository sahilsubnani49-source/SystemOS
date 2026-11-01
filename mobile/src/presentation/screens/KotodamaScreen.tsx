import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KotodamaGame, type StudySessionReport } from '@kotodama/game';
import { useTaskLogStore } from '../stores/useTaskLogStore';

/**
 * Host for the Kotodama game package. The game owns its own world, save file and
 * UI; SystemOS only opens it and receives study sessions back through the bridge.
 */
export function KotodamaScreen() {
  const navigation = useNavigation();

  const onStudySession = useCallback((report: StudySessionReport) => {
    useTaskLogStore
      .getState()
      .recordJapaneseSession(report)
      .catch(() => {
        // Study time is a bonus for SystemOS; a failed write must never break the game.
      });
  }, []);

  return (
    <View style={styles.root}>
      <KotodamaGame onExit={() => navigation.goBack()} onStudySession={onStudySession} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B12' },
});

import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, FontSize, Spacing, Typography } from '../../core/theme';
import { GatePortal } from '../components/GatePortal';
import type { RootStackParamList } from '../../core/navigation';

/**
 * The Apps tab: launchers for companion apps that run inside SystemOS. Each app owns
 * its own screens and data and reports back through a bridge (Kotodama → Hunter Log).
 * Add new apps as further portals or cards in this list.
 */
export function AppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Apps</Text>
        <Text style={styles.subtitle}>Gates to other worlds. Time spent inside counts.</Text>

        {/* Kotodama, the Japanese-learning RPG (games/kotodama). */}
        <GatePortal onPress={() => navigation.navigate('Kotodama')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    // Keep-out gutter so the title never grows into the top-right corner where
    // the on-device overlay hovers (matches the Dashboard header).
    paddingRight: 52,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
});

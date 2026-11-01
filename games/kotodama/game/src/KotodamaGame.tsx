import React from 'react';
import { Text, View } from 'react-native';
import type { KotodamaGameProps } from './types';

// Temporary shell — replaced by the real game root as the engine lands.
export function KotodamaGame(_props: KotodamaGameProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Kotodama</Text>
    </View>
  );
}

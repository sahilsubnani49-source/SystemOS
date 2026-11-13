import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YoteiApp } from '@yotei/ui';

/**
 * The standalone Yotei app: the shared @yotei/ui package, fully offline. Plans are JSON
 * the user brings (from any AI) and live only in this app's own yotei.db.
 */
export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F1217' }}>
      <StatusBar style="light" />
      <YoteiApp />
    </View>
  );
}

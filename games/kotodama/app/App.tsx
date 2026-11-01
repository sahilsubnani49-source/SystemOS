import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { KotodamaGame } from '@kotodama/game';

/** The standalone Kotodama app is nothing but a host for the shared game package. */
export default function App() {
  return (
    <>
      <StatusBar style="light" hidden />
      <KotodamaGame />
    </>
  );
}

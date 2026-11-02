import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { YoteiApp } from '@yotei/ui';
import { SignedOutError, parsePlan } from './src/api';
import { SignIn } from './src/SignIn';
import { Tokens } from './src/tokens';

/**
 * The standalone Yotei app: a SystemOS sign-in in front of the shared @yotei/ui
 * package. Plans live in this app's own yotei.db; only the planner analysis goes to
 * the SystemOS backend.
 */
export default function App() {
  const [status, setStatus] = useState<'unknown' | 'in' | 'out'>('unknown');

  useEffect(() => {
    Tokens.get()
      .then((t) => setStatus(t.access ? 'in' : 'out'))
      .catch(() => setStatus('out'));
  }, []);

  const parse = useCallback(async (md: string) => {
    try {
      return await parsePlan(md);
    } catch (e) {
      if (e instanceof SignedOutError) setStatus('out');
      throw e;
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F1217' }}>
      <StatusBar style="light" />
      {status === 'in' ? <YoteiApp parsePlan={parse} /> : null}
      {status === 'out' ? <SignIn onSignedIn={() => setStatus('in')} /> : null}
    </View>
  );
}

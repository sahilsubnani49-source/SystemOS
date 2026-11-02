import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { signIn } from './api';

/** Yotei uses your SystemOS account: the planner is analysed by the SystemOS backend. */
export function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>予定 Yotei</Text>
      <Text style={styles.p}>Sign in with your SystemOS account. Your plans stay on this device.</Text>
      <TextInput
        testID="email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#8B93A1"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        testID="password"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8B93A1"
        secureTextEntry
        style={styles.input}
        onSubmitEditing={submit}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable testID="sign-in" onPress={submit} disabled={busy || !email || !password} style={styles.btn}>
        {busy ? <ActivityIndicator color="#0F1217" /> : <Text style={styles.btnText}>Sign in</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0F1217', padding: 24, justifyContent: 'center', gap: 12 },
  brand: { color: '#E8EAED', fontSize: 28, fontWeight: '700' },
  p: { color: '#8B93A1', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  input: {
    backgroundColor: '#171B22',
    borderColor: '#2A313D',
    borderWidth: 1,
    borderRadius: 10,
    color: '#E8EAED',
    padding: 14,
    fontSize: 15,
  },
  error: { color: '#E5534B', fontSize: 13 },
  btn: { backgroundColor: '#6CC6A9', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#0F1217', fontSize: 15, fontWeight: '700' },
});

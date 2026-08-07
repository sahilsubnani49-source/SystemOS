import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Colors,
  FontSize,
  Fonts,
  Radius,
  Spacing,
  Shadow,
  Typography,
  withAlpha,
} from '../../core/theme';
import { useAuthStore } from '../stores/useAuthStore';
import type { RootStackParamList } from '../../core/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

const MIN_PASSWORD_LENGTH = 8;

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { signup, loading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = () => {
    if (loading) return;
    // Client-side gate before hitting the backend's 422.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(
        `[Registration Denied.] Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }
    setLocalError(null);
    clearError();
    const trimmedName = name.trim();
    signup(email.trim(), password, trimmedName.length > 0 ? trimmedName : undefined);
  };

  const goToLogin = () => {
    setLocalError(null);
    clearError();
    navigation.navigate('Login');
  };

  const shownError = localError ?? error;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>SYSTEM OS</Text>
          <Text style={styles.subtitle}>[Hunter Registration.]</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sung Jin-Woo"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="hunter@example.com"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType="newPassword"
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {shownError ? <Text style={styles.error}>{shownError}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, !canSubmit && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.btnText}>{loading ? 'Registering...' : 'Register Hunter'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.link} onPress={goToLogin}>
            <Text style={styles.linkText}>Already registered? Enter the System.</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    color: Colors.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  label: {
    ...Typography.label,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  error: {
    color: Colors.error,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 16,
    marginTop: Spacing.xs,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
  },
  link: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  linkText: {
    color: withAlpha(Colors.accent, 0.9),
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
});

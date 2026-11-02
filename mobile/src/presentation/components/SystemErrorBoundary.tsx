import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Fonts } from '../../core/theme';
import { Monitor } from '../../data/services/MonitorService';

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere under the navigator, records them in the System
 * Monitor (with the component stack), and shows a recoverable System screen instead
 * of a white screen. RETRY re-mounts the tree.
 */
export class SystemErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // First few frames of the component stack say which screen broke; that's enough.
    const componentStack = (info.componentStack ?? '').trim().split('\n').slice(0, 6).join(' <- ');
    Monitor.error('error', 'Render error', error, { componentStack });
    void Monitor.flush();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>[System Error.]</Text>
        <Text style={styles.body}>{this.state.error.message}</Text>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
          onPress={() => this.setState({ error: null })}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>RETRY</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { color: Colors.error, fontFamily: Fonts.pixel, fontSize: FontSize.md, letterSpacing: 2 },
  body: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  btn: {
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  btnText: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
});

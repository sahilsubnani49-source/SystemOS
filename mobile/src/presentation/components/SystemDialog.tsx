import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';

/**
 * Solo Leveling styled replacement for React Native's native `Alert.alert`.
 *
 * A single styled panel lives at the app root; screens raise dialogs imperatively
 * through {@link useSystemDialog}, so every System-generated prompt — campaign
 * forged, SCRAM warning, dungeon report, reward redeemed — shares one look instead
 * of falling back to the grey OS alert box. Mirrors the aesthetic of
 * {@link SystemNoticeModal}: dark backdrop, glowing accent border, pixel font.
 */

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void;
}

/** 'warning' tints the panel red (SCRAM, abandon, penalties); 'system' uses accent cyan. */
export type DialogTone = 'system' | 'warning';

interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
  tone: DialogTone;
}

type SystemAlert = (
  title: string,
  message?: string,
  buttons?: DialogButton[],
  tone?: DialogTone,
) => void;

const SystemDialogContext = createContext<SystemAlert | null>(null);

/**
 * Infer tone from the title so existing `[Warning]` / penalty prompts glow red
 * without every call site having to pass it explicitly.
 */
function inferTone(title: string): DialogTone {
  const t = title.toLowerCase();
  return /warning|penalty|scram|abandon/.test(t) ? 'warning' : 'system';
}

export function SystemDialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const systemAlert = useCallback<SystemAlert>((title, message, buttons, tone) => {
    setRequest({
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'ACCEPT' }],
      tone: tone ?? inferTone(title),
    });
  }, []);

  const handlePress = useCallback((button: DialogButton) => {
    setRequest(null);
    button.onPress?.();
  }, []);

  const value = useMemo(() => systemAlert, [systemAlert]);

  const accent = request?.tone === 'warning' ? Colors.error : Colors.accent;

  return (
    <SystemDialogContext.Provider value={value}>
      {children}
      <Modal
        visible={request !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRequest(null)}
      >
        <View style={styles.backdrop}>
          {request && (
            <View style={[styles.panel, { borderColor: accent, ...Shadow.glow(accent) }]}>
              <Text style={[styles.alertIcon, { color: accent, borderColor: accent }]}>!</Text>
              <Text style={[styles.header, { color: accent }]}>{request.title}</Text>

              {request.message ? <Text style={styles.body}>{request.message}</Text> : null}

              <View style={styles.buttonRow}>
                {request.buttons.map((button, i) => {
                  const visual = buttonVisual(button.style, request.tone);
                  return (
                    <Pressable
                      key={`${button.text}-${i}`}
                      style={[
                        styles.button,
                        { borderColor: visual.borderColor, backgroundColor: visual.background },
                      ]}
                      onPress={() => handlePress(button)}
                    >
                      <Text style={[styles.buttonText, { color: visual.textColor }]}>
                        {button.text.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SystemDialogContext.Provider>
  );
}

/** Imperative accessor mirroring `Alert.alert(title, message?, buttons?)`. */
export function useSystemDialog(): SystemAlert {
  const ctx = useContext(SystemDialogContext);
  if (!ctx) {
    throw new Error('useSystemDialog must be used within a SystemDialogProvider');
  }
  return ctx;
}

interface ButtonVisual {
  borderColor: string;
  textColor: string;
  background: string;
}

/**
 * Map a button's semantic style to its Solo Leveling visual treatment.
 * `tone` is the panel's overall tone so a default button on a warning panel can
 * read as the "safe" choice while the destructive action stays red.
 */
function buttonVisual(style: DialogButtonStyle | undefined, tone: DialogTone): ButtonVisual {
  if (style === 'destructive') {
    return {
      borderColor: Colors.error,
      textColor: Colors.error,
      background: withAlpha(Colors.error, 0.1),
    };
  }
  if (style === 'cancel') {
    return {
      borderColor: Colors.textSecondary,
      textColor: Colors.textSecondary,
      background: 'transparent',
    };
  }
  const accent = tone === 'warning' ? Colors.error : Colors.accent;
  return { borderColor: accent, textColor: accent, background: withAlpha(accent, 0.1) };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.75),
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  alertIcon: {
    fontFamily: Fonts.pixel,
    fontSize: 28,
    borderWidth: 2,
    borderRadius: Radius.full,
    width: 56,
    height: 56,
    textAlign: 'center',
    lineHeight: 52,
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    lineHeight: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
  },
});

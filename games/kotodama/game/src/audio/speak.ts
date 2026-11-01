import * as Speech from 'expo-speech';

/**
 * Pronounce Japanese. Uses the device's ja-JP voice (iOS/Android ship one; on web
 * it depends on the browser). Silently does nothing if no voice is available.
 */
export function speakJa(text: string) {
  try {
    Speech.stop();
    Speech.speak(text, { language: 'ja-JP', rate: 0.85 });
  } catch {
    // no TTS engine
  }
}

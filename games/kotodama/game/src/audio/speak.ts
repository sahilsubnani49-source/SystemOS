import * as Speech from 'expo-speech';
import { duckMusic } from './music';
import { speakNeural, stopNeural } from './neural';

// Pronouncing Japanese with the device's own text-to-speech. There is no bundled
// voice: the phone (or browser) supplies them, and what it picks by default for
// "ja-JP" is often its smallest, most robotic one. So this module lists the
// Japanese voices that are installed, ranks them, and asks for the best by id.
// The player can override the choice in the menu (System tab).
//
// Everything here fails quietly: a device with no Japanese voice stays silent.

export type JaVoice = Pick<Speech.Voice, 'identifier' | 'name' | 'language' | 'quality'>;

const NORMAL_RATE = 0.85;
/** A second tap on the same text replays it slowly, for hearing each mora. */
const SLOW_RATE = 0.55;
const REPLAY_WINDOW_MS = 8000;

/** Apple's "Eloquence" novelty voices: listed for Japanese, and very robotic. */
const NOVELTY = /eloquence|\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;

/**
 * How good a voice is likely to sound, from what its id and name give away.
 * iOS ids look like `com.apple.voice.premium.ja-JP.Kyoko`, Android's like
 * `ja-jp-x-jab-local`, and a browser's name like `Google 日本語`.
 */
export function scoreVoice(v: JaVoice): number {
  const s = `${v.identifier} ${v.name}`.toLowerCase();
  let score = 0;
  if (s.includes('premium')) score += 100;
  else if (/natural|neural/.test(s)) score += 80;
  else if (s.includes('enhanced') || v.quality === Speech.VoiceQuality.Enhanced) score += 60;
  if (s.includes('siri')) score += 40;
  if (s.includes('google')) score += 30;
  if (s.includes('compact')) score -= 20;
  // Android offers each voice twice. The network one needs a connection and says
  // nothing without it, so the on-device copy wins: this game is played offline.
  if (s.includes('-local')) score += 10;
  if (s.includes('-network')) score -= 10;
  if (NOVELTY.test(s)) score -= 200;
  return score;
}

let voices: JaVoice[] | null = null;
let loading: Promise<JaVoice[]> | null = null;
let preferredId: string | undefined;

/** The installed Japanese voices, best first. Empty when the device has none. */
export function loadJaVoices(): Promise<JaVoice[]> {
  if (voices) return Promise.resolve(voices);
  loading ??= Speech.getAvailableVoicesAsync()
    .then((all) => {
      const ja = all
        .filter((v) => /^ja\b/i.test(v.language.replace('_', '-')))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name));
      // Browsers fill their voice list late: an empty answer is not final.
      if (ja.length > 0) voices = ja;
      return ja;
    })
    .catch(() => [])
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** The player's own pick (a voice id), or undefined to use the best one found. */
export function setPreferredVoice(id: string | undefined) {
  preferredId = id;
}

/** The voice the next line will be spoken in, once the list has loaded. */
export function currentVoice(): JaVoice | undefined {
  return voices?.find((v) => v.identifier === preferredId) ?? voices?.[0];
}

let last = { text: '', at: 0, slow: false };

/**
 * Pronounce Japanese, with the neural voice when it is installed and can read
 * the line, otherwise with the device voice. Asking for the same text again within a few seconds plays
 * it slowly, then at normal speed again, and so on.
 */
export function speakJa(text: string) {
  const now = Date.now();
  const slow = text === last.text && now - last.at < REPLAY_WINDOW_MS && !last.slow;
  last = { text, at: now, slow };
  stopNeural();
  // The music steps back for roughly as long as the line takes to say.
  duckMusic(Math.min(15000, (700 + [...text].length * 190) * (slow ? 1.6 : 1)));
  const viaDevice = () => {
    try {
      if (!voices) void loadJaVoices();
      // Until the list has loaded, the language alone still gets a Japanese voice.
      Speech.speak(text, { language: 'ja-JP', voice: currentVoice()?.identifier, rate: slow ? SLOW_RATE : NORMAL_RATE });
    } catch {
      // no TTS engine
    }
  };
  try {
    void Speech.stop();
    // The neural voice takes kana lines when its model is installed; it hands back
    // anything it cannot read, or fails on, to the device voice.
    if (!speakNeural(text, slow, viaDevice)) viaDevice();
  } catch {
    // no TTS engine
  }
}

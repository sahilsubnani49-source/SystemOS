import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { kokoroTokens } from '@kotodama/core';

// The neural voice: Kokoro-82M, an open-weight (Apache-2.0) speech model, run on
// the phone with ONNX Runtime. Nothing is sent anywhere; the only network use is
// the one-time download of the model, which the player starts from the menu.
//
// It speaks kana only. `kokoroTokens` (in @kotodama/core) turns a line into the
// model's phoneme tokens, or says it cannot; then this module declines the line
// and the device voice reads it instead. A line that fails here for any other
// reason is also handed back, so the game is never silent because of this file.
//
// Each finished line is kept as a small WAV in the cache folder, so the second
// time a word is heard there is no wait at all.

const REPO = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main';
/** 8-bit quantized weights: the smallest build that takes ordinary float inputs. */
const MODEL_URL = `${REPO}/onnx/model_quantized.onnx`;
/** jf_alpha: the Japanese voice with the most training data. */
const VOICE_URL = `${REPO}/voices/jf_alpha.bin`;
export const NEURAL_DOWNLOAD_MB = 93;
/** A finished model file is far larger than this; anything smaller is a broken download. */
const MODEL_MIN_BYTES = 80_000_000;

const SAMPLE_RATE = 24000;
const STYLE_DIM = 256;
const NORMAL_SPEED = 1;
const SLOW_SPEED = 0.7;

export type NeuralStatus =
  | { state: 'unsupported'; reason: string }
  | { state: 'absent' }
  | { state: 'downloading'; progress: number }
  | { state: 'ready' }
  | { state: 'error'; message: string };

let status: NeuralStatus = { state: 'absent' };
const listeners = new Set<(s: NeuralStatus) => void>();

function setStatus(next: NeuralStatus) {
  status = next;
  listeners.forEach((fn) => fn(next));
}

export const neuralStatus = () => status;

export function subscribeNeural(fn: (s: NeuralStatus) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── Files ──────────────────────────────────────────────────────────────
const home = () => new Directory(Paths.document, 'kotodama-voice');
const modelFile = () => new File(home(), 'kokoro-q8.onnx');
const voiceFile = () => new File(home(), 'jf_alpha.bin');
const clipDir = () => new Directory(Paths.cache, 'kotodama-voice-clips');

const installed = () => {
  const model = modelFile();
  return model.exists && (model.size ?? 0) > MODEL_MIN_BYTES && voiceFile().exists;
};

// ── ONNX Runtime ───────────────────────────────────────────────────────
type Ort = typeof import('onnxruntime-react-native');

/**
 * Required lazily: importing the package calls into native code at once, and
 * throws in a build made before the native module was added.
 */
function loadOrt(): Ort | null {
  try {
    return require('onnxruntime-react-native') as Ort;
  } catch {
    return null;
  }
}

let session: Promise<import('onnxruntime-react-native').InferenceSession> | null = null;
let voice: Float32Array | null = null;

/** ONNX Runtime takes a plain path, not a file:// address. */
const plainPath = (uri: string) => decodeURI(uri.replace(/^file:\/\//, ''));

/** Look for an installed model. Call once at startup; cheap, no network. */
export function initNeural() {
  if (status.state === 'downloading') return;
  try {
    if (!loadOrt()) {
      setStatus({ state: 'unsupported', reason: 'This build of the app does not include the neural voice engine yet.' });
      return;
    }
    setStatus(installed() ? { state: 'ready' } : { state: 'absent' });
  } catch (e) {
    setStatus({ state: 'error', message: errorText(e) });
  }
}

/** Fetch the model and the voice. Safe to call again after a failure. */
export async function downloadNeural(): Promise<void> {
  if (status.state === 'downloading' || status.state === 'unsupported') return;
  setStatus({ state: 'downloading', progress: 0 });
  try {
    home().create({ intermediates: true, idempotent: true });
    await File.downloadFileAsync(VOICE_URL, voiceFile(), { idempotent: true });
    // Download under another name, so a half-finished file is never taken for the model.
    const part = new File(home(), 'kokoro-q8.onnx.part');
    await File.downloadFileAsync(MODEL_URL, part, {
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) => {
        if (totalBytes > 0) setStatus({ state: 'downloading', progress: bytesWritten / totalBytes });
      },
    });
    if ((part.size ?? 0) < MODEL_MIN_BYTES) throw new Error('The download was incomplete.');
    if (modelFile().exists) modelFile().delete();
    part.move(modelFile());
    setStatus({ state: 'ready' });
  } catch (e) {
    setStatus({ state: 'error', message: errorText(e) });
  }
}

/** Remove the model, the voice and every cached line. */
export function deleteNeural() {
  session = null;
  voice = null;
  try {
    if (home().exists) home().delete();
    if (clipDir().exists) clipDir().delete();
    setStatus({ state: 'absent' });
  } catch (e) {
    setStatus({ state: 'error', message: errorText(e) });
  }
}

async function synthesize(ids: number[], speed: number): Promise<Float32Array> {
  const ort = loadOrt();
  if (!ort) throw new Error('ONNX Runtime is not available.');
  session ??= ort.InferenceSession.create(plainPath(modelFile().uri));
  // A failed load must not be remembered, or every later line would fail the same way.
  const model = await session.catch((e) => {
    session = null;
    throw e;
  });
  voice ??= new Float32Array((await voiceFile().bytes()).buffer);

  // The voice file holds one style vector per input length; pick this line's.
  const tokenCount = Math.min(Math.max(ids.length - 2, 0), voice.length / STYLE_DIM - 1);
  const style = voice.slice(tokenCount * STYLE_DIM, (tokenCount + 1) * STYLE_DIM);

  const out = await model.run({
    input_ids: new ort.Tensor('int64', BigInt64Array.from(ids, (id) => BigInt(id)), [1, ids.length]),
    style: new ort.Tensor('float32', style, [1, STYLE_DIM]),
    speed: new ort.Tensor('float32', Float32Array.of(speed), [1]),
  });
  const wave = out[model.outputNames[0] as string]?.data;
  if (!(wave instanceof Float32Array) || wave.length === 0) throw new Error('The model returned no audio.');
  return wave;
}

/** Mono 16-bit PCM WAV: the simplest container every audio player opens. */
function toWav(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] as number));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return bytes;
}

/** FNV-1a over the token ids: a stable file name for a line's cached audio. */
function clipName(ids: number[], slow: boolean): string {
  let h = 0x811c9dc5;
  for (const id of ids) h = Math.imul(h ^ id, 0x01000193);
  return `${(h >>> 0).toString(16)}-${ids.length}${slow ? '-slow' : ''}.wav`;
}

let player: AudioPlayer | null = null;
/** Only the newest request is played; an older line that finishes late stays quiet. */
let latest = 0;

export function stopNeural() {
  latest++;
  try {
    player?.pause();
  } catch {
    // the player may already be gone
  }
}

/**
 * Speak a line with the neural voice. Returns false at once when this line is
 * not for it (no model, or text it cannot read). If it accepts the line and then
 * fails, `onFail` is called so the caller can use the device voice.
 */
export function speakNeural(text: string, slow: boolean, onFail: () => void): boolean {
  if (status.state !== 'ready') return false;
  const ids = kokoroTokens(text);
  if (!ids) return false;

  const mine = ++latest;
  void (async () => {
    try {
      clipDir().create({ intermediates: true, idempotent: true });
      const clip = new File(clipDir(), clipName(ids, slow));
      if (!clip.exists) {
        const wav = toWav(await synthesize(ids, slow ? SLOW_SPEED : NORMAL_SPEED));
        clip.create({ overwrite: true });
        clip.write(wav);
      }
      if (mine !== latest) return;
      player ??= createAudioPlayer(null);
      player.replace({ uri: clip.uri });
      player.play();
    } catch {
      if (mine === latest) onFail();
    }
  })();
  return true;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

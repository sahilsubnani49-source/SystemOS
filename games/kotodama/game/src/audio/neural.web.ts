// Web build: the neural voice runs on phones only (it needs ONNX Runtime's native
// module and the device file system). The browser keeps using its own voices.
// Same exports as neural.ts.

export const NEURAL_DOWNLOAD_MB = 93;

export type NeuralStatus =
  | { state: 'unsupported'; reason: string }
  | { state: 'absent' }
  | { state: 'downloading'; progress: number }
  | { state: 'ready' }
  | { state: 'error'; message: string };

const status: NeuralStatus = { state: 'unsupported', reason: 'The neural voice runs in the phone app only.' };

export const neuralStatus = (): NeuralStatus => status;
export const subscribeNeural = (_fn: (s: NeuralStatus) => void) => () => {};
export function initNeural() {}
export async function downloadNeural(): Promise<void> {}
export function deleteNeural() {}
export function stopNeural() {}
export const speakNeural = (_text: string, _slow: boolean, _onFail: () => void) => false;

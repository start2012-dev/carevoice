import type { AudioPayload } from './types';

let mediaRecorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: Blob[] = [];

export async function startRecording(): Promise<void> {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });
  mediaRecorder.start();
}

export async function stopRecording(): Promise<AudioPayload> {
  if (!mediaRecorder) {
    throw new Error('録音が開始されていません。');
  }

  const recorder = mediaRecorder;
  const stopped = new Promise<void>((resolve) => recorder.addEventListener('stop', () => resolve(), { once: true }));
  recorder.stop();
  await stopped;

  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  mediaRecorder = null;

  const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
  return { mimeType: blob.type || 'audio/webm', base64: await blobToBase64(blob) };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result);
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('音声データの変換に失敗しました。'));
    reader.readAsDataURL(blob);
  });
}

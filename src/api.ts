import { APP_VERSION, GAS_WEB_APP_URL } from './config';
import type { AudioPayload, CareRecord, MastersResponse, ProcessAudioResponse, SaveRecordsResponse, Staff, UserMaster } from './types';

async function postToGas<T>(body: unknown): Promise<T> {
  if (!GAS_WEB_APP_URL) {
    throw new Error('GAS Web App URLが未設定です。src/config.tsを設定してください。');
  }

  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GAS APIエラー: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getMasters(): Promise<MastersResponse> {
  return postToGas<MastersResponse>({ action: 'getMasters' });
}

export async function processAudio(audio: AudioPayload, staff: Staff, users: UserMaster[], recordDate: string): Promise<ProcessAudioResponse> {
  return postToGas<ProcessAudioResponse>({
    action: 'processAudio',
    audio,
    context: { recordDate, staff, users },
    meta: { recordedAt: new Date().toISOString(), clientVersion: APP_VERSION },
  });
}

export async function saveRecords(staff: Staff, records: CareRecord[]): Promise<SaveRecordsResponse> {
  const saveTargets = records.filter((record) => !record.excluded);
  return postToGas<SaveRecordsResponse>({
    action: 'saveRecords',
    staff,
    records: saveTargets.map(({ excluded: _excluded, clientRecordId: _clientRecordId, userCandidates: _userCandidates, needsReview: _needsReview, reviewReasons: _reviewReasons, ...record }) => record),
    meta: { clientVersion: APP_VERSION, savedAt: new Date().toISOString() },
  });
}

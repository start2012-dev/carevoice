import { APP_VERSION, GAS_WEB_APP_URL } from './config';
import type {
  AudioPayload,
  CareRecord,
  FacilitySessionResponse,
  MastersResponse,
  ProcessAudioResponse,
  SaveRecordsResponse,
  Staff,
  UserMaster,
} from './types';

async function postToGas<T>(body: unknown): Promise<T> {
  if (!GAS_WEB_APP_URL) {
    throw new Error('GAS Web App URLが未設定です。src/config.tsを設定してください。');
  }

  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    // GitHub Pages -> GAS Web Appではapplication/jsonだとCORSプリフライトが発生するため、
    // simple requestとして扱われるtext/plainでJSON文字列を送る。
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`GAS APIエラー: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function unlockFacility(
  facilityPin: string,
): Promise<FacilitySessionResponse> {
  return postToGas<FacilitySessionResponse>({
    action: 'authenticateFacility',
    facilityPin,
  });
}

export async function getMasters(
  sessionToken: string,
): Promise<MastersResponse> {
  return postToGas<MastersResponse>({
    action: 'getMasters',
    sessionToken,
  });
}

export async function processAudio(
  audio: AudioPayload,
  staff: Staff,
  users: UserMaster[],
  recordDate: string,
  sessionToken: string,
): Promise<ProcessAudioResponse> {
  return postToGas<ProcessAudioResponse>({
    action: 'processAudio',
    sessionToken,
    audio,
    context: {
      recordDate,
      staffId: staff.staffId,
      userCount: users.length,
    },
    meta: {
      recordedAt: new Date().toISOString(),
      clientVersion: APP_VERSION,
    },
  });
}

export async function saveRecords(
  staff: Staff,
  records: CareRecord[],
  sessionToken: string,
): Promise<SaveRecordsResponse> {
  const saveTargets = records.filter((record) => !record.excluded);

  return postToGas<SaveRecordsResponse>({
    action: 'saveRecords',
    sessionToken,
    staff,
    records: saveTargets.map(
      ({
        excluded: _excluded,
        clientRecordId: _clientRecordId,
        userCandidates: _userCandidates,
        needsReview: _needsReview,
        reviewReasons: _reviewReasons,
        ...record
      }) => record,
    ),
    meta: {
      clientVersion: APP_VERSION,
      savedAt: new Date().toISOString(),
    },
  });
}

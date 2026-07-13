import './styles.css';
import { getMasters, processAudio, saveRecords as saveRecordsApi } from './api';
import { startRecording as startRecorder, stopRecording as stopRecorder } from './recorder';
import { render } from './render';
import { state, todayString } from './state';
import { getStoredStaffId, storeStaffId } from './storage';
import type { CareRecord, UserCandidate } from './types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('アプリの描画先が見つかりません。');
}

const handlers = {
  selectStaff(staffId: string): void {
    state.selectedStaff = state.staff.find((staff) => staff.staffId === staffId) || null;
    if (state.selectedStaff) storeStaffId(state.selectedStaff.staffId);
    draw();
  },
  beginSession(): void {
    if (!state.selectedStaff) {
      state.status = 'selectingStaff';
    } else if (state.status === 'selectingStaff') {
      state.status = 'idle';
    }
    draw();
  },
  changeStaff(): void {
    state.status = 'selectingStaff';
    draw();
  },
  async startRecording(): Promise<void> {
    try {
      await startRecorder();
      state.status = 'recording';
      draw();
    } catch (error) {
      fail(error, '録音を開始できませんでした。マイク権限を確認してください。');
    }
  },
  async stopRecording(): Promise<void> {
    try {
      state.status = 'processing';
      state.processingMessage = '音声データを準備しています。';
      draw();
      const audio = await stopRecorder();
      if (!state.selectedStaff) throw new Error('看護記録者が未選択です。');
      state.processingMessage = '文字起こしと利用者別記録を作成しています。';
      draw();
      const response = await processAudio(audio, state.selectedStaff, state.users, todayString());
      if (!response.ok) throw new Error(response.error.message);
      state.transcript = response.transcript;
      state.records = response.records.map((record, index) => ({
        ...record,
        clientRecordId: `tmp_${index + 1}`,
        recordDate: todayString(),
        excluded: false,
      }));
      state.status = 'confirming';
      draw();
    } catch (error) {
      fail(error, 'AI処理に失敗しました。');
    }
  },
  async saveRecords(): Promise<void> {
    try {
      if (!state.selectedStaff) throw new Error('看護記録者が未選択です。');
      state.status = 'saving';
      draw();
      const response = await saveRecordsApi(state.selectedStaff, state.records);
      if (!response.ok) throw new Error(response.error.message);
      state.savedCount = response.savedCount;
      state.savedRows = response.savedRows;
      state.status = 'completed';
      draw();
    } catch (error) {
      fail(error, '保存に失敗しました。');
    }
  },
  reset(): void {
    state.status = state.selectedStaff ? 'idle' : 'selectingStaff';
    state.transcript = '';
    state.records = [];
    state.errorMessage = '';
    state.savedCount = 0;
    state.savedRows = [];
    draw();
  },
  updateRecord(index: number, patch: Partial<CareRecord>): void {
    state.records[index] = { ...state.records[index], ...patch };
    draw();
  },
  selectCandidate(index: number, candidate: UserCandidate): void {
    state.records[index] = {
      ...state.records[index],
      userId: candidate.userId,
      userName: candidate.userName,
      reviewReasons: state.records[index].reviewReasons.filter((reason) => !reason.includes('候補') && !reason.includes('一致')),
    };
    state.records[index].needsReview = state.records[index].reviewReasons.length > 0;
    draw();
  },
};

function draw(): void {
  render(app!, state, handlers);
}

function fail(error: unknown, fallback: string): void {
  state.status = 'error';
  state.errorMessage = error instanceof Error ? error.message : fallback;
  draw();
}

async function init(): Promise<void> {
  draw();
  try {
    const response = await getMasters();
    if (!response.ok) throw new Error(response.error.message);
    state.staff = response.staff;
    state.users = response.users;
    const storedStaffId = getStoredStaffId();
    state.selectedStaff = state.staff.find((staff) => staff.staffId === storedStaffId) || null;
    state.status = 'selectingStaff';
    draw();
  } catch (error) {
    fail(error, 'マスタ取得に失敗しました。');
  }
}

init();

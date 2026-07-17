import { CATEGORIES } from './state';
import type { AppState, CareRecord, Staff, UserCandidate } from './types';

export interface Handlers {
  selectStaff(staffId: string): void;
  beginSession(): void;
  changeStaff(): void;
  startRecording(): void;
  stopRecording(): void;
  saveRecords(): void;
  reset(): void;
  updateRecord(index: number, patch: Partial<CareRecord>): void;
  selectCandidate(index: number, candidate: UserCandidate): void;
}

export function render(app: HTMLElement, state: AppState, handlers: Handlers): void {
  app.innerHTML = layout(state);
  bind(app, state, handlers);
}

function layout(state: AppState): string {
  return `<main class="app"><header class="header"><div><p class="eyebrow">CareVoice MVP</p><h1>看護介護記録</h1></div>${staffChip(state.selectedStaff)}</header>${body(state)}</main>`;
}

function staffChip(staff: Staff | null): string {
  return `<div class="staff-chip">記録者: <strong>${escapeHtml(staff?.staffName || '未選択')}</strong></div>`;
}

function body(state: AppState): string {
  if (state.status === 'loadingMasters') return panel('マスタを読み込んでいます', '<p>職員・利用者マスタを取得しています。</p>');
  if (state.status === 'selectingStaff') return staffSelector(state);
  if (state.status === 'recording') return panel('録音中', '<p class="recording-dot">音声を録音しています。</p><button id="stopRecording" class="primary danger">録音停止して解析</button>');
  if (state.status === 'processing') return panel('処理中', `<p>${escapeHtml(state.processingMessage || 'AI処理中です。')}</p><div class="loader"></div>`);
  if (state.status === 'confirming') return confirmView(state);
  if (state.status === 'saving') return panel('保存中', '<p>Googleスプレッドシートへ保存しています。</p><div class="loader"></div>');
  if (state.status === 'completed') return panel('保存完了', `<p>${state.savedCount}件の記録を保存しました。</p><p>保存行: ${state.savedRows.join(', ') || '-'}</p><button id="reset" class="primary">新しく録音する</button>`);
  if (state.status === 'error') return panel('エラー', `<p class="error">${escapeHtml(state.errorMessage)}</p><button id="reset" class="primary">最初に戻る</button>`);
  return idleView();
}

function staffSelector(state: AppState): string {
  return panel('看護記録者を選択', `<label>職員マスタ<select id="staffSelect"><option value="">選択してください</option>${state.staff.map((staff) => `<option value="${staff.staffId}" ${state.selectedStaff?.staffId === staff.staffId ? 'selected' : ''}>${escapeHtml(staff.staffName)}</option>`).join('')}</select></label><button id="beginSession" class="primary" ${state.selectedStaff ? '' : 'disabled'}>入力を開始</button>`);
}

function idleView(): string {
  return panel('録音', `<p>複数利用者の記録をまとめて話せます。AIが利用者ごとに分割します。</p><button id="changeStaff" class="secondary">記録者を変更</button><button id="startRecording" class="primary">録音開始</button><div class="hint">例: 利用者Aさんは昼食全量。利用者Bさんは血圧120の70、脈72です。</div>`);
}

function confirmView(state: AppState): string {
  const disabledReason = validateRecords(state);
  return `<section class="panel"><h2>確認</h2><details><summary>文字起こし全文</summary><p class="transcript">${escapeHtml(state.transcript)}</p></details><div class="cards">${state.records.map(recordCard).join('')}</div><button id="saveRecords" class="primary" ${disabledReason ? 'disabled' : ''}>保存する</button>${disabledReason ? `<p class="error">${disabledReason}</p>` : ''}</section>`;
}

function recordCard(record: CareRecord, index: number): string {
  return `<article class="record-card ${record.needsReview ? 'needs-review' : ''}"><label class="check"><input data-index="${index}" data-field="excluded" type="checkbox" ${record.excluded ? '' : 'checked'}> 保存対象</label>${record.needsReview ? `<p class="warning">確認が必要: ${record.reviewReasons.map(escapeHtml).join('、')}</p>` : ''}<label>利用者名<input data-index="${index}" data-field="userName" value="${escapeAttr(record.userName)}"></label>${candidateSelect(record, index)}<label>日付<input data-index="${index}" data-field="recordDate" value="${escapeAttr(record.recordDate)}"></label><div class="grid"><label>血圧 上<input inputmode="numeric" data-index="${index}" data-field="bloodPressureSystolic" value="${record.bloodPressureSystolic ?? ''}"></label><label>血圧 下<input inputmode="numeric" data-index="${index}" data-field="bloodPressureDiastolic" value="${record.bloodPressureDiastolic ?? ''}"></label><label>脈拍<input inputmode="numeric" data-index="${index}" data-field="pulse" value="${record.pulse ?? ''}"></label></div><label>分類<select data-index="${index}" data-field="categories" multiple>${CATEGORIES.map((category) => `<option value="${category}" ${record.categories.includes(category) ? 'selected' : ''}>${category}</option>`).join('')}</select></label><label>看護介護記録<textarea data-index="${index}" data-field="careRecord">${escapeHtml(record.careRecord)}</textarea></label></article>`;
}

function candidateSelect(record: CareRecord, index: number): string {
  if (record.userCandidates.length === 0) return `<p class="warning">利用者候補がありません。保存前に利用者を確定してください。</p>`;
  return `<label>候補<select data-index="${index}" data-field="candidate"><option value="">候補から選択</option>${record.userCandidates.map((candidate) => `<option value="${candidate.userId}" ${record.userId === candidate.userId ? 'selected' : ''}>${escapeHtml(candidate.userName)}</option>`).join('')}</select></label>`;
}

function validateRecords(state: AppState): string {
  const targets = state.records.filter((record) => !record.excluded);
  if (!state.selectedStaff) return '看護記録者を選択してください。';
  if (targets.length === 0) return '保存対象の記録がありません。';
  if (targets.some((record) => !record.userId)) return '利用者が未確定の記録があります。';
 if (targets.some((record) => !record.recordDate)) return '日付が未入力です。';
  return '';
}

function panel(title: string, html: string): string {
  return `<section class="panel"><h2>${title}</h2>${html}</section>`;
}

function bind(app: HTMLElement, _state: AppState, handlers: Handlers): void {
  app.querySelector<HTMLSelectElement>('#staffSelect')?.addEventListener('change', (event) => handlers.selectStaff((event.target as HTMLSelectElement).value));
  app.querySelector('#beginSession')?.addEventListener('click', handlers.beginSession);
  app.querySelector('#changeStaff')?.addEventListener('click', () => handlers.changeStaff());
  app.querySelector('#startRecording')?.addEventListener('click', handlers.startRecording);
  app.querySelector('#stopRecording')?.addEventListener('click', handlers.stopRecording);
  app.querySelector('#saveRecords')?.addEventListener('click', handlers.saveRecords);
  app.querySelector('#reset')?.addEventListener('click', handlers.reset);

  app.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-index]').forEach((input) => {
    input.addEventListener('change', () => handleField(input, handlers));
  });
}

function handleField(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, handlers: Handlers): void {
  const index = Number(input.dataset.index);
  const field = input.dataset.field;
  if (field === 'candidate') {
    const record = document.querySelector<HTMLSelectElement>(`select[data-index="${index}"][data-field="candidate"]`);
    const selected = record?.selectedOptions[0];
    if (selected?.value) handlers.selectCandidate(index, { userId: selected.value, userName: selected.textContent || '' });
    return;
  }
  if (field === 'categories' && input instanceof HTMLSelectElement) {
    handlers.updateRecord(index, { categories: Array.from(input.selectedOptions).map((option) => option.value) as CareRecord['categories'] });
    return;
  }
  if (field === 'excluded' && input instanceof HTMLInputElement) {
    handlers.updateRecord(index, { excluded: !input.checked });
    return;
  }
  const value = input.value;
  const numericFields = ['bloodPressureSystolic', 'bloodPressureDiastolic', 'pulse'];
  handlers.updateRecord(index, { [field || '']: numericFields.includes(field || '') ? (value ? Number(value) : null) : value } as Partial<CareRecord>);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

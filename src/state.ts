import type { AppState, Category } from './types';

export const CATEGORIES: Category[] = [
  'バイタル',
  '食事',
  '水分',
  '排泄',
  '入浴',
  '服薬',
  '機能訓練',
  'レクリエーション',
  '睡眠',
  '体調',
  '認知・精神面',
  'その他',
];

export const state: AppState = {
  status: 'loadingMasters',
  staff: [],
  users: [],
  selectedStaff: null,
  transcript: '',
  records: [],
  errorMessage: '',
  savedCount: 0,
  savedRows: [],
  processingMessage: '',
};

export function todayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

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
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}/${values.month}/${values.day}`;
}

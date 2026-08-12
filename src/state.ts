import type { AppState } from './types';

export const state: AppState = {
  status: 'unlocking',
  facilitySessionToken: '',
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

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}/${values.month}/${values.day}`;
}

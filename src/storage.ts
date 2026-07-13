const STAFF_ID_KEY = 'carevoice.selectedStaffId';

export function getStoredStaffId(): string | null {
  return window.localStorage.getItem(STAFF_ID_KEY);
}

export function storeStaffId(staffId: string): void {
  window.localStorage.setItem(STAFF_ID_KEY, staffId);
}

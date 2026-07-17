const STAFF_ID_KEY = 'carevoice.selectedStaffId';
const FACILITY_SESSION_KEY = 'carevoice.facilitySessionToken';

export function getStoredStaffId(): string | null {
  return window.localStorage.getItem(STAFF_ID_KEY);
}

export function storeStaffId(staffId: string): void {
  window.localStorage.setItem(STAFF_ID_KEY, staffId);
}

export function getFacilitySessionToken(): string {
  return window.sessionStorage.getItem(FACILITY_SESSION_KEY) || '';
}

export function storeFacilitySessionToken(sessionToken: string): void {
  window.sessionStorage.setItem(FACILITY_SESSION_KEY, sessionToken);
}

export function clearFacilitySessionToken(): void {
  window.sessionStorage.removeItem(FACILITY_SESSION_KEY);
}

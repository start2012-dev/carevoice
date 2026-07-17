export type AppStatus =
  | 'unlocking'
  | 'loadingMasters'
  | 'selectingStaff'
  | 'idle'
  | 'recording'
  | 'processing'
  | 'confirming'
  | 'saving'
  | 'completed'
  | 'error';

export type Category =
  | 'バイタル'
  | '食事'
  | '水分'
  | '排泄'
  | '入浴'
  | '服薬'
  | '機能訓練'
  | 'レクリエーション'
  | '睡眠'
  | '体調'
  | '認知・精神面'
  | 'その他';

export interface Staff {
  staffId: string;
  staffName: string;
}

export interface UserMaster {
  userId: string;
  userName: string;
  userKana: string;
  nicknames: string[];
  aliases: string[];
}

export interface UserCandidate {
  userId: string;
  userName: string;
}

export interface CareRecord {
  clientRecordId: string;
  userId: string | null;
  userName: string;
  userCandidates: UserCandidate[];
  recordDate: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  pulse: number | null;
  categories: Category[];
  careRecord: string;
  needsReview: boolean;
  reviewReasons: string[];
  excluded: boolean;
}

export interface AppState {
  status: AppStatus;
  facilitySessionToken: string;
  staff: Staff[];
  users: UserMaster[];
  selectedStaff: Staff | null;
  transcript: string;
  records: CareRecord[];
  errorMessage: string;
  savedCount: number;
  savedRows: number[];
  processingMessage: string;
}

export interface AudioPayload {
  mimeType: string;
  base64: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: ApiError };

export type MastersResponse = ApiResult<{ staff: Staff[]; users: UserMaster[] }>;
export type FacilitySessionResponse = ApiResult<{ sessionToken: string; expiresAt: string }>;

export type ProcessAudioResponse = ApiResult<{
  transcript: string;
  records: Omit<CareRecord, 'clientRecordId' | 'recordDate' | 'excluded'>[];
}>;

export type SaveRecordsResponse = ApiResult<{ savedCount: number; savedRows: number[] }>;

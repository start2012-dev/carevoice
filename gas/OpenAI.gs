const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_AUDIO_MIME_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a'];

function processAudio(body) {
  validateProcessAudio_(body);
  const users = getUserMaster();
  const transcript = transcribeAudio(body.audio);
  const records = createCareRecordJson(transcript, users);
  return { ok: true, transcript: transcript, records: normalizeOpenAiRecords_(records, users) };
}

function transcribeAudio(audio) {
  const apiKey = getOpenAiApiKey_();
  const bytes = Utilities.base64Decode(audio.base64);
  const blob = Utilities.newBlob(bytes, audio.mimeType, 'recording');
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: { model: 'gpt-4o-mini-transcribe', file: blob, language: 'ja' },
    muteHttpExceptions: true
  });
  const json = parseOpenAiResponse_(response);
  return clampString_(json.text || '', 20000);
}

function createCareRecordJson(transcript, users) {
  const apiKey = getOpenAiApiKey_();
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: careRecordSystemPrompt() },
        { role: 'user', content: JSON.stringify({ transcript: transcript, users: users }) }
      ]
    }),
    muteHttpExceptions: true
  });
  const json = parseOpenAiResponse_(response);
  const content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  if (!content) throw new Error('OpenAIのJSON生成結果が空です。');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.records)) throw new Error('OpenAIのJSONにrecords配列がありません。');
  return parsed.records;
}

function normalizeOpenAiRecords_(records, users) {
  const activeUserIds = users.map(function(user) { return user.userId; });
  return records.slice(0, 30).map(function(record) {
    const normalized = {
      userId: typeof record.userId === 'string' && activeUserIds.indexOf(record.userId) !== -1 ? record.userId : null,
      userName: clampString_(typeof record.userName === 'string' ? record.userName : '', 80),
      userCandidates: normalizeCandidates_(record.userCandidates, users),
      bloodPressureSystolic: normalizeNumber_(record.bloodPressureSystolic, 40, 260),
      bloodPressureDiastolic: normalizeNumber_(record.bloodPressureDiastolic, 30, 160),
      pulse: normalizeNumber_(record.pulse, 20, 220),
      categories: normalizeStringArray_(record.categories, 10, 20),
      careRecord: clampString_(typeof record.careRecord === 'string' ? record.careRecord : '', 1000),
      needsReview: record.needsReview === true,
      reviewReasons: normalizeStringArray_(record.reviewReasons, 10, 120)
    };

    if (!normalized.userId) {
      normalized.needsReview = true;
      normalized.reviewReasons.push('利用者が確定していません');
    }
    if ((normalized.bloodPressureSystolic === null) !== (normalized.bloodPressureDiastolic === null)) {
      normalized.needsReview = true;
      normalized.reviewReasons.push('血圧の収縮期または拡張期のみが入力されています');
    }
    if (!normalized.careRecord) {
      normalized.needsReview = true;
      normalized.reviewReasons.push('記録本文が空です');
    }
    normalized.reviewReasons = uniqueStrings_(normalized.reviewReasons).slice(0, 10);
    return normalized;
  });
}

function normalizeCandidates_(candidates, users) {
  if (!Array.isArray(candidates)) return [];
  return candidates.map(function(candidate) {
    const matched = users.find(function(user) { return user.userId === candidate.userId; });
    return matched ? { userId: matched.userId, userName: matched.userName } : null;
  }).filter(Boolean).slice(0, 10);
}

function normalizeNumber_(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return Math.round(number);
}

function normalizeStringArray_(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return uniqueStrings_(value.map(function(item) { return clampString_(String(item || ''), maxLength); }).filter(Boolean)).slice(0, maxItems);
}

function uniqueStrings_(values) {
  return values.filter(function(value, index, array) { return array.indexOf(value) === index; });
}

function clampString_(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function parseOpenAiResponse_(response) {
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('OpenAI APIエラー: ' + text);
  return JSON.parse(text);
}

function getOpenAiApiKey_() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEYが未設定です。');
  return apiKey;
}

function validateProcessAudio_(body) {
  if (!body.audio || !body.audio.base64) throw new Error('音声データがありません。');
  const mimeType = String(body.audio.mimeType || '').split(';')[0].toLowerCase();
  if (SUPPORTED_AUDIO_MIME_TYPES.indexOf(mimeType) === -1) throw new Error('未対応の音声形式です: ' + mimeType);
  const base64 = String(body.audio.base64 || '');
  if (!base64.trim()) throw new Error('音声データが空です。');
  const estimatedBytes = Math.floor(base64.length * 3 / 4);
  if (estimatedBytes <= 0) throw new Error('音声データが空です。');
  if (estimatedBytes > MAX_AUDIO_BYTES) throw new Error('音声データが上限サイズを超えています。');
  body.audio.mimeType = mimeType;
}

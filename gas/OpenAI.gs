function processAudio(body) {
  validateProcessAudio_(body);
  const transcript = transcribeAudio(body.audio);
  const records = createCareRecordJson(transcript, body.context.users || []);
  return { ok: true, transcript: transcript, records: records };
}

function transcribeAudio(audio) {
  const apiKey = getOpenAiApiKey_();
  const blob = Utilities.newBlob(Utilities.base64Decode(audio.base64), audio.mimeType || 'audio/webm', 'recording.webm');
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: { model: 'gpt-4o-mini-transcribe', file: blob, language: 'ja' },
    muteHttpExceptions: true
  });
  const json = parseOpenAiResponse_(response);
  return json.text || '';
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
  const content = json.choices[0].message.content;
  const parsed = JSON.parse(content);
  return parsed.records || [];
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
}

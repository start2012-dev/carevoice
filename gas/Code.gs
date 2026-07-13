function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    switch (body.action) {
      case 'getMasters':
        return jsonResponse({ ok: true, staff: getStaffMaster(), users: getUserMaster() });
      case 'processAudio':
        return jsonResponse(processAudio(body));
      case 'saveRecords':
        return jsonResponse(saveRecords(body));
      default:
        return jsonResponse(errorResponse('UNKNOWN_ACTION', '未対応のactionです。'));
    }
  } catch (error) {
    return jsonResponse(errorResponse('SERVER_ERROR', error.message || 'サーバーエラーが発生しました。'));
  }
}

function doGet() {
  return jsonResponse({ ok: true, name: 'CareVoice API' });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(code, message) {
  return { ok: false, error: { code: code, message: message } };
}

function saveRecords(body) {
  const staff = resolveActiveStaff_(body.staff && body.staff.staffId);
  const users = getUserMaster();
  validateSaveRecords_(body, users);
  const sheet = getSheetByName_('看護介護記録') || getSheetByName_('Records');
  if (!sheet) throw new Error('保存先シートが見つかりません。');

  const rows = body.records.map(function(record) {
    const user = resolveActiveUser_(record.userId, users);
    return [
      user.userName,
      normalizeRecordDate_(record.recordDate),
      staff.staffName,
      formatBloodPressure_(record),
      record.pulse || '',
      clampString_(record.careRecord, 1000)
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
  return { ok: true, savedCount: rows.length, savedRows: rows.map(function(_, index) { return startRow + index; }) };
}

function validateSaveRecords_(body, users) {
  if (!body.staff || !body.staff.staffId) throw new Error('看護記録者IDが未指定です。');
  if (!body.records || body.records.length === 0) throw new Error('保存対象の記録がありません。');
  if (!Array.isArray(body.records) || body.records.length > 30) throw new Error('保存件数が不正です。');
  body.records.forEach(function(record) {
    resolveActiveUser_(record.userId, users);
    if (!record.recordDate || !isValidRecordDate_(record.recordDate)) throw new Error('記録日付が不正です。');
    if (!record.careRecord || String(record.careRecord).length > 1000) throw new Error('記録本文が不正です。');
    if ((record.bloodPressureSystolic === null || record.bloodPressureSystolic === undefined || record.bloodPressureSystolic === '') !== (record.bloodPressureDiastolic === null || record.bloodPressureDiastolic === undefined || record.bloodPressureDiastolic === '')) {
      throw new Error('血圧は収縮期と拡張期の両方が必要です。');
    }
    if (record.pulse !== null && record.pulse !== undefined && record.pulse !== '' && normalizeNumber_(record.pulse, 20, 220) === null) throw new Error('脈拍が不正です。');
  });
}

function resolveActiveStaff_(staffId) {
  const staff = getStaffMaster().find(function(item) { return item.staffId === staffId; });
  if (!staff) throw new Error('未登録または無効な看護記録者IDです。');
  return staff;
}

function resolveActiveUser_(userId, users) {
  const user = users.find(function(item) { return item.userId === userId; });
  if (!user) throw new Error('未登録または無効な利用者IDです。');
  return user;
}

function normalizeRecordDate_(value) {
  if (value && isValidRecordDate_(value)) return value;
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');
}

function isValidRecordDate_(value) {
  return /^\d{4}\/\d{2}\/\d{2}$/.test(String(value));
}

function formatBloodPressure_(record) {
  const systolic = normalizeNumber_(record.bloodPressureSystolic, 40, 260);
  const diastolic = normalizeNumber_(record.bloodPressureDiastolic, 30, 160);
  if (systolic === null && diastolic === null) return '';
  if (systolic === null || diastolic === null) throw new Error('血圧は収縮期と拡張期の両方が必要です。');
  return systolic + '~' + diastolic;
}

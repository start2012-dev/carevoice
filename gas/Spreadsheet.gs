function saveRecords(body) {
  validateSaveRecords_(body);
  const sheet = getSheetByName_('看護介護記録') || getSheetByName_('Records');
  if (!sheet) throw new Error('保存先シートが見つかりません。');

  const rows = body.records.map(function(record) {
    return [
      record.userName,
      record.recordDate,
      body.staff.staffName,
      formatBloodPressure_(record),
      record.pulse || '',
      record.careRecord
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
  return { ok: true, savedCount: rows.length, savedRows: rows.map(function(_, index) { return startRow + index; }) };
}

function validateSaveRecords_(body) {
  if (!body.staff || !body.staff.staffName) throw new Error('看護記録者が未指定です。');
  if (!body.records || body.records.length === 0) throw new Error('保存対象の記録がありません。');
  body.records.forEach(function(record) {
    if (!record.userId) throw new Error('利用者が未確定の記録があります。');
    if (!record.userName || !record.recordDate || !record.careRecord) throw new Error('必須項目が不足しています。');
  });
}

function formatBloodPressure_(record) {
  if (!record.bloodPressureSystolic || !record.bloodPressureDiastolic) return '';
  return record.bloodPressureSystolic + '~' + record.bloodPressureDiastolic;
}

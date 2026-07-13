function getStaffMaster() {
  const sheet = getSheetByName_('StaffMaster');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);
  return values
    .filter(function(row) { return row[0] && row[2] !== false; })
    .map(function(row) { return { staffId: String(row[0]), staffName: String(row[1]) }; });
}

function getUserMaster() {
  const sheet = getSheetByName_('UserMaster');
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues().slice(1);
  return values
    .filter(function(row) { return row[0] && row[5] !== false; })
    .map(function(row) {
      return {
        userId: String(row[0]),
        userName: String(row[1]),
        userKana: String(row[2] || ''),
        nicknames: splitList_(row[3]),
        aliases: splitList_(row[4])
      };
    });
}

function splitList_(value) {
  if (!value) return [];
  return String(value).split(',').map(function(item) { return item.trim(); }).filter(Boolean);
}

function getSheetByName_(name) {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('SPREADSHEET_IDが未設定です。');
  return SpreadsheetApp.openById(spreadsheetId).getSheetByName(name);
}

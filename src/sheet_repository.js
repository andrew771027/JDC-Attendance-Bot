import { createHeaderIndex } from './utility.js';

export function getEnabledChats(){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("chat")

  const values = sheet.getDataRange().getValues();

  const headers = values[0];
  
  const rows = values.slice(1);

  const index = createHeaderIndex(headers);

  return rows
    .filter(row => row[index.enabled] === true)
    .map(row => ({
      team: row[index.team],
      chatName: row[index.chat_name],
      chatSpaceId: row[index.chat_space_id],
      active: row[index.enabled],
    }));
}

export function getActivateMembers(){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("member");

  const values = sheet.getDataRange().getValues();

  const headers = values[0]

  const rows = values.slice(1);

  const index = createHeaderIndex(headers);

  return rows.filter(row => row[index.active] === true).map(row => ({
      wiproId: String(row[index.wipro_id]),
      name: row[index.name],
      wiproEmail: row[index.wipro_email],
      googleLdap: row[index.google_ldap],
      team: row[index.team],
      active: row[index.active],
  }));
}

export function saveDailyAttendance(records){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('daily_attendance');

  if (records.length === 0){
    return;
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const existingRows = values.slice(1);
  const today = records[0].date;
  const dateIndex = headers.indexOf("date");
  
  const keepRows = existingRows.filter(
    row => String(row[dateIndex]) !== today
  );

  const newRows = records.map(record => [
    record.date,
    record.wiproId,
    record.name,
    record.team,
    record.amStatus,
    record.pmStatus,
    record.leaveHours,
    record.updatedAt,
  ]);

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  const allRows = [
    ...keepRows,
    ...newRows,
  ];

  if (allRows.length > 0) {
    sheet
      .getRange(
        2,
        1,
        allRows.length,
        headers.length
      )
      .setValues(allRows);
  }
}

export function saveDailySummary(summary){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('daily_summary');

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  sheet.appendRow([
    summary.date,
    summary.team,
    summary.totalMembers,
    summary.amPresent,
    summary.pmPresent,
    summary.amLeave,
    summary.pmLeave,
    summary.amMissingPunch,
    summary.pmMissingPunch,
    summary.amNoPunch,
    summary.pmNoPunch,
    summary.unknownCount,
    formatter.format(summary.amRate / 100),
    formatter.format(summary.pmRate / 100),
    formatter.format(summary.overallRate / 100),
    summary.leaveCount,
    summary.missingPunchCount,
    summary.noPunchCount,
    summary.updatedAt,

  ]);
}

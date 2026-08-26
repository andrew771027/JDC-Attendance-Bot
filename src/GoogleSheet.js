function getEnabledChats(){
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


function getActivateMembers(){
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

function saveDailyAttendance(records){
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

function calculateSummary(date, team, records){
  const totalMembers = records.length;
  const amPresent = countStatus(records, "AM", "PRESENT");
  const pmPresent = countStatus(records, "PM", "PRESENT");
  const amLeave = countStatus(records, "AM", "LEAVE");
  const pmLeave = countStatus(records, "PM", "LEAVE");
  const amMissingPunch = countStatus(records, "AM", "MISSING_PUNCH");
  const pmMissingPunch = countStatus(records, "PM", "MISSING_PUNCH");
  const amNoPunch = countStatus(records, "AM", "NO_PUNCH");
  const pmNoPunch = countStatus(records, "PM", "NO_PUNCH");
  const unknownCount = records.filter(record => record.amStatus == "UNKNOWN" || record.pmStatus == "UNKNOWN").length;

  const amRate = calculateRate(amPresent, totalMembers);
  const pmRate = calculateRate(pmPresent, totalMembers);
  const overallRate = totalMembers > 0 ? (amPresent + pmLeave) / (totalMembers * 2) * 100 : 0;

  const leaveMembers = records.filter(record => record.amStatus === "LEAVE" || record.pmStatus === "LEAVE");
  const missingPunchMembers = records.filter(record => record.amStatus === "MISSING_PUNCH" || record.pmStatus === "MISSING_PUNCH");
  const noPunchMembers = records.filter(record => record.amStatus === "NO_PUNCH" && record.pmStatus === "NO_PUNCH");
  
  return {
    date,
    team,
    totalMembers,
    amPresent,
    pmPresent,
    amLeave,
    pmLeave,
    amMissingPunch,
    pmMissingPunch,
    amNoPunch,
    pmNoPunch,
    unknownCount,
    amRate,
    pmRate,
    overallRate,
    leaveCount: leaveMembers.length,
    missingPunchCount: missingPunchMembers.length,
    noPunchCount: noPunchMembers.length,
    leaveMembers,
    missingPunchMembers,
    noPunchMembers,
    updatedAt: new Date(),
  };
}

function countStatus(records, period, status){
  const field = period === "AM" ? 'amStatus': 'pmStatus';
  return records.filter(record => record[field] === status).length;
}

function calculateRate(present, total){
  if (total === 0){
    return 0;
  }

  return present / total * 100;
}


function saveDailySummary(summary){
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

function groupAttendanceByTeam(records){
  const groups = {};

  for (const record of records){
    const team = record.team;

    if(!groups[team]){
      groups[team] = [];
    }

    groups[team].push(record);
  }

  return groups;
}
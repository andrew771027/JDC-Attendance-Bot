export function buildChatMessage(
  summary,
  attendance
){
  const leaveMembers = attendance.filter(record => record.amStatus === 'LEAVE' || record.pmStatus === 'LEAVE');

  const missingPunchMembers = attendance.filter(record => record.amStatus === 'MISSING_PUNCH' || record.pmStatus === 'MISSING_PUNCH');

  const noPunchMembers = attendance.filter(record => record.amStatus === "NO_PUNCH" && record.pmStatus === "NO_PUNCH");

  const unknownMembers = attendance.filter(record => record.amStatus === "UNKNOWN" || record.pmStatus === "UNKNOWN");

  const lines = [
    '📊 *Daily Attendance Report*',
    '',
    `Date: ${summary.date}`,
    `Team: ${summary.team}`,
    '',
    '*Attendance Summary*',
    '',
    `Overall: *${summary.overallRate.toFixed(1)}%*`,
    '',
    `🌅 AM: ${summary.amRate.toFixed(1)}% ` + `(${summary.amPresent}/${summary.totalMembers})`,
    `🌆 PM: ${summary.pmRate.toFixed(1)}% ` + `(${summary.pmPresent}/${summary.totalMembers})`
  ];

  appendLeaveSection(lines, leaveMembers);

  appendMissingPunchSection(lines, missingPunchMembers);

  appendNoPunchSection(lines, noPunchMembers);

  appendUnknownSection(lines, unknownMembers);

  return lines.join('\n');

}

function appendLeaveSection(
  lines,
  records
) {
  if (records.length === 0) {
    return;
  }

  lines.push('');
  lines.push('*On Leave*');

  for (const record of records) {
    const period =
      getLeavePeriod(record);

    const leaveType =
      record.leaveTypes.length > 0
        ? record.leaveTypes.join(', ')
        : 'Leave';

    lines.push(
      `• ${record.name} - ` +
      `${period}, ` +
      `${record.leaveHours} hr, ` +
      `${leaveType}`
    );
  }
}

function getLeavePeriod(record) {
  const amLeave =
    record.amStatus === 'LEAVE';

  const pmLeave =
    record.pmStatus === 'LEAVE';

  if (amLeave && pmLeave) {
    return 'Full Day';
  }

  if (amLeave) {
    return 'AM';
  }

  if (pmLeave) {
    return 'PM';
  }

  return '';
}

function appendMissingPunchSection(
  lines,
  records
) {
  if (records.length === 0) {
    return;
  }

  lines.push('');
  lines.push('*Missing Punch*');

  for (const record of records) {
    const issue =
      getAttendanceIssue(record);

    if (!issue) {
      continue;
    }

    lines.push(
      `• ${record.name} - ${issue.message}`
    );
  }
}

export function postAttendanceToChat(
  chatSpaceId,
  summary,
  attendance
){
  if (!chatSpaceId){
    throw new Error('Google Chat Space ID is empty')
  };

  const message = {text: buildChatMessage(summary, attendance)};

  const spaceName = 'spaces/' + chatSpaceId;

  try{
    Chat.Spaces.Messages.create(message, spaceName);
  } catch (e) {
    throw new Error('Failed to send message: ' + e.toString());
  }
}

function getAttendanceIssue(record) {
  if (
    record.amStatus === 'NO_PUNCH' &&
    record.pmStatus === 'NO_PUNCH'
  ) {
    return {
      type: 'NO_PUNCH',
      message: 'No punch'
    };
  }

  if (
    record.amStatus === 'MISSING_PUNCH' &&
    record.pmStatus === 'MISSING_PUNCH'
  ) {
    return {
      type: 'MISSING_PUNCH',
      message: 'Missing AM & PM punch'
    };
  }

  if (
    record.amStatus === 'MISSING_PUNCH'
  ) {
    return {
      type: 'MISSING_PUNCH',
      message: 'Missing AM punch'
    };
  }

  if (
    record.pmStatus === 'MISSING_PUNCH'
  ) {
    return {
      type: 'MISSING_PUNCH',
      message: 'Missing PM punch'
    };
  }

  return null;
}

function appendNoPunchSection(
  lines,
  records
) {
  if (records.length === 0) {
    return;
  }

  lines.push('');
  lines.push('*No Punch & No Leave*');

  for (const record of records) {
    lines.push(
      `• ${record.name}`
    );
  }
}

function appendUnknownSection(
  lines,
  records
) {
  if (records.length === 0) {
    return;
  }

  lines.push('');
  lines.push('*Unknown / Data Issue*');

  for (const record of records) {
    lines.push(
      `• ${record.name}`
    );
  }
}

export function calculateSummary(date, team, records){
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
  const overallRate = totalMembers > 0 ? (amPresent + pmPresent) / (totalMembers * 2) * 100 : 0;

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


export function groupAttendanceByTeam(records){
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

function getJdcPunchResponse(date, members){
  const props = PropertiesService.getScriptProperties();
  const chunkSize = props.getProperty("JDC_BATCH_SIZE");
  const employeeIds = getEmployeeIds(members);
  const batches = chunkArray(employeeIds, chunkSize);
  const allData = [];

  console.log(`Fetching JDC punch data: ` + `${employeeIds.length} members `+ `${batches.length} batch(es)`);

  for (let i = 0; i < batches.length; i++){
    const batch = batches[i];
    const empIds = batch.join(',');
    
    console.log(`Punch batch ${i+1}/${batches.length}: ` + `${bacth.length} members`);

    const response = fetchJdcPunchData(date, empIds);

    if (response.status !== '0'){
      throw new Error(`JDC Punch batch ${i+1} failed: ` + `${response.code} ${response.message}`);
    }

    const data = Array.isArray(response.data) ? response.data : [];
    allData.push(...data);

  }

  return {
    status: '0',
    code: '000',
    msg: 'success',
    errtrace: '',
    data: allData
  };
}

function getJdcLeaveResponse(date, members){
  const props = PropertiesService.getScriptProperties();
  const chunkSize = props.getProperty("JDC_BATCH_SIZE");
  const employeeIds = getEmployeeIds(members);
  const batches = chunkArray(employeeIds, chunkSize);
  const allData = [];

  console.log(`Fetching JDC leave data: ` + `${employeeIds.length} members `+ `${batches.length} batch(es)`);

  for (let i = 0; i < batches.length; i++){
    const batch = batches[i];
    const empIds = batch.join(',');
    
    console.log(`Leave batch ${i+1}/${batches.length}: ` + `${bacth.length} members`);

    const response = fetchJdcLeaveData(date, empIds);

    if (response.status !== '0'){
      throw new Error(`JDC Leave batch ${i+1} failed: ` + `${response.code} ${response.message}`);
    }

    const data = Array.isArray(response.data) ? response.data : [];
    allData.push(...data);

  }

  return {
    status: '0',
    code: '000',
    msg: 'success',
    errtrace: '',
    data: allData
  };
}

function fetchJdcPunchData(
  date,
  empIds
){
   const props = PropertiesService.getScriptProperties();
   const baseUrl = props.getProperty("JDC_BASE_URL");
   const payload = {
    apiKey: props.getProperty('JDC_API_KEY'),
    userid: props.getProperty('JDC_USER_ID'),
    password: props.getProperty('JDC_PASSWORD'),
    date_st: date,
    date_ed: date,
    emp_id: empIds,
    rtn_shift_info: 'Y',
   
    //Important:
    //also return scheduled records
    //without punch data
    rtn_all_records_by_shift: 'Y'
   };

  const response = UrlFetchApp.fetch(
    baseUrl + '/WebService/atd/get_AtdPunchData.ashx',
    {
      method: 'post',
      payload: payload,
      muteHttpExceptions: true
    }
  );

  const body = JSON.parse(response.getContentText());

  if (body.status !== '0'){
    throw new Error(`JDC Punch API error: ${body.msg}`);
  }

  return body;

}

function fetchJdcLeaveData(
  date,
  empIds,
){
  const props = PropertiesService.getScriptProperties();

  const baseUrl = props.getProperty('JDC_BASE_URL');

  const apiKey = props.getProperty('JDC_API_KEY');

  const userId = props.getProperty('JDC_USER_ID');

  const password = props.getProperty('JDC_PASSWORD');

  if(!baseUrl){
    throw new Error("JDC_BASE_URL is not configured");
  }

  if(!apiKey){
    throw new Error("JDC_API_KEY is not configured");
  }

  if(!userId){
    throw new Error("JDC_USER_ID is not configured");
  }

  if(!password){
    throw new Error("JDC_PASSWORD is not configured");
  }

  const url = baseUrl + '/WebService/atd/get_EmpLeaveData2.ashx';

  const payload = {
    apiKey: apiKey,
    userid: userId,
    password: password,
    date_st: date,
    date_ed: date,

    //2 = effective leave;
    data_status: '2',

    //employID "W001,W002,W003"
    emp_id: empIds
  }

  const resposne = UrlFetchApp.fetch(
    url,
    {
      method: 'post',
      payload: payload,
      muteHttpException: true
    }
  );

  const httpStatus = resposne.getResponseCode();
  const bodyText = resposne.getContentText();

  if (httpStatus < 200 || httpStatus >=300){
    throw new Error("JDC Leave API Http error: " + httpStatus + " " + bodyText);
  }

  const body = JSON.parse(bodyText);

  if (body.status !== '0'){
    throw new Error('JDC Leave API error: ' + body.code + ' ' + body.msg);
  }

  return body
}

function parsePunchData(response){
  if (!response){
    throw new Error("Punch response is empty.");
  }

  if (response.status !== '0'){
    throw new Error("Invalid JDC Punch response: " + response.code + ' ' + response.msg);
  }

  const data = Array.isArray(response.data) ? response.data : [] ;

  return data.map(item => ({
    wiproId:
      String(item.emp_id || ''),

    employeeName:
      item.emp_name || '',

    employeeUid:
      String(item.emp_uid || ''),

    workingDate:
      item.working_date || '',

    checkInTime:
      normalizeEmptyString(
        item.clock_in_time
      ),

    checkOutTime:
      normalizeEmptyString(
        item.clock_out_time
      ),

    checkInDescription:
      item.clock_in_desc || '',

    checkOutDescription:
      item.clock_out_desc || '',

    lateMinutes:
      toNullableNumber(
        item.clock_in_late_min
      ),

    earlyMinutes:
      toNullableNumber(
        item.clock_out_early_min
      ),

    actualWorkingMinutes:
      toNullableNumber(
        item.actual_working_time
      ),

    shiftName:
      item.shift_name || '',

    workingStartTime:
      normalizeEmptyString(
        item.working_start_time
      ),

    workingEndTime:
      normalizeEmptyString(
        item.working_end_time
      ),

    scheduledWorkingMinutes:
      toNullableNumber(
        item.scheduled_working_time
      ),

    sourceModifiedAt:
      normalizeEmptyString(
        item.clock_modify_dttm
      )
  }));
}

function parseLeaveData(response){
  if(!response){
    throw new Error("Leave resposne is empty");
  }

  if(response.status !== '0'){
    throw new Error("Invalid LDC Leave response: " + response.code + " " + response.msg);
  }

  const data = Array.isArray(response.data) ? response.data : [];

  return data.map(item => ({
    wiproId:
      String(item.emp_id || ''),

    employeeName:
      item.emp_name || '',

    employeeUid:
      String(item.emp_uid || ''),

    leaveSn:
      String(item.leave_sn || ''),

    leaveType:
      item.leave_type_name || '',

    leaveEvent:
      item.leave_event_name || '',

    startDateTime:
      normalizeEmptyString(
        item.start_dttm
      ),

    endDateTime:
      normalizeEmptyString(
        item.end_dttm
      ),

    leaveDays:
      toNumber(
        item.leave_days,
        0
      ),

    leaveHours:
      toNumber(
        item.leave_hours,
        0
      ),

    reason:
      item.reason || '',

    source:
      item.leave_data_src || '',

    status:
      item.leave_data_status || '',

    sourceModifiedAt:
      normalizeEmptyString(
        item.leave_data_modify_dttm
      )
  }));
}

function buildPunchIndex(punchRecords){
  const index = {};

  for (const record of punchRecords) {
    index[record.wiproId] = record;
  }

  return index;
}

function buildLeaveIndex(leaveRecords){
  const index = {};

  for (const record of leaveRecords) {
    if(!index[record.wiproId]) {
      index[record.wiproId] = [];
    }

    index[record.wiproId].push(record);
  }

  return index;
}

function buildDailyAttendance(
  date,
  members,
  punchRecords,
  leaveRecords
) {
  const punchIndex =
    buildPunchIndex(punchRecords);

  const leaveIndex =
    buildLeaveIndex(leaveRecords);

  return members.map(member => {
    const punch =
      punchIndex[member.wiproId] || null;

    const leaves =
      leaveIndex[member.wiproId] || [];

    const leaveStatus =
      resolveLeaveStatus(
        date,
        leaves
      );

    const amStatus =
      resolveHalfDayStatus(
        punch,
        leaveStatus.amLeave,
        'AM'
      );

    const pmStatus =
      resolveHalfDayStatus(
        punch,
        leaveStatus.pmLeave,
        'PM'
      );

    return {
      date,

      wiproId: member.wiproId,
      name: member.name,
      team: member.team,

      amStatus,
      pmStatus,

      checkInTime:
        punch?.checkInTime || null,

      checkOutTime:
        punch?.checkOutTime || null,

      leaveHours:
        leaveStatus.totalLeaveHours,

      leaveTypes:
        leaveStatus.leaveTypes,

      shiftName:
        punch?.shiftName || '',

      updatedAt:
        new Date()
    };
  });
}

function resolveLeaveStatus(
  date,
  leaves
){
  let amLeave = false;
  let pmLeave = false;
  let totalLeaveHours = 0;
  const leaveTypes = [];

  for (const leave of leaves){
    totalLeaveHours += Number(leave.leaveHours || 0);

    if(leave.leaveType){
      leaveTypes.push(leave.leaveType);
    }

    const start = parseJdcDateTime(leave.startDateTime);
    const end = parseJdcDateTime(leave.endDateTime);

    if (!start || !end){
      continue;
    }

    const amStart = parseJdcDateTime(`${date} 09:00`);
    const amEnd = parseJdcDateTime(`${date} 13:00`);
    const pmStart = parseJdcDateTime(`${date} 13:00`);
    const pmEnd = parseJdcDateTime(`${date} 18:00`);
  
    if (overlaps(start,end,amStart,amEnd)) {
      amLeave = true;
    }

    if (overlaps(start,end,pmStart,pmEnd)) {
      pmLeave = true;
    }  
  }

  return {
    amLeave,
    pmLeave,
    totalLeaveHours,
    leaveTypes: [... new Set(leaveTypes)]
  };
}

function resolveHalfDayStatus(punch, isLeave, period){
  if(isLeave){
    return 'LEAVE';
  }

  if(!punch){
    return "UNKNOWN";
  }

  const hasCheckIn = Boolean(punch.checkInTime);
  const hasCheckOut = Boolean(punch.checkOutTime);

  // No punch at all
  if (!hasCheckIn && !hasCheckOut)
  {
    return "NO_PUNCH";
  }
  
  if (period === "AM"){
    if (hasCheckIn){
      return "PRESENT";
    }
    return "MISSING_PUNCH";
  }

  if (period == "PM"){
    if (hasCheckOut){
      return "PRESENT";
    }
    return "MISSING_PUNCH";
  }

  return 'UNKNOWN';
}

function parseJdcDateTime(value){
  if(!value){
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);

  if(!match){
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
  ] = match;

  return new Date(
    Number(year),
    Number(month) -1,
    Number(day),
    Number(hour),
    Number(minute),
  );
}

function overlaps(startA, endA, startB, endB){
  return (startA < endB && endA > startB);
}

function getEmployeeIds(members) {
  return members
    .map(member => member.wiproId)
    .filter(id => Boolean(id));
}


function chunkArray(items, chunkSize) {
  if (chunkSize <= 0) {
    throw new Error(
      'chunkSize must be greater than 0'
    );
  }

  const chunks = [];

  for (
    let i = 0;
    i < items.length;
    i += chunkSize
  ) {
    chunks.push(
      items.slice(
        i,
        i + chunkSize
      )
    );
  }

  return chunks;
}


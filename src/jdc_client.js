import { createEmployeeIdBatches } from './query_planner.js';

export function getJdcPunchResponse(date, members){
  const props = PropertiesService.getScriptProperties();
  const chunkSize = props.getProperty("JDC_BATCH_SIZE");
  const batches = createEmployeeIdBatches(members, chunkSize);
  const employeeCount = batches.reduce((total, batch) => total + batch.length, 0);
  const allData = [];

  console.log(`Fetching JDC punch data: ` + `${employeeCount} members `+ `${batches.length} batch(es)`);

  for (let i = 0; i < batches.length; i++){
    const batch = batches[i];
    const empIds = batch.join(',');
    
    console.log(`Punch batch ${i+1}/${batches.length}: ` + `${batch.length} members`);

    const response = fetchJdcPunchData(date, empIds);

    if (response.status !== '0'){
      throw new Error(`JDC Punch batch ${i+1} failed: ` + `${response.code} ${response.msg}`);
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

export function getJdcLeaveResponse(date, members){
  const props = PropertiesService.getScriptProperties();
  const chunkSize = props.getProperty("JDC_BATCH_SIZE");
  const batches = createEmployeeIdBatches(members, chunkSize);
  const employeeCount = batches.reduce((total, batch) => total + batch.length, 0);
  const allData = [];

  console.log(`Fetching JDC leave data: ` + `${employeeCount} members `+ `${batches.length} batch(es)`);

  for (let i = 0; i < batches.length; i++){
    const batch = batches[i];
    const empIds = batch.join(',');
    
    console.log(`Leave batch ${i+1}/${batches.length}: ` + `${batch.length} members`);

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
      muteHttpExceptions: true
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

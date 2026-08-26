export function createHeaderIndex(headers){
  const index = {};
  
  headers.forEach((header, i) => {
    index[String(header).trim()] = i;
  });
  
  return index
}



export function normalizeEmptyString(value){
  if (value === undefined || value === null || value === ''){
    return null;
  }
  return String(value);
}

export function toNullableNumber(value){
  if (value === undefined || value === null || value === ''){
    return null;
  }

  const number = Number(value);
  
  if (Number.isNaN(number)){
    return null;
  }

  return number;
}

export function toNumber(value, defaultValue = 0){
  if (value === undefined || value === null || value == ""){
    return defaultValue;
  }

  const number = Number(value);
  
  if (Number.isNaN(number)){
    return defaultValue;
  }

  return number;
}


export function getToday(){
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return today
}

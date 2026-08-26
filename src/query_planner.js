export function createEmployeeIdBatches(members, chunkSize) {
  return chunkArray(getEmployeeIds(members), chunkSize);
}

export function getEmployeeIds(members) {
  return members
    .map(member => member.wiproId)
    .filter(id => Boolean(id));
}

export function chunkArray(items, chunkSize) {
  const size = Number(chunkSize);

  if (!Number.isInteger(size) || size <= 0) {
    throw new Error('chunkSize must be a positive integer');
  }

  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

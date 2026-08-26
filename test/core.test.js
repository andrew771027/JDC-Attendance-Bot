import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateSummary } from '../src/attendance_summary.js';
import { parseLeaveData } from '../src/attendance_parser.js';
import { createEmployeeIdBatches } from '../src/query_planner.js';

test('query planner removes empty IDs and creates batches', () => {
  const members = [{ wiproId: 'W001' }, { wiproId: '' }, { wiproId: 'W002' }];
  assert.deepEqual(createEmployeeIdBatches(members, '1'), [['W001'], ['W002']]);
});

test('leave parser uses zero for missing numeric values', () => {
  const [leave] = parseLeaveData({ status: '0', data: [{ emp_id: 'W001' }] });
  assert.equal(leave.leaveDays, 0);
  assert.equal(leave.leaveHours, 0);
});

test('overall attendance rate uses AM and PM presence', () => {
  const records = [
    { amStatus: 'PRESENT', pmStatus: 'PRESENT' },
    { amStatus: 'LEAVE', pmStatus: 'LEAVE' },
  ];
  assert.equal(calculateSummary('2026-08-26', 'Power', records).overallRate, 50);
});

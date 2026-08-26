import { buildDailyAttendance, parseLeaveData, parsePunchData } from './attendance_parser.js';
import { calculateSummary, groupAttendanceByTeam } from './attendance_summary.js';
import { postAttendanceToChat } from './chat_client.js';
import { getJdcLeaveResponse, getJdcPunchResponse } from './jdc_client.js';
import {
  getActivateMembers,
  getEnabledChats,
  saveDailyAttendance,
  saveDailySummary,
} from './sheet_repository.js';
import { getToday } from './utility.js';

export function myFunction() {
    const today = getToday();
    
    // 1. Load configuration / master data
    const members = getActivateMembers();
    const chats = getEnabledChats();
    
    // 2. Fetch JDC attendance once
    const punchResponse = getJdcPunchResponse(today, members);
    const leaveResponse = getJdcLeaveResponse(today, members);

    // 3. Parse JDC attendance
    const punchRecords = parsePunchData(punchResponse);
    const leaveRecords = parseLeaveData(leaveResponse);

    // 4. Build today's attendance
    const dailyAttendance = buildDailyAttendance(today, members, punchRecords, leaveRecords);

    // 5. Save daily attendance
    saveDailyAttendance(dailyAttendance);

    // 6. Group by Team
    const attendanceByTeam = groupAttendanceByTeam(dailyAttendance);

    // 7. Generate report for each team / chat
    for (const chat of chats) {
      
      const teamAttendance = attendanceByTeam[chat.team] || [];

      if (teamAttendance.length === 0){
        continue;
      }

      processTeamReport(today, chat, teamAttendance);
      
    }
}

function processTeamReport(
  date,
  chat,
  teamAttendance,
){

  const summary = calculateSummary(date, chat.team, teamAttendance);

  saveDailySummary(summary);

  postAttendanceToChat(
    chat.chatSpaceId,
    summary,
    teamAttendance,
  );

}

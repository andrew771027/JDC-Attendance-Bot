function myFunction() {    
    const today = getToday();
    
    // 1. Load configuration / master data
    const members = getActivateMembers();
    const chats = getEnabledChats();
    const empIds = members.map(member => member.wiproId).join(',');

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

function testMyFunction(){

    const today = getToday();
    
    // 1. Load configuration / master data
    const members = getActivateMembers();
    const chats = getEnabledChats();
    const empIds = members.map(member => member.wiproId).join(',');

    // 2. Mock JDC data
    const punchResponse = getMockPunchResponse();
    const leaveResponse = getMockLeaveResponse();

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


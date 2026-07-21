class NotificationService {
  /**
   * Send notification stub to student/parent on attendance marking
   */
  async sendAttendanceNotification(studentId, sessionDate, status) {
    console.log(`[STUB] Notification sent to Student/Parent (StudentId: ${studentId}):`)
    console.log(`- Date: ${new Date(sessionDate).toLocaleDateString()}`)
    console.log(`- Status: ${status}`)
    return { success: true, channel: 'foundation-logs' }
  }

  /**
   * Send low attendance alert stub to student/parent
   */
  async sendLowAttendanceAlert(studentId, attendancePercentage) {
    console.log(`[STUB] Critical Low Attendance alert sent (StudentId: ${studentId}):`)
    console.log(`- Current Rate: ${attendancePercentage}%`)
    return { success: true, channel: 'foundation-logs' }
  }
}

module.exports = new NotificationService()

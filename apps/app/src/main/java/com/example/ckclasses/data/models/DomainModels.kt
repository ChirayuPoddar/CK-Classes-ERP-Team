package com.example.ckclasses.data.models

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    val totalStudents: Int = 0,
    val totalTeachers: Int = 0,
    val totalSubjects: Int = 0,
    val todayAttendancePercentage: Double = 0.0,
    val pendingFeesTotal: Double = 0.0
)

// Student Model
data class Student(
    @SerializedName("_id") val id: String = "",
    @SerializedName("studentId") val studentId: String = "",
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("user") val user: User? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("class") val studentClass: String = "",
    @SerializedName("section") val section: String = "",
    @SerializedName("rollNumber") val rollNumber: String = "",
    @SerializedName("guardianName") val guardianName: String = "",
    @SerializedName("guardianPhone") val guardianPhone: String = "",
    @SerializedName("status") val status: String = "Active"
) {
    val fullName: String
        get() {
            if (!name.isNullOrEmpty()) return name
            val combined = listOfNotNull(firstName, lastName).joinToString(" ").trim()
            return if (combined.isNotEmpty()) combined else "Student"
        }
}

data class CreateStudentRequest(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("class") val studentClass: String,
    @SerializedName("section") val section: String,
    @SerializedName("rollNumber") val rollNumber: String,
    @SerializedName("guardianName") val guardianName: String,
    @SerializedName("guardianPhone") val guardianPhone: String
)

// Teacher Model
data class Teacher(
    @SerializedName("_id") val id: String = "",
    @SerializedName("teacherId") val teacherId: String = "",
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("user") val user: User? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("department") val department: String = "",
    @SerializedName("qualification") val qualification: String = "",
    @SerializedName("subjectsHandled") val subjectsHandled: List<String> = emptyList(),
    @SerializedName("status") val status: String = "Active"
) {
    val fullName: String
        get() {
            if (!name.isNullOrEmpty()) return name
            val combined = listOfNotNull(firstName, lastName).joinToString(" ").trim()
            return if (combined.isNotEmpty()) combined else "Faculty Member"
        }
}

data class CreateTeacherRequest(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("department") val department: String,
    @SerializedName("qualification") val qualification: String
)

// Subject Model
data class Subject(
    @SerializedName("_id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("code") val code: String = "",
    @SerializedName("class") val subjectClass: String = "",
    @SerializedName("teacher") val teacher: Teacher? = null
)

data class CreateSubjectRequest(
    @SerializedName("name") val name: String,
    @SerializedName("code") val code: String,
    @SerializedName("class") val subjectClass: String,
    @SerializedName("teacherId") val teacherId: String? = null
)

// Attendance Model
data class AttendanceRecord(
    @SerializedName("_id") val id: String = "",
    @SerializedName("student") val student: Student? = null,
    @SerializedName("class") val studentClass: String = "",
    @SerializedName("date") val date: String = "",
    @SerializedName("status") val status: String = "Present",
    @SerializedName("remarks") val remarks: String? = null
)

data class MarkAttendanceRequest(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("class") val studentClass: String,
    @SerializedName("date") val date: String,
    @SerializedName("status") val status: String
)

// Fee Model
data class FeeRecord(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val rawTitle: String? = null,
    @SerializedName("student") val student: Student? = null,
    @SerializedName("amount") val amount: Double = 0.0,
    @SerializedName("paidAmount") val paidAmount: Double = 0.0,
    @SerializedName("dueDate") val dueDate: String = "",
    @SerializedName("status") val status: String = "Pending"
) {
    val totalAmount: Double
        get() = amount

    val title: String
        get() = rawTitle ?: student?.fullName ?: "Student Fee Record"
}

data class CreateFeeRequest(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("dueDate") val dueDate: String,
    @SerializedName("title") val title: String = ""
)

data class AddPaymentRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("paymentMode") val paymentMode: String
)

// Homework Model
data class Homework(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("class") val studentClass: String = "",
    @SerializedName("subject") val subject: Subject? = null,
    @SerializedName("dueDate") val dueDate: String = "",
    @SerializedName("teacher") val teacher: Teacher? = null
) {
    val targetClass: String
        get() = studentClass
}

data class CreateHomeworkRequest(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("class") val studentClass: String,
    @SerializedName("subjectId") val subjectId: String,
    @SerializedName("dueDate") val dueDate: String
)

// Exam Model
data class Exam(
    @SerializedName("_id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("class") val studentClass: String = "",
    @SerializedName("subject") val subject: Subject? = null,
    @SerializedName("maxMarks") val maxMarks: Int = 100,
    @SerializedName("examDate") val examDate: String = ""
) {
    val title: String
        get() = name

    val targetClass: String
        get() = studentClass
}

data class CreateExamRequest(
    @SerializedName("name") val name: String,
    @SerializedName("class") val studentClass: String,
    @SerializedName("subjectId") val subjectId: String,
    @SerializedName("maxMarks") val maxMarks: Int,
    @SerializedName("examDate") val examDate: String
)

// Announcement Model
data class Announcement(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("content") val content: String = "",
    @SerializedName("targetAudience") val targetAudience: String = "all",
    @SerializedName("createdAt") val createdAt: String = ""
)

data class CreateAnnouncementRequest(
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("targetAudience") val targetAudience: String = "all"
)

// Digital Resource Model
data class DigitalResource(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("fileUrl") val fileUrl: String = "",
    @SerializedName("fileType") val fileType: String = "",
    @SerializedName("class") val studentClass: String = "",
    @SerializedName("subject") val subject: Subject? = null
) {
    val category: String
        get() = fileType
}

data class CreateResourceRequest(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("fileUrl") val fileUrl: String,
    @SerializedName("fileType") val fileType: String,
    @SerializedName("class") val studentClass: String
)

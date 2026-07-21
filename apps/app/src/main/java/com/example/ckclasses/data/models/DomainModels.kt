package com.example.ckclasses.data.models

import com.google.gson.annotations.SerializedName

// Student Model
data class Student(
    @SerializedName("_id") val id: String = "",
    @SerializedName("studentId") val studentId: String = "",
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
)

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
    @SerializedName("user") val user: User? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("department") val department: String = "",
    @SerializedName("qualification") val qualification: String = "",
    @SerializedName("status") val status: String = "Active"
)

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
    @SerializedName("status") val status: String = "Present", // Present, Absent, Late, Excused
    @SerializedName("date") val date: String = "",
    @SerializedName("remarks") val remarks: String? = null
)

data class MarkAttendanceRequest(
    @SerializedName("class") val studentClass: String,
    @SerializedName("date") val date: String,
    @SerializedName("records") val records: List<AttendanceItem>
)

data class AttendanceItem(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("status") val status: String,
    @SerializedName("remarks") val remarks: String? = null
)

// Fee Model
data class FeeRecord(
    @SerializedName("_id") val id: String = "",
    @SerializedName("student") val student: Student? = null,
    @SerializedName("title") val title: String = "",
    @SerializedName("totalAmount") val totalAmount: Double = 0.0,
    @SerializedName("paidAmount") val paidAmount: Double = 0.0,
    @SerializedName("dueDate") val dueDate: String = "",
    @SerializedName("status") val status: String = "Pending" // Paid, Partial, Pending, Overdue
)

data class CollectFeeRequest(
    @SerializedName("studentId") val studentId: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("paymentMode") val paymentMode: String = "Cash"
)

// Homework Model
data class Homework(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("class") val targetClass: String = "",
    @SerializedName("subject") val subject: Subject? = null,
    @SerializedName("dueDate") val dueDate: String = "",
    @SerializedName("createdAt") val createdAt: String = ""
)

data class CreateHomeworkRequest(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("class") val targetClass: String,
    @SerializedName("subjectId") val subjectId: String,
    @SerializedName("dueDate") val dueDate: String
)

// Exam Model
data class Exam(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("class") val targetClass: String = "",
    @SerializedName("subject") val subject: Subject? = null,
    @SerializedName("maxMarks") val maxMarks: Int = 100,
    @SerializedName("examDate") val examDate: String = ""
)

data class CreateExamRequest(
    @SerializedName("title") val title: String,
    @SerializedName("class") val targetClass: String,
    @SerializedName("subjectId") val subjectId: String,
    @SerializedName("maxMarks") val maxMarks: Int,
    @SerializedName("examDate") val examDate: String
)

// Announcement Model
data class Announcement(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("content") val content: String = "",
    @SerializedName("targetAudience") val targetAudience: String = "All",
    @SerializedName("createdAt") val createdAt: String = ""
)

data class CreateAnnouncementRequest(
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("targetAudience") val targetAudience: String = "All"
)

// Digital Resource Model
data class DigitalResource(
    @SerializedName("_id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("fileUrl") val fileUrl: String = "",
    @SerializedName("category") val category: String = "General",
    @SerializedName("uploadedAt") val uploadedAt: String = ""
)

data class CreateResourceRequest(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("fileUrl") val fileUrl: String,
    @SerializedName("category") val category: String = "General"
)

// Dashboard Stats Model
data class DashboardStats(
    @SerializedName("totalStudents") val totalStudents: Int = 0,
    @SerializedName("totalTeachers") val totalTeachers: Int = 0,
    @SerializedName("totalSubjects") val totalSubjects: Int = 0,
    @SerializedName("todayAttendancePercentage") val todayAttendancePercentage: Double = 0.0,
    @SerializedName("pendingFeesTotal") val pendingFeesTotal: Double = 0.0
)

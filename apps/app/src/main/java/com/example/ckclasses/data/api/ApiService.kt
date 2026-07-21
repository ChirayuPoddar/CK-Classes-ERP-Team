package com.example.ckclasses.data.api

import com.example.ckclasses.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth Routes
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponseData>>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<ApiResponse<LoginResponseData>>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>

    @POST("auth/refresh")
    suspend fun refreshToken(): Response<ApiResponse<Unit>>

    @POST("auth/activate/initiate")
    suspend fun initiateActivation(@Body request: InitiateActivationRequest): Response<ApiResponse<InitiateActivationData>>

    @POST("auth/activate/verify")
    suspend fun verifyActivation(@Body request: VerifyActivationRequest): Response<ApiResponse<Unit>>

    @POST("auth/forgot-password/initiate")
    suspend fun initiateForgotPassword(@Body request: ForgotPasswordInitiateRequest): Response<ApiResponse<Unit>>

    @POST("auth/forgot-password/verify-otp")
    suspend fun verifyForgotPasswordOtp(@Body request: VerifyOtpRequest): Response<ApiResponse<Unit>>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<ApiResponse<Unit>>

    // Students
    @GET("students")
    suspend fun getStudents(): Response<ApiResponse<List<Student>>>

    @POST("students")
    suspend fun createStudent(@Body request: CreateStudentRequest): Response<ApiResponse<Student>>

    @PUT("students/{id}")
    suspend fun updateStudent(@Path("id") id: String, @Body request: CreateStudentRequest): Response<ApiResponse<Student>>

    @DELETE("students/{id}")
    suspend fun deleteStudent(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Teachers
    @GET("teachers")
    suspend fun getTeachers(): Response<ApiResponse<List<Teacher>>>

    @POST("teachers")
    suspend fun createTeacher(@Body request: CreateTeacherRequest): Response<ApiResponse<Teacher>>

    @PUT("teachers/{id}")
    suspend fun updateTeacher(@Path("id") id: String, @Body request: CreateTeacherRequest): Response<ApiResponse<Teacher>>

    @DELETE("teachers/{id}")
    suspend fun deleteTeacher(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Subjects
    @GET("subjects")
    suspend fun getSubjects(): Response<ApiResponse<List<Subject>>>

    @POST("subjects")
    suspend fun createSubject(@Body request: CreateSubjectRequest): Response<ApiResponse<Subject>>

    // Attendance
    @GET("attendance")
    suspend fun getAttendance(
        @Query("class") studentClass: String? = null,
        @Query("date") date: String? = null
    ): Response<ApiResponse<List<AttendanceRecord>>>

    @POST("attendance")
    suspend fun markAttendance(@Body request: MarkAttendanceRequest): Response<ApiResponse<Unit>>

    // Fees
    @GET("fees")
    suspend fun getFees(): Response<ApiResponse<List<FeeRecord>>>

    @POST("fees/collect")
    suspend fun collectFee(@Body request: CollectFeeRequest): Response<ApiResponse<Unit>>

    // Homework
    @GET("homework")
    suspend fun getHomework(): Response<ApiResponse<List<Homework>>>

    @POST("homework")
    suspend fun createHomework(@Body request: CreateHomeworkRequest): Response<ApiResponse<Homework>>

    // Exams
    @GET("exams")
    suspend fun getExams(): Response<ApiResponse<List<Exam>>>

    @POST("exams")
    suspend fun createExam(@Body request: CreateExamRequest): Response<ApiResponse<Exam>>

    // Announcements
    @GET("announcements")
    suspend fun getAnnouncements(): Response<ApiResponse<List<Announcement>>>

    @POST("announcements")
    suspend fun createAnnouncement(@Body request: CreateAnnouncementRequest): Response<ApiResponse<Announcement>>

    // Digital Resources
    @GET("resources")
    suspend fun getResources(): Response<ApiResponse<List<DigitalResource>>>

    @POST("resources")
    suspend fun createResource(@Body request: CreateResourceRequest): Response<ApiResponse<DigitalResource>>

    // Users
    @GET("users")
    suspend fun getUsers(): Response<ApiResponse<List<User>>>
}

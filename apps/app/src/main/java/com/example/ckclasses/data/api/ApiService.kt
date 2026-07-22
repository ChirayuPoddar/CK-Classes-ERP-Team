package com.example.ckclasses.data.api

import com.example.ckclasses.data.models.*
import com.google.gson.JsonElement
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
    suspend fun getStudents(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("students")
    suspend fun createStudent(@Body request: CreateStudentRequest): Response<ApiResponse<Student>>

    @PUT("students/{id}")
    suspend fun updateStudent(@Path("id") id: String, @Body request: CreateStudentRequest): Response<ApiResponse<Student>>

    @DELETE("students/{id}")
    suspend fun deleteStudent(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Teachers
    @GET("teachers")
    suspend fun getTeachers(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("teachers")
    suspend fun createTeacher(@Body request: CreateTeacherRequest): Response<ApiResponse<Teacher>>

    @PUT("teachers/{id}")
    suspend fun updateTeacher(@Path("id") id: String, @Body request: CreateTeacherRequest): Response<ApiResponse<Teacher>>

    @DELETE("teachers/{id}")
    suspend fun deleteTeacher(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Subjects
    @GET("subjects")
    suspend fun getSubjects(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("subjects")
    suspend fun createSubject(@Body request: CreateSubjectRequest): Response<ApiResponse<Subject>>

    @PUT("subjects/{id}")
    suspend fun updateSubject(@Path("id") id: String, @Body request: CreateSubjectRequest): Response<ApiResponse<Subject>>

    @DELETE("subjects/{id}")
    suspend fun deleteSubject(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Attendance
    @GET("attendance")
    suspend fun getAttendance(
        @Query("class") studentClass: String? = null,
        @Query("date") date: String? = null,
        @Query("limit") limit: Int = 1000
    ): Response<ApiResponse<JsonElement>>

    @POST("attendance")
    suspend fun markAttendance(@Body request: MarkAttendanceRequest): Response<ApiResponse<Unit>>

    // Fees - endpoint in Express is student-fees
    @GET("student-fees")
    suspend fun getFees(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("student-fees")
    suspend fun createFee(@Body request: CreateFeeRequest): Response<ApiResponse<FeeRecord>>

    @PUT("student-fees/{id}")
    suspend fun updateFee(@Path("id") id: String, @Body request: CreateFeeRequest): Response<ApiResponse<FeeRecord>>

    @POST("student-fees/{id}/payments")
    suspend fun addPayment(@Path("id") id: String, @Body request: AddPaymentRequest): Response<ApiResponse<Unit>>

    @DELETE("student-fees/{id}")
    suspend fun deleteFee(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Homework
    @GET("homework")
    suspend fun getHomework(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("homework")
    suspend fun createHomework(@Body request: CreateHomeworkRequest): Response<ApiResponse<Homework>>

    @PUT("homework/{id}")
    suspend fun updateHomework(@Path("id") id: String, @Body request: CreateHomeworkRequest): Response<ApiResponse<Homework>>

    @DELETE("homework/{id}")
    suspend fun deleteHomework(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Exams
    @GET("exams")
    suspend fun getExams(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("exams")
    suspend fun createExam(@Body request: CreateExamRequest): Response<ApiResponse<Exam>>

    @PUT("exams/{id}")
    suspend fun updateExam(@Path("id") id: String, @Body request: CreateExamRequest): Response<ApiResponse<Exam>>

    @DELETE("exams/{id}")
    suspend fun deleteExam(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Announcements
    @GET("announcements")
    suspend fun getAnnouncements(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("announcements")
    suspend fun createAnnouncement(@Body request: CreateAnnouncementRequest): Response<ApiResponse<Announcement>>

    @PUT("announcements/{id}")
    suspend fun updateAnnouncement(@Path("id") id: String, @Body request: CreateAnnouncementRequest): Response<ApiResponse<Announcement>>

    @DELETE("announcements/{id}")
    suspend fun deleteAnnouncement(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Digital Resources
    @GET("resources")
    suspend fun getResources(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @POST("resources")
    suspend fun createResource(@Body request: CreateResourceRequest): Response<ApiResponse<DigitalResource>>

    @DELETE("resources/{id}")
    suspend fun deleteResource(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Users
    @GET("users")
    suspend fun getUsers(@Query("limit") limit: Int = 1000): Response<ApiResponse<JsonElement>>

    @PATCH("users/{id}")
    suspend fun updateUserRole(@Path("id") id: String, @Body request: Map<String, String>): Response<ApiResponse<User>>

    @PATCH("users/{id}/block")
    suspend fun blockUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    @PATCH("users/{id}/unblock")
    suspend fun unblockUser(@Path("id") id: String): Response<ApiResponse<Unit>>

    // AI Assistant
    @POST("ai/query")
    suspend fun queryAi(@Body request: AiQueryRequest): Response<ApiResponse<AiQueryResponseData>>
}

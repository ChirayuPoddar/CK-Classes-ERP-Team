package com.example.ckclasses.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("_id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("role") val role: String = "student",
    @SerializedName("institutionId") val institutionId: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("isActivated") val isActivated: Boolean = true,
    @SerializedName("avatar") val avatar: String? = null,
    @SerializedName("linkedChildren") val linkedChildren: List<User>? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponseData(
    @SerializedName("user") val user: User
)

data class InitiateActivationRequest(
    @SerializedName("institutionId") val institutionId: String
)

data class InitiateActivationData(
    @SerializedName("emailMasked") val emailMasked: String? = null,
    @SerializedName("cooldownRemaining") val cooldownRemaining: Int? = null
)

data class VerifyActivationRequest(
    @SerializedName("institutionId") val institutionId: String,
    @SerializedName("otp") val otp: String,
    @SerializedName("password") val password: String
)

data class ForgotPasswordInitiateRequest(
    @SerializedName("email") val email: String
)

data class VerifyOtpRequest(
    @SerializedName("email") val email: String,
    @SerializedName("otp") val otp: String
)

data class ResetPasswordRequest(
    @SerializedName("token") val token: String,
    @SerializedName("newPassword") val newPassword: String
)

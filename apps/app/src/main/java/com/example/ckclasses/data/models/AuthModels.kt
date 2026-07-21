package com.example.ckclasses.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("_id") val mongoId: String = "",
    @SerializedName("id") val id: String = "",
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("name") val rawName: String? = null,
    @SerializedName("email") val email: String = "",
    @SerializedName("role") val role: String = "student",
    @SerializedName("institutionId") val institutionId: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("isActivated") val isActivated: Boolean = true,
    @SerializedName("avatar") val avatar: String? = null,
    @SerializedName("linkedChildren") val linkedChildren: List<User>? = null
) {
    val name: String
        get() {
            if (!rawName.isNullOrEmpty()) return rawName
            val full = listOfNotNull(firstName, lastName).joinToString(" ").trim()
            return if (full.isNotEmpty()) full else email
        }

    val userId: String
        get() = if (id.isNotEmpty()) id else mongoId
}

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponseData(
    @SerializedName("user") val user: User? = null
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

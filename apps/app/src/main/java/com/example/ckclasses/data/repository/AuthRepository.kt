package com.example.ckclasses.data.repository

import com.example.ckclasses.data.api.ApiService
import com.example.ckclasses.data.models.*
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(private val apiService: ApiService) {

    suspend fun login(request: LoginRequest): NetworkResult<LoginResponseData> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.login(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(response.body()?.data, response.body()?.message)
                } else {
                    val errorMsg = response.body()?.error
                        ?: response.body()?.message
                        ?: "Login failed (${response.code()})"
                    NetworkResult.Error(errorMsg)
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network connection error")
            }
        }

    suspend fun getCurrentUser(): NetworkResult<LoginResponseData> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getCurrentUser()
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(response.body()?.data)
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Session expired")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Failed to verify session")
            }
        }

    suspend fun logout(): NetworkResult<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.logout()
                if (response.isSuccessful) {
                    NetworkResult.Success(Unit, "Logged out successfully")
                } else {
                    NetworkResult.Error("Logout failed")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Logout error")
            }
        }

    suspend fun initiateActivation(request: InitiateActivationRequest): NetworkResult<InitiateActivationData> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.initiateActivation(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(response.body()?.data, response.body()?.message)
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Activation request failed")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Activation error")
            }
        }

    suspend fun verifyActivation(request: VerifyActivationRequest): NetworkResult<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.verifyActivation(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(Unit, response.body()?.message ?: "Account activated successfully")
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Verification failed")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Activation verification error")
            }
        }

    suspend fun initiateForgotPassword(email: String): NetworkResult<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.initiateForgotPassword(ForgotPasswordInitiateRequest(email))
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(Unit, response.body()?.message ?: "OTP sent to email")
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Failed to send reset OTP")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network error")
            }
        }

    suspend fun verifyForgotPasswordOtp(email: String, otp: String): NetworkResult<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.verifyForgotPasswordOtp(VerifyOtpRequest(email, otp))
                if (response.isSuccessful && response.body()?.success == true) {
                    val token = response.body()?.resetToken ?: ""
                    NetworkResult.Success(token, "OTP verified")
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Invalid OTP")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network error")
            }
        }

    suspend fun resetPassword(token: String, newPassword: String): NetworkResult<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.resetPassword(ResetPasswordRequest(token, newPassword))
                if (response.isSuccessful && response.body()?.success == true) {
                    NetworkResult.Success(Unit, response.body()?.message ?: "Password reset successful")
                } else {
                    NetworkResult.Error(response.body()?.error ?: "Password reset failed")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network error")
            }
        }
}

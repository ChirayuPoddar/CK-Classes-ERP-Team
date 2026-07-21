package com.example.ckclasses.data.repository

import android.util.Log
import com.example.ckclasses.data.api.ApiService
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.*
import com.example.ckclasses.utils.NetworkResult
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(private val apiService: ApiService) {

    private val TAG = "AuthRepository"

    suspend fun login(request: LoginRequest): NetworkResult<User> =
        withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Attempting login for: ${request.email}")
                val response = apiService.login(request)
                Log.d(TAG, "Login response code: ${response.code()}, isSuccessful: ${response.isSuccessful}")

                if (response.isSuccessful) {
                    val body = response.body()
                    Log.d(TAG, "Login body success=${body?.success}, user=${body?.user?.email}, accessToken=${body?.accessToken?.take(20)}")

                    if (body?.success == true) {
                        val user = body.user ?: body.data?.user
                        val token = body.accessToken ?: body.token
                        if (!token.isNullOrEmpty()) {
                            RetrofitClient.authToken = token
                            Log.d(TAG, "Auth token set: ${token.take(20)}...")
                        } else {
                            Log.w(TAG, "No access token in login response!")
                        }
                        if (user != null) {
                            NetworkResult.Success(user, body.message)
                        } else {
                            Log.e(TAG, "Login response missing user data")
                            NetworkResult.Error("Login response missing user data")
                        }
                    } else {
                        val errMsg = body?.getErrorMessage() ?: "Login failed"
                        Log.e(TAG, "Login body success=false: $errMsg")
                        NetworkResult.Error(errMsg)
                    }
                } else {
                    // HTTP error (401, 500, etc.) - parse error body
                    val errorBody = response.errorBody()?.string()
                    Log.e(TAG, "Login HTTP error ${response.code()}: $errorBody")
                    val errMsg = try {
                        val errResponse = Gson().fromJson(errorBody, ApiResponse::class.java)
                        errResponse?.getErrorMessage() ?: "Login failed (${response.code()})"
                    } catch (e: Exception) {
                        "Login failed (${response.code()})"
                    }
                    NetworkResult.Error(errMsg)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Login exception: ${e.message}", e)
                NetworkResult.Error(e.localizedMessage ?: "Network connection error")
            }
        }

    suspend fun getCurrentUser(): NetworkResult<User> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getCurrentUser()
                if (response.isSuccessful && response.body()?.success == true) {
                    val body = response.body()
                    val user = body?.user ?: body?.data?.user
                    val token = body?.accessToken ?: body?.token
                    if (!token.isNullOrEmpty()) {
                        RetrofitClient.authToken = token
                    }
                    if (user != null) {
                        NetworkResult.Success(user)
                    } else {
                        NetworkResult.Error("User session missing")
                    }
                } else {
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Session expired")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Failed to verify session")
            }
        }

    suspend fun logout(): NetworkResult<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.logout()
                RetrofitClient.authToken = null
                if (response.isSuccessful) {
                    NetworkResult.Success(Unit, "Logged out successfully")
                } else {
                    NetworkResult.Error("Logout failed")
                }
            } catch (e: Exception) {
                RetrofitClient.authToken = null
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
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Activation request failed")
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
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Verification failed")
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
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Failed to send reset OTP")
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
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Invalid OTP")
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
                    NetworkResult.Error(response.body()?.getErrorMessage() ?: "Password reset failed")
                }
            } catch (e: Exception) {
                NetworkResult.Error(e.localizedMessage ?: "Network error")
            }
        }
}

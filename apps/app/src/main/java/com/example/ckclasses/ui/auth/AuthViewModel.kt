package com.example.ckclasses.ui.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.*
import com.example.ckclasses.data.repository.AuthRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class AuthViewModel(
    private val repository: AuthRepository = AuthRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _loginState = MutableLiveData<NetworkResult<LoginResponseData>>()
    val loginState: LiveData<NetworkResult<LoginResponseData>> = _loginState

    private val _initiateActivateState = MutableLiveData<NetworkResult<InitiateActivationData>>()
    val initiateActivateState: LiveData<NetworkResult<InitiateActivationData>> = _initiateActivateState

    private val _verifyActivateState = MutableLiveData<NetworkResult<Unit>>()
    val verifyActivateState: LiveData<NetworkResult<Unit>> = _verifyActivateState

    private val _forgotPasswordState = MutableLiveData<NetworkResult<Unit>>()
    val forgotPasswordState: LiveData<NetworkResult<Unit>> = _forgotPasswordState

    private val _verifyOtpState = MutableLiveData<NetworkResult<String>>()
    val verifyOtpState: LiveData<NetworkResult<String>> = _verifyOtpState

    private val _resetPasswordState = MutableLiveData<NetworkResult<Unit>>()
    val resetPasswordState: LiveData<NetworkResult<Unit>> = _resetPasswordState

    fun login(email: String, password: String) {
        _loginState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _loginState.value = repository.login(LoginRequest(email, password))
        }
    }

    fun initiateActivation(institutionId: String) {
        _initiateActivateState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _initiateActivateState.value = repository.initiateActivation(InitiateActivationRequest(institutionId))
        }
    }

    fun verifyActivation(institutionId: String, otp: String, password: String) {
        _verifyActivateState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _verifyActivateState.value = repository.verifyActivation(VerifyActivationRequest(institutionId, otp, password))
        }
    }

    fun initiateForgotPassword(email: String) {
        _forgotPasswordState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _forgotPasswordState.value = repository.initiateForgotPassword(email)
        }
    }

    fun verifyForgotPasswordOtp(email: String, otp: String) {
        _verifyOtpState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _verifyOtpState.value = repository.verifyForgotPasswordOtp(email, otp)
        }
    }

    fun resetPassword(token: String, newPassword: String) {
        _resetPasswordState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _resetPasswordState.value = repository.resetPassword(token, newPassword)
        }
    }
}

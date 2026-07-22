package com.example.ckclasses.ui.fees

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateFeeRequest
import com.example.ckclasses.data.models.AddPaymentRequest
import com.example.ckclasses.data.models.FeeRecord
import com.example.ckclasses.data.repository.FeeRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class FeeViewModel(
    private val repository: FeeRepository = FeeRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _feesState = MutableLiveData<NetworkResult<List<FeeRecord>>>()
    val feesState: LiveData<NetworkResult<List<FeeRecord>>> = _feesState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadFees() {
        _feesState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _feesState.value = repository.getFees()
        }
    }

    fun createFee(req: CreateFeeRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createFee(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Fee created successfully")
                loadFees()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create fee")
            }
        }
    }

    fun updateFee(id: String, req: CreateFeeRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateFee(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Fee updated successfully")
                loadFees()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update fee")
            }
        }
    }

    fun addPayment(id: String, req: AddPaymentRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.addPayment(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Payment recorded successfully")
                loadFees()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to record payment")
            }
        }
    }

    fun deleteFee(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteFee(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Fee deleted successfully")
                loadFees()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete fee")
            }
        }
    }
}

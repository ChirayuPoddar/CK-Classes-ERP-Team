package com.example.ckclasses.ui.homework

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateHomeworkRequest
import com.example.ckclasses.data.models.Homework
import com.example.ckclasses.data.repository.HomeworkRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class HomeworkViewModel(
    private val repository: HomeworkRepository = HomeworkRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _homeworkState = MutableLiveData<NetworkResult<List<Homework>>>()
    val homeworkState: LiveData<NetworkResult<List<Homework>>> = _homeworkState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadHomework() {
        _homeworkState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _homeworkState.value = repository.getHomework()
        }
    }

    fun createHomework(req: CreateHomeworkRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createHomework(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Homework created successfully")
                loadHomework()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create homework")
            }
        }
    }

    fun updateHomework(id: String, req: CreateHomeworkRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateHomework(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Homework updated successfully")
                loadHomework()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update homework")
            }
        }
    }

    fun deleteHomework(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteHomework(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Homework deleted successfully")
                loadHomework()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete homework")
            }
        }
    }
}

package com.example.ckclasses.ui.exams

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateExamRequest
import com.example.ckclasses.data.models.Exam
import com.example.ckclasses.data.repository.ExamRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class ExamViewModel(
    private val repository: ExamRepository = ExamRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _examsState = MutableLiveData<NetworkResult<List<Exam>>>()
    val examsState: LiveData<NetworkResult<List<Exam>>> = _examsState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadExams() {
        _examsState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _examsState.value = repository.getExams()
        }
    }

    fun createExam(req: CreateExamRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createExam(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Exam created successfully")
                loadExams()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create exam")
            }
        }
    }

    fun updateExam(id: String, req: CreateExamRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateExam(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Exam updated successfully")
                loadExams()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update exam")
            }
        }
    }

    fun deleteExam(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteExam(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Exam deleted successfully")
                loadExams()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete exam")
            }
        }
    }
}

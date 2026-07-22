package com.example.ckclasses.ui.subjects

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateSubjectRequest
import com.example.ckclasses.data.models.Subject
import com.example.ckclasses.data.repository.SubjectRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class SubjectViewModel(
    private val repository: SubjectRepository = SubjectRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _subjectsState = MutableLiveData<NetworkResult<List<Subject>>>()
    val subjectsState: LiveData<NetworkResult<List<Subject>>> = _subjectsState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadSubjects() {
        _subjectsState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _subjectsState.value = repository.getSubjects()
        }
    }

    fun createSubject(req: CreateSubjectRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createSubject(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Subject created successfully")
                loadSubjects()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create subject")
            }
        }
    }

    fun updateSubject(id: String, req: CreateSubjectRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateSubject(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Subject updated successfully")
                loadSubjects()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update subject")
            }
        }
    }

    fun deleteSubject(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteSubject(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Subject deleted successfully")
                loadSubjects()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete subject")
            }
        }
    }
}

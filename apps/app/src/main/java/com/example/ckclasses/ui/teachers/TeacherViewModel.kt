package com.example.ckclasses.ui.teachers

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.data.repository.TeacherRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class TeacherViewModel(
    private val repository: TeacherRepository = TeacherRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _teachersState = MutableLiveData<NetworkResult<List<Teacher>>>()
    val teachersState: LiveData<NetworkResult<List<Teacher>>> = _teachersState

    fun loadTeachers() {
        _teachersState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _teachersState.value = repository.getTeachers()
        }
    }

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun createTeacher(req: com.example.ckclasses.data.models.CreateTeacherRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createTeacher(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Teacher created successfully")
                loadTeachers()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create teacher")
            }
        }
    }

    fun updateTeacher(id: String, req: com.example.ckclasses.data.models.CreateTeacherRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateTeacher(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Teacher updated successfully")
                loadTeachers()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update teacher")
            }
        }
    }

    fun deleteTeacher(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteTeacher(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Teacher deleted successfully")
                loadTeachers()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete teacher")
            }
        }
    }
}

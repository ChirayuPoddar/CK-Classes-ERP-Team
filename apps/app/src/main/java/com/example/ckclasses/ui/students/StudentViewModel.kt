package com.example.ckclasses.ui.students

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.data.repository.StudentRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class StudentViewModel(
    private val repository: StudentRepository = StudentRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _studentsState = MutableLiveData<NetworkResult<List<Student>>>()
    val studentsState: LiveData<NetworkResult<List<Student>>> = _studentsState

    fun loadStudents() {
        _studentsState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _studentsState.value = repository.getStudents()
        }
    }

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun createStudent(req: com.example.ckclasses.data.models.CreateStudentRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createStudent(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Student created successfully")
                loadStudents()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create student")
            }
        }
    }

    fun updateStudent(id: String, req: com.example.ckclasses.data.models.CreateStudentRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateStudent(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Student updated successfully")
                loadStudents()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update student")
            }
        }
    }

    fun deleteStudent(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteStudent(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Student deleted successfully")
                loadStudents()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete student")
            }
        }
    }
}

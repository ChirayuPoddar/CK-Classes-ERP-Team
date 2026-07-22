package com.example.ckclasses.ui.users

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.User
import com.example.ckclasses.data.repository.UserRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class UserViewModel(
    private val repository: UserRepository = UserRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _usersState = MutableLiveData<NetworkResult<List<User>>>()
    val usersState: LiveData<NetworkResult<List<User>>> = _usersState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadUsers() {
        _usersState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _usersState.value = repository.getUsers()
        }
    }

    fun updateUserRole(id: String, role: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateUserRole(id, role)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Role updated successfully")
                loadUsers()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update role")
            }
        }
    }

    fun toggleBlockStatus(id: String, isCurrentlyBlocked: Boolean) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.toggleBlockStatus(id, isCurrentlyBlocked)
            if (result is NetworkResult.Success) {
                val action = if (isCurrentlyBlocked) "unblocked" else "blocked"
                _actionState.value = NetworkResult.Success("User $action successfully")
                loadUsers()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to change block status")
            }
        }
    }
}

package com.example.ckclasses.ui.resources

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateResourceRequest
import com.example.ckclasses.data.models.DigitalResource
import com.example.ckclasses.data.repository.ResourceRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class ResourceViewModel(
    private val repository: ResourceRepository = ResourceRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _resourcesState = MutableLiveData<NetworkResult<List<DigitalResource>>>()
    val resourcesState: LiveData<NetworkResult<List<DigitalResource>>> = _resourcesState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadResources() {
        _resourcesState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _resourcesState.value = repository.getResources()
        }
    }

    fun createResource(req: CreateResourceRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createResource(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Resource created successfully")
                loadResources()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create resource")
            }
        }
    }

    fun deleteResource(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteResource(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Resource deleted successfully")
                loadResources()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete resource")
            }
        }
    }
}

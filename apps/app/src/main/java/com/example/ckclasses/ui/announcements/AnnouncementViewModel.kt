package com.example.ckclasses.ui.announcements

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.CreateAnnouncementRequest
import com.example.ckclasses.data.models.Announcement
import com.example.ckclasses.data.repository.AnnouncementRepository
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class AnnouncementViewModel(
    private val repository: AnnouncementRepository = AnnouncementRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _announcementsState = MutableLiveData<NetworkResult<List<Announcement>>>()
    val announcementsState: LiveData<NetworkResult<List<Announcement>>> = _announcementsState

    private val _actionState = MutableLiveData<NetworkResult<String>>()
    val actionState: LiveData<NetworkResult<String>> = _actionState

    fun loadAnnouncements() {
        _announcementsState.value = NetworkResult.Loading()
        viewModelScope.launch {
            _announcementsState.value = repository.getAnnouncements()
        }
    }

    fun createAnnouncement(req: CreateAnnouncementRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.createAnnouncement(req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Announcement created successfully")
                loadAnnouncements()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to create announcement")
            }
        }
    }

    fun updateAnnouncement(id: String, req: CreateAnnouncementRequest) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.updateAnnouncement(id, req)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Announcement updated successfully")
                loadAnnouncements()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to update announcement")
            }
        }
    }

    fun deleteAnnouncement(id: String) {
        _actionState.value = NetworkResult.Loading()
        viewModelScope.launch {
            val result = repository.deleteAnnouncement(id)
            if (result is NetworkResult.Success) {
                _actionState.value = NetworkResult.Success("Announcement deleted successfully")
                loadAnnouncements()
            } else {
                _actionState.value = NetworkResult.Error(result.message ?: "Failed to delete announcement")
            }
        }
    }
}

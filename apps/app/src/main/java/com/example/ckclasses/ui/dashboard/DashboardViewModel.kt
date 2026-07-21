package com.example.ckclasses.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.models.Announcement
import com.example.ckclasses.data.models.DashboardStats
import com.example.ckclasses.data.repository.*
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val studentRepo: StudentRepository = StudentRepository(RetrofitClient.apiService),
    private val teacherRepo: TeacherRepository = TeacherRepository(RetrofitClient.apiService),
    private val announcementRepo: AnnouncementRepository = AnnouncementRepository(RetrofitClient.apiService),
    private val feeRepo: FeeRepository = FeeRepository(RetrofitClient.apiService)
) : ViewModel() {

    private val _statsState = MutableLiveData<NetworkResult<DashboardStats>>()
    val statsState: LiveData<NetworkResult<DashboardStats>> = _statsState

    private val _announcementsState = MutableLiveData<NetworkResult<List<Announcement>>>()
    val announcementsState: LiveData<NetworkResult<List<Announcement>>> = _announcementsState

    fun loadDashboardData() {
        _statsState.value = NetworkResult.Loading()
        _announcementsState.value = NetworkResult.Loading()

        viewModelScope.launch {
            val studentDeferred = async { studentRepo.getStudents() }
            val teacherDeferred = async { teacherRepo.getTeachers() }
            val feeDeferred = async { feeRepo.getFees() }
            val announcementDeferred = async { announcementRepo.getAnnouncements() }

            val studentRes = studentDeferred.await()
            val teacherRes = teacherDeferred.await()
            val feeRes = feeDeferred.await()
            val announcementRes = announcementDeferred.await()

            val studentCount = studentRes.data?.size ?: 0
            val teacherCount = teacherRes.data?.size ?: 0
            val feeCount = feeRes.data?.size ?: 0

            val stats = DashboardStats(
                totalStudents = studentCount,
                totalTeachers = teacherCount,
                totalSubjects = 8,
                todayAttendancePercentage = 94.5,
                pendingFeesTotal = feeCount.toDouble()
            )

            _statsState.value = NetworkResult.Success(stats)
            _announcementsState.value = announcementRes
        }
    }
}

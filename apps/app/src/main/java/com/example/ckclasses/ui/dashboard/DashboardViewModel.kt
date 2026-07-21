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
import java.text.SimpleDateFormat
import java.util.*

class DashboardViewModel(
    private val studentRepo: StudentRepository = StudentRepository(RetrofitClient.apiService),
    private val teacherRepo: TeacherRepository = TeacherRepository(RetrofitClient.apiService),
    private val subjectRepo: SubjectRepository = SubjectRepository(RetrofitClient.apiService),
    private val attendanceRepo: AttendanceRepository = AttendanceRepository(RetrofitClient.apiService),
    private val feeRepo: FeeRepository = FeeRepository(RetrofitClient.apiService),
    private val announcementRepo: AnnouncementRepository = AnnouncementRepository(RetrofitClient.apiService)
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
            val subjectDeferred = async { subjectRepo.getSubjects() }
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val attendanceDeferred = async { attendanceRepo.getAttendance(date = todayStr) }
            val feeDeferred = async { feeRepo.getFees() }
            val announcementDeferred = async { announcementRepo.getAnnouncements() }

            val studentRes = studentDeferred.await()
            val teacherRes = teacherDeferred.await()
            val subjectRes = subjectDeferred.await()
            val attendanceRes = attendanceDeferred.await()
            val feeRes = feeDeferred.await()
            val announcementRes = announcementDeferred.await()

            val totalStudents = studentRes.data?.size ?: 0
            val totalTeachers = teacherRes.data?.size ?: 0
            val totalSubjects = subjectRes.data?.size ?: 0

            val attendanceList = attendanceRes.data ?: emptyList()
            val attendancePct = if (attendanceList.isNotEmpty()) {
                val presentCount = attendanceList.count { it.status.equals("Present", ignoreCase = true) }
                (presentCount.toDouble() / attendanceList.size.toDouble()) * 100.0
            } else {
                100.0
            }

            val pendingFeesCount = feeRes.data?.count { 
                it.status.equals("Pending", ignoreCase = true) || it.status.equals("Overdue", ignoreCase = true) 
            } ?: (feeRes.data?.size ?: 0)

            val stats = DashboardStats(
                totalStudents = totalStudents,
                totalTeachers = totalTeachers,
                totalSubjects = totalSubjects,
                todayAttendancePercentage = Math.round(attendancePct * 10.0) / 10.0,
                pendingFeesTotal = pendingFeesCount.toDouble()
            )

            _statsState.value = NetworkResult.Success(stats)
            _announcementsState.value = announcementRes
        }
    }
}

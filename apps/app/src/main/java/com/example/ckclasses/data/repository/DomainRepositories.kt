package com.example.ckclasses.data.repository

import com.example.ckclasses.data.api.ApiService
import com.example.ckclasses.data.models.*
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StudentRepository(private val apiService: ApiService) {
    suspend fun getStudents(): NetworkResult<List<Student>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getStudents()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Student>(preferredKey = "students") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: ${res.errorBody()?.string()?.take(100) ?: "Failed to fetch students"}"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createStudent(req: CreateStudentRequest): NetworkResult<Student> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createStudent(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Student created successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create student")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateStudent(id: String, req: CreateStudentRequest): NetworkResult<Student> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateStudent(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Student updated successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update student")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteStudent(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteStudent(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Student deleted successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete student")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class TeacherRepository(private val apiService: ApiService) {
    suspend fun getTeachers(): NetworkResult<List<Teacher>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getTeachers()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Teacher>(preferredKey = "teachers") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: ${res.errorBody()?.string()?.take(100) ?: "Failed to fetch teachers"}"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createTeacher(req: CreateTeacherRequest): NetworkResult<Teacher> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createTeacher(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Teacher created successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create teacher")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateTeacher(id: String, req: CreateTeacherRequest): NetworkResult<Teacher> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateTeacher(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Teacher updated successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update teacher")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteTeacher(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteTeacher(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Teacher deleted successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete teacher")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class SubjectRepository(private val apiService: ApiService) {
    suspend fun getSubjects(): NetworkResult<List<Subject>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getSubjects()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Subject>(preferredKey = "subjects") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch subjects"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createSubject(req: CreateSubjectRequest): NetworkResult<Subject> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createSubject(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Subject created successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create subject")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateSubject(id: String, req: CreateSubjectRequest): NetworkResult<Subject> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateSubject(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Subject updated successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update subject")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteSubject(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteSubject(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Subject deleted successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete subject")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class AttendanceRepository(private val apiService: ApiService) {
    suspend fun getAttendance(studentClass: String? = null, date: String? = null): NetworkResult<List<AttendanceRecord>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getAttendance(studentClass, date)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<AttendanceRecord>(preferredKey = "attendance") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch attendance"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun markAttendance(req: MarkAttendanceRequest): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.markAttendance(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Attendance submitted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to mark attendance")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class FeeRepository(private val apiService: ApiService) {
    suspend fun getFees(): NetworkResult<List<FeeRecord>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getFees()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<FeeRecord>(preferredKey = "fees") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch fee records"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createFee(req: CreateFeeRequest): NetworkResult<FeeRecord> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createFee(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Fee created")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create fee")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateFee(id: String, req: CreateFeeRequest): NetworkResult<FeeRecord> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateFee(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Fee updated")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update fee")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun addPayment(id: String, req: AddPaymentRequest): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.addPayment(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Payment added")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to add payment")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteFee(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteFee(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Fee deleted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete fee")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class HomeworkRepository(private val apiService: ApiService) {
    suspend fun getHomework(): NetworkResult<List<Homework>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getHomework()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Homework>(preferredKey = "homework") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch homework"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createHomework(req: CreateHomeworkRequest): NetworkResult<Homework> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createHomework(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Homework created")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create homework")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateHomework(id: String, req: CreateHomeworkRequest): NetworkResult<Homework> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateHomework(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Homework updated")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update homework")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteHomework(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteHomework(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Homework deleted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete homework")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class ExamRepository(private val apiService: ApiService) {
    suspend fun getExams(): NetworkResult<List<Exam>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getExams()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Exam>(preferredKey = "exams") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch exams"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createExam(req: CreateExamRequest): NetworkResult<Exam> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createExam(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Exam created")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to create exam")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateExam(id: String, req: CreateExamRequest): NetworkResult<Exam> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateExam(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Exam updated")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update exam")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteExam(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteExam(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Exam deleted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete exam")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class AnnouncementRepository(private val apiService: ApiService) {
    suspend fun getAnnouncements(): NetworkResult<List<Announcement>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getAnnouncements()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<Announcement>(preferredKey = "announcements") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch announcements"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createAnnouncement(req: CreateAnnouncementRequest): NetworkResult<Announcement> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createAnnouncement(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Announcement published")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to publish announcement")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateAnnouncement(id: String, req: CreateAnnouncementRequest): NetworkResult<Announcement> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateAnnouncement(id, req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Announcement updated")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update announcement")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteAnnouncement(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteAnnouncement(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Announcement deleted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete announcement")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class ResourceRepository(private val apiService: ApiService) {
    suspend fun getResources(): NetworkResult<List<DigitalResource>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getResources()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<DigitalResource>(preferredKey = "resources") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch resources"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun createResource(req: CreateResourceRequest): NetworkResult<DigitalResource> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.createResource(req)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Resource uploaded")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to upload resource")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun deleteResource(id: String): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.deleteResource(id)
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(Unit, res.body()?.message ?: "Resource deleted")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to delete resource")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

class UserRepository(private val apiService: ApiService) {
    suspend fun getUsers(): NetworkResult<List<User>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getUsers()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.parseList<User>(preferredKey = "users") ?: emptyList()
                NetworkResult.Success(list)
            } else {
                val err = res.body()?.getErrorMessage() ?: "HTTP ${res.code()}: Failed to fetch users"
                NetworkResult.Error(err)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun updateUserRole(id: String, role: String): NetworkResult<User> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateUserRole(id, mapOf("role" to role))
            if (res.isSuccessful && res.body()?.success == true) {
                NetworkResult.Success(res.body()?.data, res.body()?.message ?: "Role updated")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to update role")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }

    suspend fun toggleBlockStatus(id: String, isBlocked: Boolean): NetworkResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val res = if (isBlocked) apiService.unblockUser(id) else apiService.blockUser(id)
            if (res.isSuccessful && res.body()?.success == true) {
                val action = if (isBlocked) "unblocked" else "blocked"
                NetworkResult.Success(Unit, res.body()?.message ?: "User $action successfully")
            } else {
                NetworkResult.Error(res.body()?.getErrorMessage() ?: "Failed to change block status")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.localizedMessage ?: "Network error")
        }
    }
}

package com.example.ckclasses.ui.students

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateStudentRequest
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.databinding.LayoutBottomSheetStudentBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class StudentBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetStudentBinding? = null
    private val binding get() = _binding!!

    // Use activityViewModels so it shares the same ViewModel instance as StudentsFragment
    private val viewModel: StudentViewModel by activityViewModels()

    private var editingStudent: Student? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetStudentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Check if we are editing an existing student
        val studentId = arguments?.getString(ARG_STUDENT_ID)
        val studentName = arguments?.getString(ARG_STUDENT_NAME)
        
        if (studentId != null) {
            binding.tvSheetTitle.text = "Edit Student"
            binding.btnSave.text = "Update Student"
            binding.btnDelete.visibility = View.VISIBLE
            
            // In a real app we'd fetch the full details, but for now we'll pre-fill what we passed
            binding.etName.setText(studentName)
            binding.etEmail.setText(arguments?.getString(ARG_STUDENT_EMAIL) ?: "")
            binding.etPhone.setText(arguments?.getString(ARG_STUDENT_PHONE) ?: "")
            binding.etClass.setText(arguments?.getString(ARG_STUDENT_CLASS) ?: "")
            binding.etSection.setText(arguments?.getString(ARG_STUDENT_SECTION) ?: "")
            binding.etRollNumber.setText(arguments?.getString(ARG_STUDENT_ROLL) ?: "")
            binding.etGuardianName.setText(arguments?.getString(ARG_STUDENT_GUARDIAN_NAME) ?: "")
            binding.etGuardianPhone.setText(arguments?.getString(ARG_STUDENT_GUARDIAN_PHONE) ?: "")

            binding.btnDelete.setOnClickListener {
                viewModel.deleteStudent(studentId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add New Student"
            binding.btnSave.text = "Save Student"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val phone = binding.etPhone.text.toString().trim()
            val studentClass = binding.etClass.text.toString().trim()
            val section = binding.etSection.text.toString().trim()
            val rollNumber = binding.etRollNumber.text.toString().trim()
            val guardianName = binding.etGuardianName.text.toString().trim()
            val guardianPhone = binding.etGuardianPhone.text.toString().trim()

            if (name.isEmpty() || studentClass.isEmpty()) {
                Toast.makeText(requireContext(), "Name and Class are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateStudentRequest(
                name = name,
                email = email,
                phone = phone,
                studentClass = studentClass,
                section = section,
                rollNumber = rollNumber,
                guardianName = guardianName,
                guardianPhone = guardianPhone
            )

            if (studentId != null) {
                viewModel.updateStudent(studentId, request)
            } else {
                viewModel.createStudent(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "StudentBottomSheet"
        
        private const val ARG_STUDENT_ID = "student_id"
        private const val ARG_STUDENT_NAME = "student_name"
        private const val ARG_STUDENT_EMAIL = "student_email"
        private const val ARG_STUDENT_PHONE = "student_phone"
        private const val ARG_STUDENT_CLASS = "student_class"
        private const val ARG_STUDENT_SECTION = "student_section"
        private const val ARG_STUDENT_ROLL = "student_roll"
        private const val ARG_STUDENT_GUARDIAN_NAME = "student_guardian_name"
        private const val ARG_STUDENT_GUARDIAN_PHONE = "student_guardian_phone"

        fun newInstance(student: Student? = null): StudentBottomSheetFragment {
            val fragment = StudentBottomSheetFragment()
            if (student != null) {
                val args = Bundle().apply {
                    putString(ARG_STUDENT_ID, student.id)
                    putString(ARG_STUDENT_NAME, student.fullName)
                    putString(ARG_STUDENT_EMAIL, student.email)
                    putString(ARG_STUDENT_PHONE, student.phone)
                    putString(ARG_STUDENT_CLASS, student.studentClass)
                    putString(ARG_STUDENT_SECTION, student.section)
                    putString(ARG_STUDENT_ROLL, student.rollNumber)
                    putString(ARG_STUDENT_GUARDIAN_NAME, student.guardianName)
                    putString(ARG_STUDENT_GUARDIAN_PHONE, student.guardianPhone)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

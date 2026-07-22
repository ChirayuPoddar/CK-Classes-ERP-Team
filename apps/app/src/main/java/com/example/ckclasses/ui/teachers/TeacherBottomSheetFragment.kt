package com.example.ckclasses.ui.teachers

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateTeacherRequest
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.databinding.LayoutBottomSheetTeacherBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class TeacherBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetTeacherBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TeacherViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetTeacherBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val teacherId = arguments?.getString(ARG_TEACHER_ID)
        val teacherName = arguments?.getString(ARG_TEACHER_NAME)
        
        if (teacherId != null) {
            binding.tvSheetTitle.text = "Edit Teacher"
            binding.btnSave.text = "Update Teacher"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etName.setText(teacherName)
            binding.etEmail.setText(arguments?.getString(ARG_TEACHER_EMAIL) ?: "")
            binding.etPhone.setText(arguments?.getString(ARG_TEACHER_PHONE) ?: "")
            binding.etDepartment.setText(arguments?.getString(ARG_TEACHER_DEPT) ?: "")
            binding.etQualification.setText(arguments?.getString(ARG_TEACHER_QUAL) ?: "")

            binding.btnDelete.setOnClickListener {
                viewModel.deleteTeacher(teacherId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add New Teacher"
            binding.btnSave.text = "Save Teacher"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val phone = binding.etPhone.text.toString().trim()
            val department = binding.etDepartment.text.toString().trim()
            val qualification = binding.etQualification.text.toString().trim()

            if (name.isEmpty()) {
                Toast.makeText(requireContext(), "Name is required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateTeacherRequest(
                name = name,
                email = email,
                phone = phone,
                department = department,
                qualification = qualification
            )

            if (teacherId != null) {
                viewModel.updateTeacher(teacherId, request)
            } else {
                viewModel.createTeacher(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "TeacherBottomSheet"
        
        private const val ARG_TEACHER_ID = "teacher_id"
        private const val ARG_TEACHER_NAME = "teacher_name"
        private const val ARG_TEACHER_EMAIL = "teacher_email"
        private const val ARG_TEACHER_PHONE = "teacher_phone"
        private const val ARG_TEACHER_DEPT = "teacher_dept"
        private const val ARG_TEACHER_QUAL = "teacher_qual"

        fun newInstance(teacher: Teacher? = null): TeacherBottomSheetFragment {
            val fragment = TeacherBottomSheetFragment()
            if (teacher != null) {
                val args = Bundle().apply {
                    putString(ARG_TEACHER_ID, teacher.id)
                    putString(ARG_TEACHER_NAME, teacher.fullName)
                    putString(ARG_TEACHER_EMAIL, teacher.email)
                    putString(ARG_TEACHER_PHONE, teacher.phone)
                    putString(ARG_TEACHER_DEPT, teacher.department)
                    putString(ARG_TEACHER_QUAL, teacher.qualification)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

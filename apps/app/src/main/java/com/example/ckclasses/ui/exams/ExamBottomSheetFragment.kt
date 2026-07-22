package com.example.ckclasses.ui.exams

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateExamRequest
import com.example.ckclasses.data.models.Exam
import com.example.ckclasses.databinding.LayoutBottomSheetExamBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class ExamBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetExamBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ExamViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetExamBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val examId = arguments?.getString(ARG_EXAM_ID)
        val examTitle = arguments?.getString(ARG_EXAM_TITLE)
        
        if (examId != null) {
            binding.tvSheetTitle.text = "Edit Exam"
            binding.btnSave.text = "Update Exam"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etTitle.setText(examTitle)
            binding.etClass.setText(arguments?.getString(ARG_EXAM_CLASS) ?: "")
            binding.etSubjectId.setText(arguments?.getString(ARG_EXAM_SUBJECT_ID) ?: "")
            binding.etDuration.setText(arguments?.getString(ARG_EXAM_DURATION) ?: "")
            binding.etMaxMarks.setText(arguments?.getString(ARG_EXAM_MAX_MARKS) ?: "")
            
            val dateStr = arguments?.getString(ARG_EXAM_DATE)
            if (!dateStr.isNullOrEmpty()) {
                binding.etDate.setText(dateStr.take(10)) // YYYY-MM-DD
            }

            binding.btnDelete.setOnClickListener {
                viewModel.deleteExam(examId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add Exam"
            binding.btnSave.text = "Save Exam"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val title = binding.etTitle.text.toString().trim()
            val targetClass = binding.etClass.text.toString().trim()
            val subjectId = binding.etSubjectId.text.toString().trim()
            val date = binding.etDate.text.toString().trim()
            val durationStr = binding.etDuration.text.toString().trim()

            if (title.isEmpty() || targetClass.isEmpty() || date.isEmpty() || durationStr.isEmpty()) {
                Toast.makeText(requireContext(), "All fields are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateExamRequest(
                name = title,
                studentClass = targetClass,
                subjectId = subjectId,
                maxMarks = durationStr.toIntOrNull() ?: 100, // Using duration as maxMarks for simplicity based on model
                examDate = date
            )

            if (examId != null) {
                viewModel.updateExam(examId, request)
            } else {
                viewModel.createExam(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "ExamBottomSheet"
        
        private const val ARG_EXAM_ID = "exam_id"
        private const val ARG_EXAM_TITLE = "exam_title"
        private const val ARG_EXAM_CLASS = "exam_class"
        private const val ARG_EXAM_SUBJECT_ID = "exam_subject_id"
        private const val ARG_EXAM_DATE = "exam_date"
        private const val ARG_EXAM_DURATION = "exam_duration"
        private const val ARG_EXAM_MAX_MARKS = "exam_max_marks"

        fun newInstance(exam: Exam? = null): ExamBottomSheetFragment {
            val fragment = ExamBottomSheetFragment()
            if (exam != null) {
                val args = Bundle().apply {
                    putString(ARG_EXAM_ID, exam.id)
                    putString(ARG_EXAM_TITLE, exam.title)
                    putString(ARG_EXAM_CLASS, exam.targetClass)
                    putString(ARG_EXAM_SUBJECT_ID, exam.subject?.id ?: "")
                    putString(ARG_EXAM_DATE, exam.examDate)
                    putString(ARG_EXAM_DURATION, exam.maxMarks.toString()) // Using maxMarks in place of duration
                    putString(ARG_EXAM_MAX_MARKS, exam.maxMarks.toString())
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

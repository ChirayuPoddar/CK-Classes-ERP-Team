package com.example.ckclasses.ui.homework

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateHomeworkRequest
import com.example.ckclasses.data.models.Homework
import com.example.ckclasses.databinding.LayoutBottomSheetHomeworkBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class HomeworkBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetHomeworkBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HomeworkViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetHomeworkBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val homeworkId = arguments?.getString(ARG_HW_ID)
        val homeworkTitle = arguments?.getString(ARG_HW_TITLE)
        
        if (homeworkId != null) {
            binding.tvSheetTitle.text = "Edit Homework"
            binding.btnSave.text = "Update Homework"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etTitle.setText(homeworkTitle)
            binding.etDescription.setText(arguments?.getString(ARG_HW_DESC) ?: "")
            binding.etClass.setText(arguments?.getString(ARG_HW_CLASS) ?: "")
            binding.etSubjectId.setText(arguments?.getString(ARG_HW_SUBJECT_ID) ?: "")
            
            val dueDateStr = arguments?.getString(ARG_HW_DUE)
            if (!dueDateStr.isNullOrEmpty()) {
                binding.etDueDate.setText(dueDateStr.take(10)) // YYYY-MM-DD
            }

            binding.btnDelete.setOnClickListener {
                viewModel.deleteHomework(homeworkId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add Homework"
            binding.btnSave.text = "Save Homework"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val title = binding.etTitle.text.toString().trim()
            val description = binding.etDescription.text.toString().trim()
            val targetClass = binding.etClass.text.toString().trim()
            val subjectId = binding.etSubjectId.text.toString().trim()
            val dueDate = binding.etDueDate.text.toString().trim()

            if (title.isEmpty() || targetClass.isEmpty() || subjectId.isEmpty()) {
                Toast.makeText(requireContext(), "Title, Class, and Subject ID are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateHomeworkRequest(
                title = title,
                description = description,
                studentClass = targetClass,
                subjectId = subjectId,
                dueDate = dueDate
            )

            if (homeworkId != null) {
                viewModel.updateHomework(homeworkId, request)
            } else {
                viewModel.createHomework(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "HomeworkBottomSheet"
        
        private const val ARG_HW_ID = "hw_id"
        private const val ARG_HW_TITLE = "hw_title"
        private const val ARG_HW_DESC = "hw_desc"
        private const val ARG_HW_CLASS = "hw_class"
        private const val ARG_HW_SUBJECT_ID = "hw_subject_id"
        private const val ARG_HW_DUE = "hw_due"

        fun newInstance(homework: Homework? = null): HomeworkBottomSheetFragment {
            val fragment = HomeworkBottomSheetFragment()
            if (homework != null) {
                val args = Bundle().apply {
                    putString(ARG_HW_ID, homework.id)
                    putString(ARG_HW_TITLE, homework.title)
                    putString(ARG_HW_DESC, homework.description)
                    putString(ARG_HW_CLASS, homework.targetClass)
                    putString(ARG_HW_SUBJECT_ID, homework.subject?.id ?: "")
                    putString(ARG_HW_DUE, homework.dueDate)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

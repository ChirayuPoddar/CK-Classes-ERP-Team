package com.example.ckclasses.ui.subjects

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateSubjectRequest
import com.example.ckclasses.data.models.Subject
import com.example.ckclasses.databinding.LayoutBottomSheetSubjectBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class SubjectBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetSubjectBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SubjectViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetSubjectBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val subjectId = arguments?.getString(ARG_SUBJECT_ID)
        val subjectName = arguments?.getString(ARG_SUBJECT_NAME)
        
        if (subjectId != null) {
            binding.tvSheetTitle.text = "Edit Subject"
            binding.btnSave.text = "Update Subject"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etName.setText(subjectName)
            binding.etCode.setText(arguments?.getString(ARG_SUBJECT_CODE) ?: "")
            binding.etClass.setText(arguments?.getString(ARG_SUBJECT_CLASS) ?: "")

            binding.btnDelete.setOnClickListener {
                viewModel.deleteSubject(subjectId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add New Subject"
            binding.btnSave.text = "Save Subject"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val code = binding.etCode.text.toString().trim()
            val subjectClass = binding.etClass.text.toString().trim()

            if (name.isEmpty() || subjectClass.isEmpty()) {
                Toast.makeText(requireContext(), "Name and Class are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateSubjectRequest(
                name = name,
                code = code,
                subjectClass = subjectClass
            )

            if (subjectId != null) {
                viewModel.updateSubject(subjectId, request)
            } else {
                viewModel.createSubject(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "SubjectBottomSheet"
        
        private const val ARG_SUBJECT_ID = "subject_id"
        private const val ARG_SUBJECT_NAME = "subject_name"
        private const val ARG_SUBJECT_CODE = "subject_code"
        private const val ARG_SUBJECT_CLASS = "subject_class"

        fun newInstance(subject: Subject? = null): SubjectBottomSheetFragment {
            val fragment = SubjectBottomSheetFragment()
            if (subject != null) {
                val args = Bundle().apply {
                    putString(ARG_SUBJECT_ID, subject.id)
                    putString(ARG_SUBJECT_NAME, subject.name)
                    putString(ARG_SUBJECT_CODE, subject.code)
                    putString(ARG_SUBJECT_CLASS, subject.subjectClass)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

package com.example.ckclasses.ui.resources

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateResourceRequest
import com.example.ckclasses.data.models.DigitalResource
import com.example.ckclasses.databinding.LayoutBottomSheetResourceBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class ResourceBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetResourceBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ResourceViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetResourceBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val resourceId = arguments?.getString(ARG_RES_ID)
        
        if (resourceId != null) {
            binding.tvSheetTitle.text = "Delete Resource"
            binding.btnSave.visibility = View.GONE
            binding.btnDelete.visibility = View.VISIBLE
            
            // For resources, update might not be supported based on backend, only create/delete
            binding.etTitle.setText(arguments?.getString(ARG_RES_TITLE) ?: "")
            binding.etDescription.setText(arguments?.getString(ARG_RES_DESC) ?: "")
            binding.etClass.setText(arguments?.getString(ARG_RES_CLASS) ?: "")
            binding.etSubjectId.setText(arguments?.getString(ARG_RES_SUBJECT_ID) ?: "")
            binding.etFileUrl.setText(arguments?.getString(ARG_RES_URL) ?: "")
            
            // Disable editing for delete mode
            binding.etTitle.isEnabled = false
            binding.etDescription.isEnabled = false
            binding.etClass.isEnabled = false
            binding.etSubjectId.isEnabled = false
            binding.etFileUrl.isEnabled = false

            binding.btnDelete.setOnClickListener {
                viewModel.deleteResource(resourceId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Upload Resource"
            binding.btnSave.text = "Save Resource"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val title = binding.etTitle.text.toString().trim()
            val description = binding.etDescription.text.toString().trim()
            val targetClass = binding.etClass.text.toString().trim()
            val subjectId = binding.etSubjectId.text.toString().trim()
            val fileUrl = binding.etFileUrl.text.toString().trim()

            if (title.isEmpty() || fileUrl.isEmpty() || subjectId.isEmpty()) {
                Toast.makeText(requireContext(), "Title, Subject ID, and File URL are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateResourceRequest(
                title = title,
                description = description,
                studentClass = targetClass.ifEmpty { "All" },
                fileUrl = fileUrl,
                fileType = getFileTypeFromUrl(fileUrl)
            )

            viewModel.createResource(request)
            dismiss()
        }
    }
    
    private fun getFileTypeFromUrl(url: String): String {
        return when {
            url.endsWith(".pdf", true) -> "PDF"
            url.endsWith(".doc", true) || url.endsWith(".docx", true) -> "Document"
            url.endsWith(".mp4", true) -> "Video"
            url.endsWith(".jpg", true) || url.endsWith(".png", true) -> "Image"
            else -> "Other"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "ResourceBottomSheet"
        
        private const val ARG_RES_ID = "res_id"
        private const val ARG_RES_TITLE = "res_title"
        private const val ARG_RES_DESC = "res_desc"
        private const val ARG_RES_CLASS = "res_class"
        private const val ARG_RES_SUBJECT_ID = "res_subject_id"
        private const val ARG_RES_URL = "res_url"

        fun newInstance(resource: DigitalResource? = null): ResourceBottomSheetFragment {
            val fragment = ResourceBottomSheetFragment()
            if (resource != null) {
                val args = Bundle().apply {
                    putString(ARG_RES_ID, resource.id)
                    putString(ARG_RES_TITLE, resource.title)
                    putString(ARG_RES_DESC, resource.description ?: "")
                    putString(ARG_RES_CLASS, resource.studentClass)
                    putString(ARG_RES_SUBJECT_ID, resource.subject?.id ?: "")
                    putString(ARG_RES_URL, resource.fileUrl)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

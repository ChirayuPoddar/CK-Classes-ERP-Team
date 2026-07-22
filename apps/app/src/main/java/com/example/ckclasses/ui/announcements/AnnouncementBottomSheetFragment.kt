package com.example.ckclasses.ui.announcements

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateAnnouncementRequest
import com.example.ckclasses.data.models.Announcement
import com.example.ckclasses.databinding.LayoutBottomSheetAnnouncementBinding
import com.example.ckclasses.utils.NetworkResult
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class AnnouncementBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetAnnouncementBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AnnouncementViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetAnnouncementBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val announcementId = arguments?.getString(ARG_ANN_ID)
        val announcementTitle = arguments?.getString(ARG_ANN_TITLE)
        
        if (announcementId != null) {
            binding.tvSheetTitle.text = "Edit Announcement"
            binding.btnSave.text = "Update Announcement"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etTitle.setText(announcementTitle)
            binding.etContent.setText(arguments?.getString(ARG_ANN_CONTENT) ?: "")
            binding.etAudience.setText(arguments?.getString(ARG_ANN_AUDIENCE) ?: "")

            binding.btnDelete.setOnClickListener {
                viewModel.deleteAnnouncement(announcementId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Add Announcement"
            binding.btnSave.text = "Save Announcement"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val title = binding.etTitle.text.toString().trim()
            val content = binding.etContent.text.toString().trim()
            val targetAudience = binding.etAudience.text.toString().trim()

            if (title.isEmpty() || content.isEmpty()) {
                Toast.makeText(requireContext(), "Title and Content are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateAnnouncementRequest(
                title = title,
                content = content,
                targetAudience = targetAudience.ifEmpty { "All" }
            )

            if (announcementId != null) {
                viewModel.updateAnnouncement(announcementId, request)
            } else {
                viewModel.createAnnouncement(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "AnnouncementBottomSheet"
        
        private const val ARG_ANN_ID = "ann_id"
        private const val ARG_ANN_TITLE = "ann_title"
        private const val ARG_ANN_CONTENT = "ann_content"
        private const val ARG_ANN_AUDIENCE = "ann_audience"

        fun newInstance(announcement: Announcement? = null): AnnouncementBottomSheetFragment {
            val fragment = AnnouncementBottomSheetFragment()
            if (announcement != null) {
                val args = Bundle().apply {
                    putString(ARG_ANN_ID, announcement.id)
                    putString(ARG_ANN_TITLE, announcement.title)
                    putString(ARG_ANN_CONTENT, announcement.content)
                    putString(ARG_ANN_AUDIENCE, announcement.targetAudience)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

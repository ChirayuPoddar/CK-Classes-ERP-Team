package com.example.ckclasses.ui.users

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.User
import com.example.ckclasses.databinding.LayoutBottomSheetUserBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class UserBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetUserBinding? = null
    private val binding get() = _binding!!

    private val viewModel: UserViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetUserBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val userId = arguments?.getString(ARG_USER_ID) ?: return dismiss()
        val userName = arguments?.getString(ARG_USER_NAME) ?: "User"
        val userRole = arguments?.getString(ARG_USER_ROLE) ?: "student"
        val isBlocked = arguments?.getBoolean(ARG_USER_BLOCKED) ?: false

        binding.tvUserName.text = userName
        binding.actRole.setText(userRole, false)
        
        val roles = arrayOf("student", "teacher", "admin")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, roles)
        binding.actRole.setAdapter(adapter)

        binding.btnBlock.text = if (isBlocked) "Unblock User" else "Block User"
        val buttonColor = if (isBlocked) "#10B981" else "#EF4444" // Green for unblock, Red for block
        binding.btnBlock.setTextColor(android.graphics.Color.parseColor(buttonColor))
        binding.btnBlock.strokeColor = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor(buttonColor))

        binding.btnSave.setOnClickListener {
            val selectedRole = binding.actRole.text.toString()
            if (selectedRole != userRole) {
                viewModel.updateUserRole(userId, selectedRole)
            }
            dismiss()
        }

        binding.btnBlock.setOnClickListener {
            viewModel.toggleBlockStatus(userId, isBlocked)
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "UserBottomSheet"
        
        private const val ARG_USER_ID = "user_id"
        private const val ARG_USER_NAME = "user_name"
        private const val ARG_USER_ROLE = "user_role"
        private const val ARG_USER_BLOCKED = "user_blocked"

        fun newInstance(user: User): UserBottomSheetFragment {
            val fragment = UserBottomSheetFragment()
            val args = Bundle().apply {
                putString(ARG_USER_ID, user.mongoId.ifEmpty { user.id })
                putString(ARG_USER_NAME, user.name)
                putString(ARG_USER_ROLE, user.role)
                putBoolean(ARG_USER_BLOCKED, !user.isActivated) // Assuming isActivated means not blocked
            }
            fragment.arguments = args
            return fragment
        }
    }
}

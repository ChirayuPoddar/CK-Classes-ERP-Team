package com.example.ckclasses.ui.fees

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.CreateFeeRequest
import com.example.ckclasses.data.models.FeeRecord
import com.example.ckclasses.databinding.LayoutBottomSheetFeeBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class FeeBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetFeeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FeeViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetFeeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val feeId = arguments?.getString(ARG_FEE_ID)
        val feeTitle = arguments?.getString(ARG_FEE_TITLE)
        
        if (feeId != null) {
            binding.tvSheetTitle.text = "Edit Fee Record"
            binding.btnSave.text = "Update Fee Record"
            binding.btnDelete.visibility = View.VISIBLE
            
            binding.etTitle.setText(feeTitle)
            binding.etStudentId.setText(arguments?.getString(ARG_FEE_STUDENT_ID) ?: "")
            binding.etAmount.setText(arguments?.getString(ARG_FEE_AMOUNT) ?: "")
            
            val dueDateStr = arguments?.getString(ARG_FEE_DUE_DATE)
            if (!dueDateStr.isNullOrEmpty()) {
                binding.etDueDate.setText(dueDateStr.take(10)) // YYYY-MM-DD
            }

            binding.btnDelete.setOnClickListener {
                viewModel.deleteFee(feeId)
                dismiss()
            }
        } else {
            binding.tvSheetTitle.text = "Create Fee Record"
            binding.btnSave.text = "Save Fee Record"
            binding.btnDelete.visibility = View.GONE
        }

        binding.btnSave.setOnClickListener {
            val title = binding.etTitle.text.toString().trim()
            val studentId = binding.etStudentId.text.toString().trim()
            val amountStr = binding.etAmount.text.toString().trim()
            val dueDate = binding.etDueDate.text.toString().trim()

            if (studentId.isEmpty() || amountStr.isEmpty() || dueDate.isEmpty()) {
                Toast.makeText(requireContext(), "Student ID, Amount, and Due Date are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = CreateFeeRequest(
                studentId = studentId,
                amount = amountStr.toDoubleOrNull() ?: 0.0,
                dueDate = dueDate,
                title = title
            )

            if (feeId != null) {
                viewModel.updateFee(feeId, request)
            } else {
                viewModel.createFee(request)
            }
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "FeeBottomSheet"
        
        private const val ARG_FEE_ID = "fee_id"
        private const val ARG_FEE_TITLE = "fee_title"
        private const val ARG_FEE_STUDENT_ID = "fee_student_id"
        private const val ARG_FEE_AMOUNT = "fee_amount"
        private const val ARG_FEE_DUE_DATE = "fee_due_date"

        fun newInstance(fee: FeeRecord? = null): FeeBottomSheetFragment {
            val fragment = FeeBottomSheetFragment()
            if (fee != null) {
                val args = Bundle().apply {
                    putString(ARG_FEE_ID, fee.id)
                    putString(ARG_FEE_TITLE, fee.rawTitle ?: "")
                    putString(ARG_FEE_STUDENT_ID, fee.student?.id ?: "")
                    putString(ARG_FEE_AMOUNT, fee.amount.toString())
                    putString(ARG_FEE_DUE_DATE, fee.dueDate)
                }
                fragment.arguments = args
            }
            return fragment
        }
    }
}

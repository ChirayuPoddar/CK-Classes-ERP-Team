package com.example.ckclasses.ui.fees

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import com.example.ckclasses.data.models.AddPaymentRequest
import com.example.ckclasses.databinding.LayoutBottomSheetPaymentBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class PaymentBottomSheetFragment : BottomSheetDialogFragment() {

    private var _binding: LayoutBottomSheetPaymentBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FeeViewModel by activityViewModels()
    private var feeId: String? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutBottomSheetPaymentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        feeId = arguments?.getString(ARG_FEE_ID)
        val remainingAmount = arguments?.getDouble(ARG_REMAINING_AMOUNT) ?: 0.0

        if (remainingAmount > 0) {
            binding.etAmount.setText(remainingAmount.toString())
        }

        binding.btnSave.setOnClickListener {
            val amountStr = binding.etAmount.text.toString().trim()
            val paymentMode = binding.etPaymentMode.text.toString().trim()

            if (amountStr.isEmpty() || paymentMode.isEmpty()) {
                Toast.makeText(requireContext(), "Amount and Payment Mode are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (feeId != null) {
                val request = AddPaymentRequest(
                    amount = amountStr.toDoubleOrNull() ?: 0.0,
                    paymentMode = paymentMode
                )
                viewModel.addPayment(feeId!!, request)
                dismiss()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "PaymentBottomSheet"
        
        private const val ARG_FEE_ID = "fee_id"
        private const val ARG_REMAINING_AMOUNT = "remaining_amount"

        fun newInstance(feeId: String, remainingAmount: Double): PaymentBottomSheetFragment {
            val fragment = PaymentBottomSheetFragment()
            val args = Bundle().apply {
                putString(ARG_FEE_ID, feeId)
                putDouble(ARG_REMAINING_AMOUNT, remainingAmount)
            }
            fragment.arguments = args
            return fragment
        }
    }
}

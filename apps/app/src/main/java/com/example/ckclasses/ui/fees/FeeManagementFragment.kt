package com.example.ckclasses.ui.fees

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.databinding.FragmentFeesBinding
import com.example.ckclasses.utils.NetworkResult

class FeeManagementFragment : Fragment() {

    private var _binding: FragmentFeesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: FeeViewModel by viewModels()
    private lateinit var adapter: FeeAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentFeesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = FeeAdapter { fee ->
            val balance = fee.totalAmount - fee.paidAmount
            val options = if (balance > 0) {
                arrayOf("Edit Fee Record", "Record Payment")
            } else {
                arrayOf("Edit Fee Record")
            }

            AlertDialog.Builder(requireContext())
                .setTitle("Select Action")
                .setItems(options) { _, which ->
                    if (which == 0) {
                        FeeBottomSheetFragment.newInstance(fee)
                            .show(childFragmentManager, FeeBottomSheetFragment.TAG)
                    } else if (which == 1 && options.size > 1) {
                        PaymentBottomSheetFragment.newInstance(fee.id, balance)
                            .show(childFragmentManager, PaymentBottomSheetFragment.TAG)
                    }
                }
                .show()
        }
        binding.rvFees.layoutManager = LinearLayoutManager(requireContext())
        binding.rvFees.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadFees() }

        binding.fabAddFee.setOnClickListener {
            FeeBottomSheetFragment.newInstance()
                .show(childFragmentManager, FeeBottomSheetFragment.TAG)
        }

        observeViewModel()
        viewModel.loadFees()
    }

    private fun observeViewModel() {
        viewModel.feesState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefresh.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), result.message ?: "Failed to load fee records", Toast.LENGTH_SHORT).show()
                }
            }
        }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> { }
                is NetworkResult.Success -> {
                    Toast.makeText(requireContext(), result.data, Toast.LENGTH_SHORT).show()
                }
                is NetworkResult.Error -> {
                    Toast.makeText(requireContext(), result.message ?: "Action failed", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

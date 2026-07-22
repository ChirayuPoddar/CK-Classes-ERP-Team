package com.example.ckclasses.ui.homework

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.databinding.FragmentHomeworkBinding
import com.example.ckclasses.utils.NetworkResult

class HomeworkFragment : Fragment() {

    private var _binding: FragmentHomeworkBinding? = null
    private val binding get() = _binding!!
    private val viewModel: HomeworkViewModel by viewModels()
    private lateinit var adapter: HomeworkAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeworkBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = HomeworkAdapter { homework ->
            HomeworkBottomSheetFragment.newInstance(homework)
                .show(childFragmentManager, HomeworkBottomSheetFragment.TAG)
        }
        binding.rvHomework.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHomework.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadHomework() }

        binding.fabAddHomework.setOnClickListener {
            HomeworkBottomSheetFragment.newInstance()
                .show(childFragmentManager, HomeworkBottomSheetFragment.TAG)
        }

        observeViewModel()
        viewModel.loadHomework()
    }

    private fun observeViewModel() {
        viewModel.homeworkState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefresh.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), result.message ?: "Failed to load homework", Toast.LENGTH_SHORT).show()
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

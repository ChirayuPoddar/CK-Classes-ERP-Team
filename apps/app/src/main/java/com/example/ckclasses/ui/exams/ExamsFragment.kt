package com.example.ckclasses.ui.exams

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.databinding.FragmentExamsBinding
import com.example.ckclasses.utils.NetworkResult

class ExamsFragment : Fragment() {

    private var _binding: FragmentExamsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: ExamViewModel by viewModels()
    private lateinit var adapter: ExamAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentExamsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = ExamAdapter { exam ->
            ExamBottomSheetFragment.newInstance(exam)
                .show(childFragmentManager, ExamBottomSheetFragment.TAG)
        }
        binding.rvExams.layoutManager = LinearLayoutManager(requireContext())
        binding.rvExams.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadExams() }

        binding.fabAddExam.setOnClickListener {
            ExamBottomSheetFragment.newInstance()
                .show(childFragmentManager, ExamBottomSheetFragment.TAG)
        }

        observeViewModel()
        viewModel.loadExams()
    }

    private fun observeViewModel() {
        viewModel.examsState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefresh.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), result.message ?: "Failed to load exams", Toast.LENGTH_SHORT).show()
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

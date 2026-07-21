package com.example.ckclasses.ui.exams

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.ExamRepository
import com.example.ckclasses.databinding.FragmentExamsBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class ExamsFragment : Fragment() {

    private var _binding: FragmentExamsBinding? = null
    private val binding get() = _binding!!
    private val repository = ExamRepository(RetrofitClient.apiService)
    private lateinit var adapter: ExamAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentExamsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = ExamAdapter()
        binding.rvExams.layoutManager = LinearLayoutManager(requireContext())
        binding.rvExams.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { loadExams() }
        loadExams()
    }

    private fun loadExams() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            when (val res = repository.getExams()) {
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(res.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), res.message ?: "Failed to load exams", Toast.LENGTH_SHORT).show()
                }
                else -> binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

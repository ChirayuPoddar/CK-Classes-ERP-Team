package com.example.ckclasses.ui.homework

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.HomeworkRepository
import com.example.ckclasses.databinding.FragmentHomeworkBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class HomeworkFragment : Fragment() {

    private var _binding: FragmentHomeworkBinding? = null
    private val binding get() = _binding!!
    private val repository = HomeworkRepository(RetrofitClient.apiService)
    private lateinit var adapter: HomeworkAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeworkBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = HomeworkAdapter()
        binding.rvHomework.layoutManager = LinearLayoutManager(requireContext())
        binding.rvHomework.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { loadHomework() }
        loadHomework()
    }

    private fun loadHomework() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            when (val res = repository.getHomework()) {
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(res.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), res.message ?: "Failed to load homework", Toast.LENGTH_SHORT).show()
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

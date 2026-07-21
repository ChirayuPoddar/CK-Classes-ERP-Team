package com.example.ckclasses.ui.students

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.StudentRepository
import com.example.ckclasses.databinding.FragmentStudentsBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class StudentsFragment : Fragment() {

    private var _binding: FragmentStudentsBinding? = null
    private val binding get() = _binding!!
    private val repository = StudentRepository(RetrofitClient.apiService)
    private lateinit var adapter: StudentAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStudentsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = StudentAdapter()
        binding.rvStudents.layoutManager = LinearLayoutManager(requireContext())
        binding.rvStudents.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { loadStudents() }
        binding.fabAddStudent.setOnClickListener {
            Toast.makeText(requireContext(), "Add Student dialog", Toast.LENGTH_SHORT).show()
        }

        loadStudents()
    }

    private fun loadStudents() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            when (val res = repository.getStudents()) {
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(res.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), res.message ?: "Failed to load students", Toast.LENGTH_SHORT).show()
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

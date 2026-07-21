package com.example.ckclasses.ui.teachers

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.databinding.FragmentTeachersBinding
import com.example.ckclasses.utils.NetworkResult

class TeachersFragment : Fragment() {

    private var _binding: FragmentTeachersBinding? = null
    private val binding get() = _binding!!
    private val viewModel: TeacherViewModel by viewModels()
    private lateinit var adapter: TeacherAdapter
    private var allTeachers: List<Teacher> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentTeachersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = TeacherAdapter { teacher ->
            Toast.makeText(requireContext(), "Edit faculty: ${teacher.fullName}", Toast.LENGTH_SHORT).show()
        }

        binding.rvTeachers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTeachers.adapter = adapter

        binding.swipeRefreshTeachers.setOnRefreshListener {
            viewModel.loadTeachers()
        }

        binding.etSearchTeacher.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterTeachers(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        observeViewModel()
        viewModel.loadTeachers()
    }

    private fun observeViewModel() {
        viewModel.teachersState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefreshTeachers.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefreshTeachers.isRefreshing = false
                    allTeachers = result.data ?: emptyList()
                    adapter.submitList(allTeachers)
                    updateKpis(allTeachers)
                }
                is NetworkResult.Error -> {
                    binding.swipeRefreshTeachers.isRefreshing = false
                    Toast.makeText(requireContext(), result.message ?: "Failed to load teachers", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updateKpis(teachers: List<Teacher>) {
        val total = teachers.size
        val active = teachers.count { it.status.equals("Active", ignoreCase = true) || it.status.isEmpty() }
        val depts = teachers.map { it.department }.filter { it.isNotEmpty() }.distinct().size

        binding.tvKpiTotalTeachers.text = total.toString()
        binding.tvKpiActiveTeachers.text = active.toString()
        binding.tvKpiDepartments.text = if (depts > 0) depts.toString() else "1"
        binding.tvKpiNewTeachers.text = "0"
    }

    private fun filterTeachers(query: String) {
        if (query.isEmpty()) {
            adapter.submitList(allTeachers)
        } else {
            val q = query.lowercase().trim()
            val filtered = allTeachers.filter { t ->
                t.fullName.lowercase().contains(q) ||
                t.teacherId.lowercase().contains(q) ||
                (t.email?.lowercase()?.contains(q) == true) ||
                (t.phone?.lowercase()?.contains(q) == true) ||
                t.subjectsHandled.any { it.lowercase().contains(q) }
            }
            adapter.submitList(filtered)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

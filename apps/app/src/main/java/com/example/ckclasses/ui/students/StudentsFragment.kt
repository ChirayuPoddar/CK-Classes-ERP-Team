package com.example.ckclasses.ui.students

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
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.databinding.FragmentStudentsBinding
import com.example.ckclasses.utils.NetworkResult

class StudentsFragment : Fragment() {

    private var _binding: FragmentStudentsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: StudentViewModel by viewModels()
    private lateinit var adapter: StudentAdapter
    private var allStudents: List<Student> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStudentsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = StudentAdapter { student ->
            Toast.makeText(requireContext(), "Edit student: ${student.fullName}", Toast.LENGTH_SHORT).show()
        }

        binding.rvStudents.layoutManager = LinearLayoutManager(requireContext())
        binding.rvStudents.adapter = adapter

        binding.swipeRefreshStudents.setOnRefreshListener {
            viewModel.loadStudents()
        }

        binding.etSearchStudent.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                filterStudents(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        observeViewModel()
        viewModel.loadStudents()
    }

    private fun observeViewModel() {
        viewModel.studentsState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefreshStudents.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefreshStudents.isRefreshing = false
                    allStudents = result.data ?: emptyList()
                    adapter.submitList(allStudents)
                    updateKpis(allStudents)
                }
                is NetworkResult.Error -> {
                    binding.swipeRefreshStudents.isRefreshing = false
                    Toast.makeText(requireContext(), result.message ?: "Failed to load students", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updateKpis(students: List<Student>) {
        val total = students.size
        val active = students.count { it.status.equals("Active", ignoreCase = true) || it.status.isEmpty() }
        val inactive = students.count { it.status.equals("Inactive", ignoreCase = true) }

        binding.tvKpiTotalStudents.text = total.toString()
        binding.tvKpiActiveStudents.text = active.toString()
        binding.tvKpiInactiveStudents.text = inactive.toString()
        binding.tvKpiTodayAdmissions.text = "0"
    }

    private fun filterStudents(query: String) {
        if (query.isEmpty()) {
            adapter.submitList(allStudents)
        } else {
            val q = query.lowercase().trim()
            val filtered = allStudents.filter { s ->
                s.fullName.lowercase().contains(q) ||
                s.studentId.lowercase().contains(q) ||
                (s.email?.lowercase()?.contains(q) == true) ||
                (s.phone?.lowercase()?.contains(q) == true) ||
                s.studentClass.lowercase().contains(q)
            }
            adapter.submitList(filtered)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

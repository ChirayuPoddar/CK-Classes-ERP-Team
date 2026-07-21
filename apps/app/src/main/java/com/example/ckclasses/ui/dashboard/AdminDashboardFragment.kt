package com.example.ckclasses.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.databinding.FragmentDashboardBinding
import com.example.ckclasses.ui.announcements.AnnouncementAdapter
import com.example.ckclasses.utils.NetworkResult
import com.example.ckclasses.utils.SessionManager

class AdminDashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by viewModels()
    private lateinit var adapter: AnnouncementAdapter
    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())

        binding.tvWelcomeRole.text = "Welcome, ${sessionManager.getUserName()}!"

        adapter = AnnouncementAdapter()
        binding.rvDashboardAnnouncements.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDashboardAnnouncements.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadDashboardData()
        }

        observeViewModel()
        viewModel.loadDashboardData()
    }

    private fun observeViewModel() {
        viewModel.statsState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.swipeRefresh.isRefreshing = true
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    result.data?.let { stats ->
                        binding.tvStatStudents.text = stats.totalStudents.toString()
                        binding.tvStatTeachers.text = stats.totalTeachers.toString()
                        binding.tvStatAttendance.text = "${stats.todayAttendancePercentage}%"
                        binding.tvStatFees.text = "${stats.pendingFeesTotal.toInt()} Records"
                    }
                }
                is NetworkResult.Error -> binding.swipeRefresh.isRefreshing = false
            }
        }

        viewModel.announcementsState.observe(viewLifecycleOwner) { result ->
            if (result is NetworkResult.Success) {
                adapter.submitList(result.data ?: emptyList())
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

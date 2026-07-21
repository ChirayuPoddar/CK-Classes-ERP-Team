package com.example.ckclasses.ui.announcements

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.AnnouncementRepository
import com.example.ckclasses.databinding.FragmentAnnouncementsBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class AnnouncementsFragment : Fragment() {

    private var _binding: FragmentAnnouncementsBinding? = null
    private val binding get() = _binding!!
    private val repository = AnnouncementRepository(RetrofitClient.apiService)
    private lateinit var adapter: AnnouncementAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAnnouncementsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = AnnouncementAdapter()
        binding.rvAnnouncements.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAnnouncements.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { loadAnnouncements() }
        loadAnnouncements()
    }

    private fun loadAnnouncements() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            when (val res = repository.getAnnouncements()) {
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(res.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), res.message ?: "Failed to load announcements", Toast.LENGTH_SHORT).show()
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

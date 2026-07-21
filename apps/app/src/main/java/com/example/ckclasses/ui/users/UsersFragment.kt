package com.example.ckclasses.ui.users

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.UserRepository
import com.example.ckclasses.databinding.FragmentUsersBinding
import com.example.ckclasses.utils.NetworkResult
import kotlinx.coroutines.launch

class UsersFragment : Fragment() {

    private var _binding: FragmentUsersBinding? = null
    private val binding get() = _binding!!
    private val repository = UserRepository(RetrofitClient.apiService)
    private lateinit var adapter: UserAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentUsersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = UserAdapter()
        binding.rvUsers.layoutManager = LinearLayoutManager(requireContext())
        binding.rvUsers.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { loadUsers() }
        loadUsers()
    }

    private fun loadUsers() {
        binding.swipeRefresh.isRefreshing = true
        lifecycleScope.launch {
            when (val res = repository.getUsers()) {
                is NetworkResult.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(res.data ?: emptyList())
                }
                is NetworkResult.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(requireContext(), res.message ?: "Failed to load users", Toast.LENGTH_SHORT).show()
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

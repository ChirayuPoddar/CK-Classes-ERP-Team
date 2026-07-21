package com.example.ckclasses.ui.users

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.User
import com.example.ckclasses.databinding.ItemUserBinding

class UserAdapter(
    private var users: List<User> = emptyList()
) : RecyclerView.Adapter<UserAdapter.ViewHolder>() {

    fun submitList(newList: List<User>) {
        users = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(users[position])
    }

    override fun getItemCount(): Int = users.size

    class ViewHolder(private val binding: ItemUserBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: User) {
            binding.tvUserName.text = item.name
            binding.tvRoleBadge.text = item.role.uppercase()
            binding.tvUserEmail.text = "Email: ${item.email}"
            binding.tvInstId.text = "ID: ${item.institutionId ?: "N/A"}"
        }
    }
}

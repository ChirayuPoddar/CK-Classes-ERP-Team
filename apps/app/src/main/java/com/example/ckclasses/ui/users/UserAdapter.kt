package com.example.ckclasses.ui.users

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.User
import com.example.ckclasses.databinding.ItemUserBinding

class UserAdapter(
    private val onClick: ((User) -> Unit)? = null
) : RecyclerView.Adapter<UserAdapter.ViewHolder>() {

    private var users: List<User> = emptyList()

    fun submitList(newList: List<User>) {
        users = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(users[position])
    }

    override fun getItemCount(): Int = users.size

    class ViewHolder(
        private val binding: ItemUserBinding,
        private val onClick: ((User) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: User) {
            binding.tvUserName.text = item.name
            binding.tvRoleBadge.text = item.role.uppercase()
            binding.tvUserEmail.text = "Email: ${item.email}"
            binding.tvInstId.text = "ID: ${item.institutionId ?: "N/A"}"

            if (!item.isActivated) {
                binding.tvRoleBadge.text = "${item.role.uppercase()} (BLOCKED)"
                binding.tvRoleBadge.setTextColor(android.graphics.Color.RED)
            } else {
                binding.tvRoleBadge.setTextColor(android.graphics.Color.GRAY) // Adjust based on original color
            }

            binding.root.setOnClickListener {
                onClick?.invoke(item)
            }
        }
    }
}

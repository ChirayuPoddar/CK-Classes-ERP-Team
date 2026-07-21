package com.example.ckclasses.ui.teachers

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Teacher
import com.example.ckclasses.databinding.ItemTeacherBinding

class TeacherAdapter(
    private var teachers: List<Teacher> = emptyList()
) : RecyclerView.Adapter<TeacherAdapter.ViewHolder>() {

    fun submitList(newList: List<Teacher>) {
        teachers = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTeacherBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(teachers[position])
    }

    override fun getItemCount(): Int = teachers.size

    class ViewHolder(private val binding: ItemTeacherBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Teacher) {
            val displayName = item.user?.name ?: item.name ?: "Teacher"
            val displayEmail = item.user?.email ?: item.email ?: ""
            binding.tvTeacherName.text = displayName
            binding.tvTeacherIdBadge.text = item.teacherId.ifEmpty { "TCH" }
            binding.tvDeptQual.text = "Dept: ${item.department} • ${item.qualification}"
            binding.tvTeacherContact.text = "Email: $displayEmail"
        }
    }
}

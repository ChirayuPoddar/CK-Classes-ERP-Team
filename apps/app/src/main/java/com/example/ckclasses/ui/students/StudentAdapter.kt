package com.example.ckclasses.ui.students

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Student
import com.example.ckclasses.databinding.ItemStudentBinding

class StudentAdapter(
    private var students: List<Student> = emptyList()
) : RecyclerView.Adapter<StudentAdapter.ViewHolder>() {

    fun submitList(newList: List<Student>) {
        students = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemStudentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(students[position])
    }

    override fun getItemCount(): Int = students.size

    class ViewHolder(private val binding: ItemStudentBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Student) {
            val displayName = item.user?.name ?: item.name ?: "Student"
            binding.tvStudentName.text = displayName
            binding.tvStudentIdBadge.text = item.studentId.ifEmpty { "ID Pending" }
            binding.tvClassSection.text = "Class: ${item.studentClass} - Sec ${item.section} • Roll: ${item.rollNumber}"
            binding.tvGuardianInfo.text = "Guardian: ${item.guardianName} (${item.guardianPhone})"
        }
    }
}

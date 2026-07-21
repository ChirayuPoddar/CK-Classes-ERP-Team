package com.example.ckclasses.ui.subjects

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Subject
import com.example.ckclasses.databinding.ItemSubjectBinding

class SubjectAdapter(
    private var subjects: List<Subject> = emptyList()
) : RecyclerView.Adapter<SubjectAdapter.ViewHolder>() {

    fun submitList(newList: List<Subject>) {
        subjects = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSubjectBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(subjects[position])
    }

    override fun getItemCount(): Int = subjects.size

    class ViewHolder(private val binding: ItemSubjectBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Subject) {
            val teacherName = item.teacher?.user?.name ?: item.teacher?.name ?: "Unassigned"
            binding.tvSubjectName.text = item.name
            binding.tvCodeBadge.text = item.code.ifEmpty { "SUB" }
            binding.tvClassTeacher.text = "Target Class: ${item.subjectClass} • Teacher: $teacherName"
        }
    }
}

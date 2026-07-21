package com.example.ckclasses.ui.exams

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Exam
import com.example.ckclasses.databinding.ItemExamBinding

class ExamAdapter(
    private var exams: List<Exam> = emptyList()
) : RecyclerView.Adapter<ExamAdapter.ViewHolder>() {

    fun submitList(newList: List<Exam>) {
        exams = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemExamBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(exams[position])
    }

    override fun getItemCount(): Int = exams.size

    class ViewHolder(private val binding: ItemExamBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Exam) {
            val subjectName = item.subject?.name ?: "General"
            binding.tvExamTitle.text = item.title
            binding.tvMaxMarksBadge.text = "${item.maxMarks} Marks"
            binding.tvClassSubject.text = "Target Class: ${item.targetClass} • Subject: $subjectName"
            binding.tvExamDate.text = "Exam Date: ${item.examDate.take(10)}"
        }
    }
}

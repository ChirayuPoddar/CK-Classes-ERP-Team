package com.example.ckclasses.ui.homework

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Homework
import com.example.ckclasses.databinding.ItemHomeworkBinding

class HomeworkAdapter(
    private val onEditClick: ((Homework) -> Unit)? = null
) : RecyclerView.Adapter<HomeworkAdapter.ViewHolder>() {

    private var homeworkList: List<Homework> = emptyList()

    fun submitList(newList: List<Homework>) {
        homeworkList = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemHomeworkBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onEditClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(homeworkList[position])
    }

    override fun getItemCount(): Int = homeworkList.size

    class ViewHolder(
        private val binding: ItemHomeworkBinding,
        private val onEditClick: ((Homework) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Homework) {
            binding.tvHomeworkTitle.text = item.title
            binding.tvClassBadge.text = item.targetClass.ifEmpty { "All Classes" }
            binding.tvDescription.text = item.description
            binding.tvDueDate.text = "Due Date: ${item.dueDate.take(10)}"

            binding.root.setOnClickListener {
                onEditClick?.invoke(item)
            }
        }
    }
}

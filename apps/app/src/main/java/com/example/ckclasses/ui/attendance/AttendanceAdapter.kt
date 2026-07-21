package com.example.ckclasses.ui.attendance

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.AttendanceRecord
import com.example.ckclasses.databinding.ItemAttendanceBinding

class AttendanceAdapter(
    private var records: List<AttendanceRecord> = emptyList()
) : RecyclerView.Adapter<AttendanceAdapter.ViewHolder>() {

    fun submitList(newList: List<AttendanceRecord>) {
        records = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemAttendanceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(records[position])
    }

    override fun getItemCount(): Int = records.size

    class ViewHolder(private val binding: ItemAttendanceBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: AttendanceRecord) {
            val studentName = item.student?.user?.name ?: item.student?.name ?: "Student"
            val studentId = item.student?.studentId ?: ""
            binding.tvStudentName.text = studentName
            binding.tvStudentId.text = "$studentId • Date: ${item.date.take(10)}"
            binding.tvStatusBadge.text = item.status.uppercase()

            when (item.status.lowercase()) {
                "present" -> binding.tvStatusBadge.setTextColor(Color.parseColor("#10B981"))
                "absent" -> binding.tvStatusBadge.setTextColor(Color.parseColor("#EF4444"))
                "late" -> binding.tvStatusBadge.setTextColor(Color.parseColor("#F59E0B"))
                else -> binding.tvStatusBadge.setTextColor(Color.parseColor("#3B82F6"))
            }
        }
    }
}

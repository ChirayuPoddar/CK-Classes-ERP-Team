package com.example.ckclasses.ui.fees

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.FeeRecord
import com.example.ckclasses.databinding.ItemFeeBinding

class FeeAdapter(
    private val onClick: ((FeeRecord) -> Unit)? = null
) : RecyclerView.Adapter<FeeAdapter.ViewHolder>() {

    private var records: List<FeeRecord> = emptyList()

    fun submitList(newList: List<FeeRecord>) {
        records = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemFeeBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(records[position])
    }

    override fun getItemCount(): Int = records.size

    class ViewHolder(
        private val binding: ItemFeeBinding,
        private val onClick: ((FeeRecord) -> Unit)?
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: FeeRecord) {
            val studentName = item.student?.user?.name ?: item.student?.name ?: "Student"
            val balance = item.totalAmount - item.paidAmount
            binding.tvFeeTitle.text = item.title.ifEmpty { "Tuition Fee" }
            binding.tvStudentName.text = "Student: $studentName"
            binding.tvAmountInfo.text = "Total: ₹${item.totalAmount.toInt()} • Paid: ₹${item.paidAmount.toInt()} • Balance: ₹${balance.toInt()}"
            binding.tvFeeStatus.text = item.status.uppercase()

            when (item.status.lowercase()) {
                "paid" -> binding.tvFeeStatus.setTextColor(Color.parseColor("#10B981"))
                "partial" -> binding.tvFeeStatus.setTextColor(Color.parseColor("#F59E0B"))
                else -> binding.tvFeeStatus.setTextColor(Color.parseColor("#EF4444"))
            }

            binding.root.setOnClickListener {
                onClick?.invoke(item)
            }
        }
    }
}

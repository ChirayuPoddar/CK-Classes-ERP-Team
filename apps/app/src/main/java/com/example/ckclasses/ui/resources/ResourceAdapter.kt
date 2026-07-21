package com.example.ckclasses.ui.resources

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.DigitalResource
import com.example.ckclasses.databinding.ItemResourceBinding

class ResourceAdapter(
    private var resources: List<DigitalResource> = emptyList()
) : RecyclerView.Adapter<ResourceAdapter.ViewHolder>() {

    fun submitList(newList: List<DigitalResource>) {
        resources = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemResourceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(resources[position])
    }

    override fun getItemCount(): Int = resources.size

    class ViewHolder(private val binding: ItemResourceBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: DigitalResource) {
            binding.tvResourceTitle.text = item.title
            binding.tvCategoryBadge.text = item.category.ifEmpty { "General" }
            binding.tvDescription.text = item.description
            binding.tvFileUrl.text = "URL: ${item.fileUrl}"
        }
    }
}

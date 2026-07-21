package com.example.ckclasses.ui.announcements

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.ckclasses.data.models.Announcement
import com.example.ckclasses.databinding.ItemAnnouncementBinding

class AnnouncementAdapter(
    private var announcements: List<Announcement> = emptyList()
) : RecyclerView.Adapter<AnnouncementAdapter.ViewHolder>() {

    fun submitList(newList: List<Announcement>) {
        announcements = newList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemAnnouncementBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(announcements[position])
    }

    override fun getItemCount(): Int = announcements.size

    class ViewHolder(private val binding: ItemAnnouncementBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: Announcement) {
            binding.tvTitle.text = item.title
            binding.tvContent.text = item.content
            binding.tvAudienceBadge.text = item.targetAudience
            binding.tvDate.text = if (item.createdAt.length >= 10) item.createdAt.substring(0, 10) else item.createdAt
        }
    }
}

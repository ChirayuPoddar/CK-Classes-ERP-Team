package com.example.ckclasses.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.ckclasses.R
import com.example.ckclasses.data.api.RetrofitClient
import com.example.ckclasses.data.repository.AuthRepository
import com.example.ckclasses.databinding.ActivityMainBinding
import com.example.ckclasses.ui.ai.AiAssistantFragment
import com.example.ckclasses.ui.announcements.AnnouncementsFragment
import com.example.ckclasses.ui.attendance.AttendanceFragment
import com.example.ckclasses.ui.auth.LoginActivity
import com.example.ckclasses.ui.dashboard.AdminDashboardFragment
import com.example.ckclasses.ui.exams.ExamsFragment
import com.example.ckclasses.ui.fees.FeeManagementFragment
import com.example.ckclasses.ui.homework.HomeworkFragment
import com.example.ckclasses.ui.resources.ResourcesFragment
import com.example.ckclasses.ui.students.StudentsFragment
import com.example.ckclasses.ui.subjects.SubjectsFragment
import com.example.ckclasses.ui.teachers.TeachersFragment
import com.example.ckclasses.ui.users.UsersFragment
import com.example.ckclasses.utils.SessionManager
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var toggle: ActionBarDrawerToggle
    private lateinit var sessionManager: SessionManager
    private val authRepo = AuthRepository(RetrofitClient.apiService)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)
        RetrofitClient.authToken = sessionManager.getAuthToken()

        setSupportActionBar(binding.toolbar)

        toggle = ActionBarDrawerToggle(
            this, binding.drawerLayout, binding.toolbar,
            R.string.navigation_drawer_open, R.string.navigation_drawer_close
        )
        binding.drawerLayout.addDrawerListener(toggle)
        toggle.syncState()

        updateNavHeader()
        setupNavigation()

        if (savedInstanceState == null) {
            replaceFragment(AdminDashboardFragment(), "Dashboard")
            binding.navigationView.setCheckedItem(R.id.nav_dashboard)
        }
    }

    private fun updateNavHeader() {
        val headerView = binding.navigationView.getHeaderView(0)
        val tvName = headerView.findViewById<TextView>(R.id.tvHeaderName)
        val tvEmailRole = headerView.findViewById<TextView>(R.id.tvHeaderEmailRole)

        tvName.text = sessionManager.getUserName()
        tvEmailRole.text = "${sessionManager.getUserEmail()} • ${sessionManager.getUserRole().uppercase()}"
    }

    private fun setupNavigation() {
        binding.navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> replaceFragment(AdminDashboardFragment(), "Dashboard")
                R.id.nav_ai -> replaceFragment(AiAssistantFragment(), "AI Assistant (Groq)")
                R.id.nav_students -> replaceFragment(StudentsFragment(), "Students Directory")
                R.id.nav_teachers -> replaceFragment(TeachersFragment(), "Faculty Directory")
                R.id.nav_subjects -> replaceFragment(SubjectsFragment(), "Subjects & Curriculum")
                R.id.nav_attendance -> replaceFragment(AttendanceFragment(), "Attendance Logs")
                R.id.nav_fees -> replaceFragment(FeeManagementFragment(), "Fee Management")
                R.id.nav_homework -> replaceFragment(HomeworkFragment(), "Homework")
                R.id.nav_exams -> replaceFragment(ExamsFragment(), "Exams & Grades")
                R.id.nav_announcements -> replaceFragment(AnnouncementsFragment(), "Announcements")
                R.id.nav_resources -> replaceFragment(ResourcesFragment(), "Digital Resources")
                R.id.nav_users -> replaceFragment(UsersFragment(), "User Accounts")
                R.id.nav_logout -> performLogout()
            }
            binding.drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }


    private fun replaceFragment(fragment: Fragment, title: String) {
        supportActionBar?.title = title
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }

    private fun performLogout() {
        lifecycleScope.launch {
            authRepo.logout()
            sessionManager.clearSession()
            RetrofitClient.authToken = null
            RetrofitClient.cookieJar.clear()
            Toast.makeText(this@MainActivity, "Signed out successfully", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this@MainActivity, LoginActivity::class.java))
            finish()
        }
    }


    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (toggle.onOptionsItemSelected(item)) {
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onBackPressed() {
        if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
            binding.drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
}

package com.example.ckclasses.ui.auth

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.example.ckclasses.databinding.ActivityResetPasswordBinding
import com.example.ckclasses.utils.NetworkResult

class ResetPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResetPasswordBinding
    private val viewModel: AuthViewModel by viewModels()
    private var resetToken: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResetPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        resetToken = intent.getStringExtra("resetToken") ?: ""

        binding.btnResetPassword.setOnClickListener {
            val newPass = binding.etNewPassword.text.toString().trim()
            if (newPass.length < 6) {
                Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.resetPassword(resetToken, newPass)
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.resetPasswordState.observe(this) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.btnResetPassword.isEnabled = false
                is NetworkResult.Success -> {
                    binding.btnResetPassword.isEnabled = true
                    Toast.makeText(this, "Password reset successfully! Please log in.", Toast.LENGTH_LONG).show()
                    finish()
                }
                is NetworkResult.Error -> {
                    binding.btnResetPassword.isEnabled = true
                    Toast.makeText(this, result.message ?: "Failed to reset password", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}

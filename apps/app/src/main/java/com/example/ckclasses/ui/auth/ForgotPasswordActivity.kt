package com.example.ckclasses.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.example.ckclasses.databinding.ActivityForgotPasswordBinding
import com.example.ckclasses.utils.NetworkResult

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSendOtp.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            if (email.isEmpty()) {
                Toast.makeText(this, "Enter registered email", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.initiateForgotPassword(email)
        }

        binding.btnVerifyOtp.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val otp = binding.etOtp.text.toString().trim()
            if (otp.length < 6) {
                Toast.makeText(this, "Enter valid 6-digit OTP", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.verifyForgotPasswordOtp(email, otp)
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.forgotPasswordState.observe(this) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.btnSendOtp.isEnabled = false
                is NetworkResult.Success -> {
                    binding.btnSendOtp.isEnabled = true
                    binding.llOtpSection.visibility = View.VISIBLE
                    Toast.makeText(this, result.message ?: "Reset code sent", Toast.LENGTH_SHORT).show()
                }
                is NetworkResult.Error -> {
                    binding.btnSendOtp.isEnabled = true
                    Toast.makeText(this, result.message ?: "Error sending code", Toast.LENGTH_LONG).show()
                }
            }
        }

        viewModel.verifyOtpState.observe(this) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.btnVerifyOtp.isEnabled = false
                is NetworkResult.Success -> {
                    binding.btnVerifyOtp.isEnabled = true
                    val resetToken = result.data ?: ""
                    val intent = Intent(this, ResetPasswordActivity::class.java).apply {
                        putExtra("resetToken", resetToken)
                    }
                    startActivity(intent)
                    finish()
                }
                is NetworkResult.Error -> {
                    binding.btnVerifyOtp.isEnabled = true
                    Toast.makeText(this, result.message ?: "Invalid OTP", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}

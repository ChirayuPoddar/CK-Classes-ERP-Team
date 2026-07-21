package com.example.ckclasses.ui.auth

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.example.ckclasses.databinding.ActivityActivateBinding
import com.example.ckclasses.utils.NetworkResult

class ActivateActivity : AppCompatActivity() {

    private lateinit var binding: ActivityActivateBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityActivateBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnInitiate.setOnClickListener {
            val instId = binding.etInstitutionId.text.toString().trim()
            if (instId.isEmpty()) {
                Toast.makeText(this, "Enter Institution ID", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.initiateActivation(instId)
        }

        binding.btnVerifyActivate.setOnClickListener {
            val instId = binding.etInstitutionId.text.toString().trim()
            val otp = binding.etOtp.text.toString().trim()
            val pass = binding.etNewPassword.text.toString().trim()

            if (otp.length < 6 || pass.isEmpty()) {
                Toast.makeText(this, "Enter valid 6-digit OTP and new password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.verifyActivation(instId, otp, pass)
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.initiateActivateState.observe(this) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.btnInitiate.isEnabled = false
                is NetworkResult.Success -> {
                    binding.btnInitiate.isEnabled = true
                    binding.llVerifySection.visibility = View.VISIBLE
                    result.data?.emailMasked?.let {
                        binding.tvEmailInfo.text = "OTP sent to registered email: $it"
                    }
                    Toast.makeText(this, result.message ?: "OTP sent", Toast.LENGTH_SHORT).show()
                }
                is NetworkResult.Error -> {
                    binding.btnInitiate.isEnabled = true
                    Toast.makeText(this, result.message ?: "Failed", Toast.LENGTH_LONG).show()
                }
            }
        }

        viewModel.verifyActivateState.observe(this) { result ->
            when (result) {
                is NetworkResult.Loading -> binding.btnVerifyActivate.isEnabled = false
                is NetworkResult.Success -> {
                    binding.btnVerifyActivate.isEnabled = true
                    Toast.makeText(this, "Account activated! Please log in.", Toast.LENGTH_LONG).show()
                    finish()
                }
                is NetworkResult.Error -> {
                    binding.btnVerifyActivate.isEnabled = true
                    Toast.makeText(this, result.message ?: "Activation failed", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}

package com.example.ckclasses.utils

import android.content.Context
import android.content.SharedPreferences
import com.example.ckclasses.data.models.User

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE)

    fun saveUserSession(user: User, token: String? = null) {
        prefs.edit().apply {
            putBoolean(Constants.KEY_IS_LOGGED_IN, true)
            putString(Constants.KEY_USER_ID, user.id)
            putString(Constants.KEY_USER_NAME, user.name)
            putString(Constants.KEY_USER_EMAIL, user.email)
            putString(Constants.KEY_USER_ROLE, user.role)
            putString(Constants.KEY_INSTITUTION_ID, user.institutionId ?: "")
            if (!token.isNullOrEmpty()) {
                putString(Constants.KEY_AUTH_TOKEN, token)
            }
            apply()
        }
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(Constants.KEY_IS_LOGGED_IN, false)

    fun getUserRole(): String = prefs.getString(Constants.KEY_USER_ROLE, "student") ?: "student"

    fun getUserName(): String = prefs.getString(Constants.KEY_USER_NAME, "User") ?: "User"

    fun getUserEmail(): String = prefs.getString(Constants.KEY_USER_EMAIL, "") ?: ""

    fun getAuthToken(): String? = prefs.getString(Constants.KEY_AUTH_TOKEN, null)

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}

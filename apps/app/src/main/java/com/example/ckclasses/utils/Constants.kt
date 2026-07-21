package com.example.ckclasses.utils

import com.example.ckclasses.BuildConfig

object Constants {

    // Dynamic BASE_URL injected by Gradle BuildConfig depending on build type (Debug vs Release)
    val BASE_URL: String = BuildConfig.BASE_URL


    
    const val PREF_NAME = "ck_classes_prefs"
    const val KEY_IS_LOGGED_IN = "key_is_logged_in"
    const val KEY_USER_ID = "key_user_id"
    const val KEY_USER_NAME = "key_user_name"
    const val KEY_USER_EMAIL = "key_user_email"
    const val KEY_USER_ROLE = "key_user_role"
    const val KEY_INSTITUTION_ID = "key_institution_id"
    const val KEY_AUTH_TOKEN = "key_auth_token"
}

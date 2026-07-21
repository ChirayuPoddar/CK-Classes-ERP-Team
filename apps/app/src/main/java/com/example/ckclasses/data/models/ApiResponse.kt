package com.example.ckclasses.data.models

import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("message") val message: String? = null,
    @SerializedName("data") val data: T? = null,
    @SerializedName("user") val user: User? = null,
    @SerializedName("accessToken") val accessToken: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("error") val errorElement: JsonElement? = null,
    @SerializedName("resetToken") val resetToken: String? = null
) {

    val error: String?
        get() = getErrorMessage()

    fun getErrorMessage(): String {
        if (message != null) return message
        if (errorElement != null) {
            return if (errorElement.isJsonObject && errorElement.asJsonObject.has("message")) {
                errorElement.asJsonObject.get("message").asString
            } else if (errorElement.isJsonPrimitive) {
                errorElement.asString
            } else {
                errorElement.toString()
            }
        }
        return "An unknown error occurred"
    }
}

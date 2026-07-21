package com.example.ckclasses.data.models

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken

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

    inline fun <reified Item> parseList(gson: Gson = Gson(), preferredKey: String? = null): List<Item> {
        val json = (data as? JsonElement) ?: return emptyList()
        if (json.isJsonNull) return emptyList()

        val listType = object : TypeToken<List<Item>>() {}.type

        if (json.isJsonArray) {
            return try {
                gson.fromJson(json, listType) ?: emptyList()
            } catch (e: Exception) {
                emptyList()
            }
        }

        if (json.isJsonObject) {
            val obj = json.asJsonObject
            val keysToTry = listOfNotNull(
                preferredKey,
                "students", "teachers", "subjects", "attendance", "fees",
                "homework", "exams", "announcements", "resources", "users",
                "data", "list", "docs", "results"
            )
            for (key in keysToTry) {
                if (obj.has(key) && obj.get(key).isJsonArray) {
                    return try {
                        gson.fromJson(obj.get(key), listType) ?: emptyList()
                    } catch (e: Exception) {
                        continue
                    }
                }
            }
        }

        return emptyList()
    }
}

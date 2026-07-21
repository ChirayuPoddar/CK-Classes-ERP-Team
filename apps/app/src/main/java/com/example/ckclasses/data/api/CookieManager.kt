package com.example.ckclasses.data.api

import android.content.Context
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

class MemoryCookieJar : CookieJar {
    private val cookieStore = ConcurrentHashMap<String, MutableList<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val currentCookies = cookieStore[host] ?: mutableListOf()
        
        for (newCookie in cookies) {
            currentCookies.removeAll { it.name == newCookie.name }
            currentCookies.add(newCookie)
        }
        cookieStore[host] = currentCookies
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val host = url.host
        val cookies = cookieStore[host] ?: return emptyList()
        val validCookies = mutableListOf<Cookie>()
        val now = System.currentTimeMillis()
        
        val iterator = cookies.iterator()
        while (iterator.hasNext()) {
            val cookie = iterator.next()
            if (cookie.expiresAt < now) {
                iterator.remove()
            } else if (cookie.matches(url)) {
                validCookies.add(cookie)
            }
        }
        return validCookies
    }

    fun clear() {
        cookieStore.clear()
    }
}

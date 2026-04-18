package com.andyhuang.notifyme.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

data class ExpoPushMessage(
    val to: String,
    val title: String,
    val body: String,
    val data: Map<String, Any?> = emptyMap(),
    val sound: String? = "default",
    val priority: String = "high",
    val channelId: String = "notifications",
)

@Service
class ExpoPushService(
    @Value("\${expo.push.access-token:}") private val accessToken: String,
    @Value("\${expo.push.url:https://exp.host/--/api/v2/push/send}") private val pushUrl: String,
) {
    private val log = LoggerFactory.getLogger(ExpoPushService::class.java)
    private val rest = RestTemplate()

    // Expo accepts up to 100 messages per request.
    private val batchSize = 100

    @Async
    fun sendAsync(messages: List<ExpoPushMessage>) {
        send(messages)
    }

    fun send(messages: List<ExpoPushMessage>) {
        if (messages.isEmpty()) return

        val valid = messages.filter { isExpoPushToken(it.to) }
        if (valid.isEmpty()) return

        for (chunk in valid.chunked(batchSize)) {
            try {
                val headers = HttpHeaders().apply {
                    contentType = MediaType.APPLICATION_JSON
                    accept = listOf(MediaType.APPLICATION_JSON)
                    if (accessToken.isNotBlank()) {
                        set("Authorization", "Bearer $accessToken")
                    }
                }
                val entity = HttpEntity(chunk, headers)
                val response = rest.postForEntity(pushUrl, entity, Map::class.java)
                log.debug("Expo push sent ({} msgs): status={}", chunk.size, response.statusCode)
            } catch (e: Exception) {
                log.warn("Expo push send failed ({} msgs): {}", chunk.size, e.message)
            }
        }
    }

    private fun isExpoPushToken(token: String): Boolean =
        token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[")
}

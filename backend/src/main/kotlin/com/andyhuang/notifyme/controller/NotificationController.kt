package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.Notification
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.NotificationRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// ---- DTOs ----

data class NotificationResponse(
    val id: String,
    val deviceId: String,
    val packageName: String,
    val appName: String,
    val title: String,
    val text: String,
    val timestamp: Long,
    val createdAt: String,
    val updatedAt: String,
    val deletedAt: String?,
    val revision: Long,
)

data class AppSummaryResponse(
    val packageName: String,
    val appName: String,
    val totalCount: Long,
    val latest: NotificationResponse,
)

data class AppSummaryPageResponse(
    val content: List<AppSummaryResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

// ---- Controller ----

/**
 * Read-side conveniences that aren't part of the sync protocol. The actual
 * create/update/delete path lives in [NotificationSyncController]; this
 * controller exposes one server-rendered query — a paginated chat-list view
 * (one row per app, latest notification + count) — that's expensive to
 * compute purely client-side on the very first paint of a fresh device.
 */
@RestController
@RequestMapping("/notifications")
class NotificationController(
    private val notificationRepository: NotificationRepository,
) {

    @GetMapping("/apps")
    fun listApps(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<AppSummaryPageResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val pageable = PageRequest.of(page, size)

        val latestPage = notificationRepository.findLatestPerApp(user, pageable)
        val packageNames = latestPage.content.map { it.packageName }

        val countMap: Map<String, Long> = if (packageNames.isEmpty()) {
            emptyMap()
        } else {
            notificationRepository
                .countByUserGroupedByPackageNames(user, packageNames)
                .associate { row -> (row[0] as String) to (row[1] as Long) }
        }

        val content = latestPage.content.map { n ->
            AppSummaryResponse(
                packageName = n.packageName,
                appName = n.appName,
                totalCount = countMap[n.packageName] ?: 0L,
                latest = n.toResponse(),
            )
        }

        return ResponseEntity.ok(
            AppSummaryPageResponse(
                content = content,
                page = latestPage.number,
                size = latestPage.size,
                totalElements = latestPage.totalElements,
                totalPages = latestPage.totalPages,
            )
        )
    }

    private fun Notification.toResponse() = NotificationResponse(
        id = id.toString(),
        deviceId = device.deviceId,
        packageName = packageName,
        appName = appName,
        title = title,
        text = text,
        timestamp = timestamp,
        createdAt = createdAt.toString(),
        updatedAt = updatedAt.toString(),
        deletedAt = deletedAt?.toString(),
        revision = revision,
    )
}

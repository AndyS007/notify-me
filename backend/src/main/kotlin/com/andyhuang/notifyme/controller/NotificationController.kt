package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.Notification
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.DeviceRepository
import com.andyhuang.notifyme.repository.NotificationRepository
import com.andyhuang.notifyme.service.ExpoPushMessage
import com.andyhuang.notifyme.service.ExpoPushService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

// ---- DTOs ----

data class CreateNotificationRequest(
    val deviceId: String,
    val packageName: String,
    val appName: String,
    val title: String,
    val text: String,
    val timestamp: Long,
)

data class BatchCreateNotificationRequest(
    val notifications: List<CreateNotificationRequest>,
)

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
)

data class BatchCreateNotificationResponse(
    val created: Int,
    val duplicates: Int,
)

data class DeleteNotificationsResponse(
    val deleted: Long,
)

data class NotificationPageResponse(
    val content: List<NotificationResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

// ---- Controller ----

@RestController
@RequestMapping("/notifications")
class NotificationController(
    private val notificationRepository: NotificationRepository,
    private val deviceRepository: DeviceRepository,
    private val expoPushService: ExpoPushService,
) {

    // POST /notifications — create single notification
    @PostMapping
    fun createNotification(
        @RequestBody request: CreateNotificationRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<NotificationResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User

        if (request.deviceId.isBlank()) {
            return ResponseEntity.badRequest().build()
        }
        val device = deviceRepository.findByUserAndDeviceId(user, request.deviceId)
            ?: return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).build()

        if (notificationRepository.existsByNaturalKey(user, device, request.packageName, request.timestamp)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build()
        }

        val notification = notificationRepository.save(
            Notification(
                user = user,
                device = device,
                packageName = request.packageName,
                appName = request.appName,
                title = request.title,
                text = request.text,
                timestamp = request.timestamp,
            )
        )

        fanOutPushNotifications(user, listOf(notification), request.deviceId)

        return ResponseEntity.status(HttpStatus.CREATED).body(notification.toResponse())
    }

    // POST /notifications/batch — batch sync
    @PostMapping("/batch")
    @Transactional
    fun batchCreateNotifications(
        @RequestBody request: BatchCreateNotificationRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<BatchCreateNotificationResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User

        // Reject the whole batch if any item is missing a deviceId — the mobile
        // app must register its device before syncing.
        if (request.notifications.any { it.deviceId.isBlank() }) {
            return ResponseEntity.badRequest().build()
        }

        // Resolve every referenced deviceId up front so we fail fast when the
        // device isn't registered rather than partially saving.
        val requestedDeviceIds = request.notifications.map { it.deviceId }.toSet()
        val devicesByDeviceId = requestedDeviceIds
            .mapNotNull { id -> deviceRepository.findByUserAndDeviceId(user, id)?.let { id to it } }
            .toMap()
        if (devicesByDeviceId.size != requestedDeviceIds.size) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).build()
        }

        var created = 0
        var duplicates = 0
        val savedForFanOut = mutableListOf<Notification>()
        val originDeviceIds = mutableSetOf<String>()

        for (item in request.notifications) {
            val device = devicesByDeviceId.getValue(item.deviceId)

            if (notificationRepository.existsByNaturalKey(user, device, item.packageName, item.timestamp)) {
                duplicates++
                continue
            }

            val saved = notificationRepository.save(
                Notification(
                    user = user,
                    device = device,
                    packageName = item.packageName,
                    appName = item.appName,
                    title = item.title,
                    text = item.text,
                    timestamp = item.timestamp,
                )
            )
            savedForFanOut.add(saved)
            originDeviceIds.add(item.deviceId)
            created++
        }

        // Fan out to all other devices of this user. We use the single origin
        // deviceId when the batch came from one device (the common case) to
        // avoid echoing the push back to the sender.
        val singleOrigin = originDeviceIds.singleOrNull()
        fanOutPushNotifications(user, savedForFanOut, singleOrigin)

        return ResponseEntity.ok(BatchCreateNotificationResponse(created = created, duplicates = duplicates))
    }

    private fun fanOutPushNotifications(
        user: User,
        notifications: List<Notification>,
        originDeviceId: String?,
    ) {
        if (notifications.isEmpty()) return

        val targets = deviceRepository
            .findByUserAndExpoPushTokenIsNotNullAndPushEnabledTrue(user)
            .filter { it.deviceId != originDeviceId }
        if (targets.isEmpty()) return

        val messages = mutableListOf<ExpoPushMessage>()
        for (device in targets) {
            val token = device.expoPushToken ?: continue
            for (n in notifications) {
                val pushTitle = if (n.appName.isNotBlank()) n.appName else n.title
                val pushBody = when {
                    n.appName.isNotBlank() && n.title.isNotBlank() && n.text.isNotBlank() ->
                        "${n.title} — ${n.text}"
                    n.title.isNotBlank() && n.text.isNotBlank() -> n.text
                    n.text.isNotBlank() -> n.text
                    else -> n.title
                }
                messages += ExpoPushMessage(
                    to = token,
                    title = pushTitle,
                    body = pushBody,
                    data = mapOf(
                        "type" to "notification",
                        "notificationId" to n.id.toString(),
                        "packageName" to n.packageName,
                        "timestamp" to n.timestamp,
                    ),
                )
            }
        }
        expoPushService.sendAsync(messages)
    }

    // GET /notifications — paginated list
    @GetMapping
    fun listNotifications(
        @RequestParam(required = false) packageName: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<NotificationPageResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))

        val result = if (packageName != null) {
            notificationRepository.findByUserAndPackageName(user, packageName, pageable)
        } else {
            notificationRepository.findByUser(user, pageable)
        }

        return ResponseEntity.ok(
            NotificationPageResponse(
                content = result.content.map { it.toResponse() },
                page = result.number,
                size = result.size,
                totalElements = result.totalElements,
                totalPages = result.totalPages,
            )
        )
    }

    // GET /notifications/{id} — single notification
    @GetMapping("/{id}")
    fun getNotification(
        @PathVariable id: UUID,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<NotificationResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val notification = notificationRepository.findByIdAndUser(id, user)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(notification.toResponse())
    }

    // DELETE /notifications/{id} — delete single
    @DeleteMapping("/{id}")
    @Transactional
    fun deleteNotification(
        @PathVariable id: UUID,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val deleted = notificationRepository.deleteByIdAndUser(id, user)
        return if (deleted > 0) ResponseEntity.noContent().build()
        else ResponseEntity.notFound().build()
    }

    // DELETE /notifications — bulk delete
    @DeleteMapping
    @Transactional
    fun deleteNotifications(
        @RequestParam(required = false) packageName: String?,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<DeleteNotificationsResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val deleted = if (packageName != null) {
            notificationRepository.deleteByUserAndPackageName(user, packageName)
        } else {
            notificationRepository.deleteByUser(user)
        }
        return ResponseEntity.ok(DeleteNotificationsResponse(deleted = deleted))
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
    )
}

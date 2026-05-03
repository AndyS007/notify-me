package com.andyhuang.notifyme.controller

import com.andyhuang.notifyme.entity.Notification
import com.andyhuang.notifyme.entity.User
import com.andyhuang.notifyme.filter.ClerkAuthFilter
import com.andyhuang.notifyme.repository.DeviceRepository
import com.andyhuang.notifyme.repository.NotificationRepository
import com.andyhuang.notifyme.service.ExpoPushMessage
import com.andyhuang.notifyme.service.ExpoPushService
import com.andyhuang.notifyme.service.NotificationRevisionService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

// ---- DTOs ----

/**
 * One sync record from the client. `id` is the client-supplied UUID; the
 * server treats every push as a full upsert keyed by `id`. `updatedAt` (ms
 * since epoch) is the client wall-clock used for last-write-wins conflict
 * resolution between two devices that touched the same record.
 *
 * `deletedAt` non-null marks a soft delete — the row is retained server-side
 * so that other devices learn about the deletion on their next pull.
 */
data class SyncPushItem(
    val id: String,
    val deviceId: String,
    val packageName: String,
    val appName: String,
    val title: String,
    val text: String,
    val timestamp: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class SyncPushRequest(
    val items: List<SyncPushItem>,
)

/**
 * Per-item result so the client can update its local row's `serverRevision`
 * and clear its pending flag.
 *
 * `accepted=false` means the server kept its newer copy (LWW); the client
 * should accept the server version on its next pull.
 */
data class SyncPushResultItem(
    val id: String,
    val accepted: Boolean,
    val revision: Long,
)

data class SyncPushResponse(
    val results: List<SyncPushResultItem>,
)

data class SyncRecord(
    val id: String,
    val deviceId: String,
    val packageName: String,
    val appName: String,
    val title: String,
    val text: String,
    val timestamp: Long,
    val updatedAt: Long,
    val deletedAt: Long?,
    val revision: Long,
)

/**
 * One page of pull results. `nextSince` is set when paginating ASC (forward
 * incremental), `nextBefore` when paginating DESC (initial bootstrap),
 * `hasMore` indicates whether the cursor should be advanced again.
 *
 * `serverRevision` is the current head — clients can use this as their
 * `lastSyncRevision` once they've drained the entire stream.
 */
data class SyncPullResponse(
    val items: List<SyncRecord>,
    val nextSince: Long?,
    val nextBefore: Long?,
    val hasMore: Boolean,
    val serverRevision: Long,
)

// ---- Controller ----

/**
 * Implements the pull/push sync protocol described in the design doc.
 *
 *  - `GET /sync/notifications` — incremental pull (`since`) or bootstrap
 *    pull (`before`). Returns at most `limit` records ordered by revision.
 *  - `POST /sync/notifications` — push pending records. Server upserts by
 *    client-supplied UUID and applies LWW on `updatedAt`.
 *
 * The legacy non-sync endpoints stay in [NotificationController] for the
 * UI-side conveniences (`/notifications/apps` chat-list view).
 */
@RestController
@RequestMapping("/sync/notifications")
class NotificationSyncController(
    private val notificationRepository: NotificationRepository,
    private val deviceRepository: DeviceRepository,
    private val revisionService: NotificationRevisionService,
    private val expoPushService: ExpoPushService,
) {

    @GetMapping
    fun pull(
        @RequestParam(required = false) since: Long?,
        @RequestParam(required = false) before: Long?,
        @RequestParam(defaultValue = "200") limit: Int,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SyncPullResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User
        val capped = limit.coerceIn(1, 500)
        val pageable = PageRequest.of(0, capped)

        // `before` takes precedence — that's how a fresh device walks history
        // newest-first. Otherwise we treat `since=null` as `since=0` so the
        // very first incremental call still works.
        val (rows, head) = if (before != null) {
            val items = notificationRepository.findByUserBeforeRevision(user, before, pageable)
            items to items.minOfOrNull { it.revision }
        } else {
            val items = notificationRepository.findByUserSinceRevision(user, since ?: 0, pageable)
            items to items.maxOfOrNull { it.revision }
        }

        val hasMore = rows.size == capped
        val nextSince = if (before == null) head else null
        val nextBefore = if (before != null) head else null
        val currentHead = revisionService.peek()

        return ResponseEntity.ok(
            SyncPullResponse(
                items = rows.map { it.toSyncRecord() },
                nextSince = nextSince,
                nextBefore = nextBefore,
                hasMore = hasMore,
                serverRevision = currentHead,
            )
        )
    }

    @PostMapping
    @Transactional
    fun push(
        @RequestBody request: SyncPushRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<SyncPushResponse> {
        val user = httpRequest.getAttribute(ClerkAuthFilter.USER_ATTRIBUTE) as User

        if (request.items.isEmpty()) {
            return ResponseEntity.ok(SyncPushResponse(results = emptyList()))
        }
        if (request.items.any { it.deviceId.isBlank() }) {
            return ResponseEntity.badRequest().build()
        }

        // Fail fast if any referenced device isn't registered to this user —
        // we don't want partial saves.
        val deviceIds = request.items.map { it.deviceId }.toSet()
        val devicesByDeviceId = deviceIds
            .mapNotNull { id -> deviceRepository.findByUserAndDeviceId(user, id)?.let { id to it } }
            .toMap()
        if (devicesByDeviceId.size != deviceIds.size) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY).build()
        }

        val results = mutableListOf<SyncPushResultItem>()
        val freshlyCreated = mutableListOf<Notification>()
        val originDeviceIds = mutableSetOf<String>()

        for (item in request.items) {
            val itemId = runCatching { UUID.fromString(item.id) }.getOrNull()
                ?: return ResponseEntity.badRequest().build()

            val device = devicesByDeviceId.getValue(item.deviceId)
            val incomingUpdatedAt = Instant.ofEpochMilli(item.updatedAt)
            val existing = notificationRepository.findByIdAndUser(itemId, user)

            if (existing != null) {
                // Last-write-wins: ignore stale updates so a slow retry from
                // device A doesn't clobber device B's later edit.
                if (!incomingUpdatedAt.isAfter(existing.updatedAt)) {
                    results += SyncPushResultItem(
                        id = item.id,
                        accepted = false,
                        revision = existing.revision,
                    )
                    continue
                }
                existing.device = device
                existing.packageName = item.packageName
                existing.appName = item.appName
                existing.title = item.title
                existing.text = item.text
                existing.timestamp = item.timestamp
                existing.updatedAt = incomingUpdatedAt
                existing.deletedAt = item.deletedAt?.let(Instant::ofEpochMilli)
                existing.revision = revisionService.next()
                notificationRepository.save(existing)
                results += SyncPushResultItem(
                    id = item.id,
                    accepted = true,
                    revision = existing.revision,
                )
            } else {
                val saved = notificationRepository.save(
                    Notification(
                        id = itemId,
                        user = user,
                        device = device,
                        packageName = item.packageName,
                        appName = item.appName,
                        title = item.title,
                        text = item.text,
                        timestamp = item.timestamp,
                        deletedAt = item.deletedAt?.let(Instant::ofEpochMilli),
                        revision = revisionService.next(),
                        createdAt = Instant.now(),
                        updatedAt = incomingUpdatedAt,
                    )
                )
                if (saved.deletedAt == null) {
                    freshlyCreated += saved
                    originDeviceIds += item.deviceId
                }
                results += SyncPushResultItem(
                    id = item.id,
                    accepted = true,
                    revision = saved.revision,
                )
            }
        }

        // Fan-out push notifications only for newly inserted (non-deleted)
        // rows, mirroring legacy batch behaviour. Updates and soft-deletes
        // don't trigger pushes — other devices will learn about them on the
        // next pull.
        val singleOrigin = originDeviceIds.singleOrNull()
        fanOut(user, freshlyCreated, singleOrigin)

        return ResponseEntity.ok(SyncPushResponse(results = results))
    }

    private fun fanOut(
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
                        "revision" to n.revision,
                    ),
                )
            }
        }
        expoPushService.sendAsync(messages)
    }

    private fun Notification.toSyncRecord() = SyncRecord(
        id = id.toString(),
        deviceId = device.deviceId,
        packageName = packageName,
        appName = appName,
        title = title,
        text = text,
        timestamp = timestamp,
        updatedAt = updatedAt.toEpochMilli(),
        deletedAt = deletedAt?.toEpochMilli(),
        revision = revision,
    )
}

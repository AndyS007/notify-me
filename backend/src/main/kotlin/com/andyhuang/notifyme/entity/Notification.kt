package com.andyhuang.notifyme.entity

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * One captured notification, identified by a client-supplied UUID so that
 * inserts are idempotent across retries and across devices.
 *
 * `revision` is the server-assigned monotonic counter that drives sync. It is
 * read by clients as a cursor: each pull asks for `revision > lastSeen` and
 * the server hands them back in revision order.
 *
 * Deletes are soft (`deletedAt`) so that a delete on one device propagates as
 * an upsert to others rather than vanishing silently.
 */
@Entity
@Table(
    name = "notifications",
    uniqueConstraints = [
        // Defensive natural-key constraint — with client-supplied UUIDs, the
        // primary dedup key is `id`, but two devices accidentally producing
        // the exact same millisecond timestamp for the same package would
        // still be a logic error worth surfacing.
        UniqueConstraint(
            name = "uk_notification_natural_key",
            columnNames = ["user_id", "device_id", "package_name", "timestamp"],
        ),
    ],
    indexes = [
        Index(name = "idx_notification_user_revision", columnList = "user_id,revision"),
        Index(name = "idx_notification_user_pkg_ts", columnList = "user_id,package_name,timestamp"),
    ],
)
class Notification(
    @Id
    val id: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    var device: Device,

    @Column(name = "package_name", nullable = false)
    var packageName: String,

    @Column(name = "app_name", nullable = false)
    var appName: String,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "text", columnDefinition = "TEXT")
    var text: String,

    @Column(name = "timestamp", nullable = false)
    var timestamp: Long,

    @Column(name = "deleted_at")
    var deletedAt: Instant? = null,

    /**
     * Stamped by [com.andyhuang.notifyme.service.NotificationRevisionService]
     * from a Postgres sequence on every save. The `columnDefinition` lets
     * Hibernate `ddl-auto=update` add the column to an existing populated
     * table — without a default, Postgres rejects ALTER TABLE ADD COLUMN
     * NOT NULL on a non-empty table.
     */
    @Column(
        name = "revision",
        nullable = false,
        columnDefinition = "BIGINT NOT NULL DEFAULT 0",
    )
    var revision: Long = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

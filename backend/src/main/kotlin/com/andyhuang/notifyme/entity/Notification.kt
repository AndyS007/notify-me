package com.andyhuang.notifyme.entity

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "notifications",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_notification_natural_key",
            columnNames = ["user_id", "device_id", "package_name", "timestamp"]
        )
    ]
)
class Notification(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    val device: Device,

    @Column(name = "package_name", nullable = false)
    val packageName: String,

    @Column(name = "app_name", nullable = false)
    val appName: String,

    @Column(name = "title", nullable = false)
    val title: String,

    @Column(name = "text", columnDefinition = "TEXT")
    val text: String,

    @Column(name = "timestamp", nullable = false)
    val timestamp: Long,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

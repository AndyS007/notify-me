package com.andyhuang.notifyme.entity

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "sms_messages",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_sms_natural_key",
            columnNames = ["user_id", "device_id", "address", "timestamp"]
        )
    ]
)
class SmsMessage(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    val device: Device? = null,

    @Column(name = "address", nullable = false)
    val address: String,

    @Column(name = "body", columnDefinition = "TEXT")
    val body: String,

    @Column(name = "timestamp", nullable = false)
    val timestamp: Long,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

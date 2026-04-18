package com.andyhuang.notifyme.entity

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "devices")
class Device(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "device_id", nullable = false)
    val deviceId: String,

    @Column(name = "device_name")
    val deviceName: String?,

    @Column(name = "brand")
    val brand: String?,

    @Column(name = "model")
    val model: String?,

    @Column(name = "os_name")
    val osName: String?,

    @Column(name = "os_version")
    val osVersion: String?,

    @Column(name = "app_version")
    val appVersion: String?,

    @Column(name = "expo_push_token")
    var expoPushToken: String? = null,

    @Column(name = "platform")
    var platform: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
